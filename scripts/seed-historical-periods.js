/* This script reads a CSV file containing data and seeds it into a Payload CMS Historical Periods collection.
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
  const response = await fetch(query)
  if (!response.ok) return null
  const data = await response.json()
  return data.docs && data.docs.length > 0 ? data.docs[0] : null
}

async function seedHistoricalPeriods() {
  console.log('--- Seeding Historical Periods ---')
  const rows = []
  const csvPath = path.join(__dirname, '../data/historical-periods.csv')

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
    if (!row.name || !row.start_year || !row.era) {
      console.error(`[SKIP] Row is missing required 'name', 'start_year', or 'era'. Data:`, row)
      skippedCount++
      continue
    }

    const existing = await findExisting('historical-periods', row.name)
    if (existing) {
      console.log(`[SKIP] Period "${row.name}" already exists.`)
      skippedCount++
      continue
    }

    // --- THIS IS THE KEY CHANGE ---
    // We construct the nested object that matches the 'group' field in the schema.
    const payload = {
      name: row.name.trim(),
      conventional_name: row.conventional_name || '',
      period_date: {
        year: parseInt(row.start_year, 10),
        era: row.era,
        precision: row.precision || '',
      },
      description: row.description || '',
    }
    // ----------------------------

    try {
      const response = await fetch(`${PAYLOAD_API_URL}/historical-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`[OK] Successfully created period: "${row.name}"`)
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

seedHistoricalPeriods()
