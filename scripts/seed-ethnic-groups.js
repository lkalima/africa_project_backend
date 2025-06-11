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
  const response = await fetch(query)
  if (!response.ok) return null
  const data = await response.json()
  return data.docs && data.docs.length > 0 ? data.docs[0] : null
}

async function seedEthnicGroups() {
  console.log('--- Seeding Ethnic Groups ---')
  const rows = []
  const csvPath = path.join(__dirname, '../data/ethnic-groups.csv')

  await new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) return reject(new Error('CSV file not found.'))
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CSV file processed. Found ${rows.length} entries.`)
  let createdCount = 0
  let skippedCount = 0

  for (const row of rows) {
    if (!row.name || !row.description_short) {
      console.error(`[SKIP] Row is missing 'name' or 'description_short'. Data:`, row)
      skippedCount++
      continue
    }

    const existing = await findExisting('ethnic-groups', row.name)
    if (existing) {
      console.log(`[SKIP] Ethnic Group "${row.name}" already exists.`)
      skippedCount++
      continue
    }

    const payload = {
      name: row.name.trim(),
      alternative_names: row.alternative_names || '',
      description_short: row.description_short.trim(),
    }

    try {
      const response = await fetch(`${PAYLOAD_API_URL}/ethnic-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`[OK] Successfully created group: "${row.name}"`)
        createdCount++
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.errors?.[0]?.message || 'Unknown error'
        console.error(`[FAIL] Failed to create "${row.name}". Reason: ${errorMessage}`)
        skippedCount++
      }
    } catch (e) {
      console.error(`[FAIL] An unexpected network error for "${row.name}":`, e)
      skippedCount++
    }
  }

  console.log('\n--- Seeding Complete ---')
  console.log(`Successfully created: ${createdCount}`)
  console.log(`Skipped: ${skippedCount}`)
}

seedEthnicGroups()
