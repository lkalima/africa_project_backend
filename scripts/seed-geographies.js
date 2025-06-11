/* This script reads a CSV file containing data and seeds it into a Payload CMS Geographies collection.
   It checks for existing entries to avoid duplicates and logs the results of each operation. */

import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PAYLOAD_API_URL = 'http://localhost:3000/api'

async function findExisting(slug, name) {
  if (!name || name.trim() === '') return null
  const query = `${PAYLOAD_API_URL}/${slug}?where[name][equals]=${encodeURIComponent(name.trim())}`
  try {
    const response = await fetch(query)
    if (!response.ok) return null
    const data = await response.json()
    return data.docs && data.docs.length > 0 ? data.docs[0] : null
  } catch (e) {
    console.error(`Error finding existing ${slug} for name "${name}":`, e)
    return null
  }
}

async function seedGeographies() {
  console.log('--- Seeding Geographies ---')
  const rows = []
  const geographiesCsvPath = path.join(__dirname, '../data/geographies.csv')

  await new Promise((resolve, reject) => {
    if (!fs.existsSync(geographiesCsvPath)) {
      return reject(new Error('CSV file not found.'))
    }
    fs.createReadStream(geographiesCsvPath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CSV file processed. Found ${rows.length} entries to process.`)
  let createdCount = 0
  let skippedCount = 0

  for (const row of rows) {
    if (!row.name || !row.type) {
      console.error(`[SKIP] Row is missing required 'name' or 'type'. Data:`, row)
      skippedCount++
      continue
    }

    const existing = await findExisting('geographies', row.name)
    if (existing) {
      console.log(`[SKIP] Geography "${row.name}" already exists.`)
      skippedCount++
      continue
    }

    let parentId = null
    if (row.parent_region_name) {
      const parent = await findExisting('geographies', row.parent_region_name)
      if (parent) {
        parentId = parent.id
      } else {
        console.warn(
          `[WARN] Parent region "${row.parent_region_name}" not found for "${row.name}". Creating without parent.`,
        )
      }
    }

    const payload = {
      name: row.name.trim(),
      type: row.type.trim(),
      ...(parentId && { parent_region: parentId }),
    }

    try {
      const response = await fetch(`${PAYLOAD_API_URL}/geographies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`[OK] Successfully created geography: "${row.name}"`)
        createdCount++
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.errors?.[0]?.message || 'Unknown error'
        console.error(`[FAIL] Failed to create "${row.name}". Reason: ${errorMessage}`)
        skippedCount++
      }
    } catch (e) {
      console.error(`[FAIL] An unexpected network error occurred for "${row.name}":`, e)
      skippedCount++
    }
  }

  console.log('\n--- Seeding Complete ---')
  console.log(`Successfully created: ${createdCount}`)
  console.log(`Skipped (duplicates or errors): ${skippedCount}`)
}

seedGeographies()
