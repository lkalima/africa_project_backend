import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

// --- CONFIG ---
const PAYLOAD_API_URL = 'http://localhost:3000/api'
const COLLECTION_SLUG = 'historical-periods'

// ... (copy findDoc helper function from above) ...

// --- MAIN SCRIPT ---
async function upsertHistoricalPeriods() {
  console.log(`--- Starting Upsert for ${COLLECTION_SLUG} ---`)
  // ... (copy CSV reading logic from above) ...

  for (const row of rows) {
    if (!row.name) {
      /* ... skip if no name ... */ continue
    }

    try {
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

      const existingEntry = await findDoc(COLLECTION_SLUG, row.name)
      if (existingEntry) {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}/${existingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`API PATCH failed`)
        console.log(`[UPDATE] Updated "${row.name}"`)
        updatedCount++
      } else {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`API POST failed`)
        console.log(`[CREATE] Created "${row.name}"`)
        createdCount++
      }
    } catch (e) {
      console.error(`[FAIL] Error for "${row.name}":`, e.message)
      skippedCount++
    }
  }

  console.log(`\n--- Upsert Complete ---`)
  console.log(`Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`)
}

upsertHistoricalPeriods()
