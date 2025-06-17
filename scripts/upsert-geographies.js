import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

// --- CONFIG ---
const PAYLOAD_API_URL = 'http://localhost:3000/api'
const COLLECTION_SLUG = 'geographies'

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- HELPER ---
async function findDoc(slug, name) {
  if (!name || name.trim() === '') return null
  const query = `${PAYLOAD_API_URL}/${slug}?where[name][equals]=${encodeURIComponent(name.trim())}&limit=1`
  const response = await fetch(query)
  if (!response.ok) return null
  const data = await response.json()
  return data.docs && data.docs.length > 0 ? data.docs[0] : null
}

// --- MAIN SCRIPT ---
async function upsertGeographies() {
  console.log(`--- Starting Upsert for ${COLLECTION_SLUG} ---`)
  const rows = []
  const csvPath = path.join(__dirname, `../data/${COLLECTION_SLUG}.csv`)

  await new Promise((resolve, reject) => {
    /* ... (same as before) ... */
  })
  console.log(`CSV file processed. Found ${rows.length} entries.`)

  let createdCount = 0,
    updatedCount = 0,
    skippedCount = 0

  for (const row of rows) {
    if (!row.name) {
      /* ... skip if no name ... */ continue
    }

    try {
      const parentDoc = await findDoc(COLLECTION_SLUG, row.parent_region_name)

      const payload = {
        name: row.name.trim(),
        type: row.type.trim(),
        ...(parentDoc && { parent_region: parentDoc.id }),
      }

      const existingEntry = await findDoc(COLLECTION_SLUG, row.name)
      if (existingEntry) {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}/${existingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`API PATCH failed with status ${response.status}`)
        console.log(`[UPDATE] Updated "${row.name}"`)
        updatedCount++
      } else {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`API POST failed with status ${response.status}`)
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

upsertGeographies()
