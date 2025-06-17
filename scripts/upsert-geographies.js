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
  try {
    const response = await fetch(query)
    if (!response.ok) {
      console.error(`API error when finding ${slug} "${name}": ${response.status}`)
      return null
    }
    const data = await response.json()
    return data.docs && data.docs.length > 0 ? data.docs[0] : null
  } catch (e) {
    console.error(`Network error finding ${slug} for name "${name}":`, e)
    return null
  }
}

// --- MAIN SCRIPT ---
async function upsertGeographies() {
  console.log(`--- Starting Upsert for ${COLLECTION_SLUG} ---`)
  const rows = []
  const csvPath = path.join(__dirname, `../data/${COLLECTION_SLUG}.csv`)

  try {
    await new Promise((resolve, reject) => {
      if (!fs.existsSync(csvPath)) {
        return reject(new Error(`CSV file not found at ${csvPath}`))
      }
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', (err) => reject(err))
    })
  } catch (err) {
    console.error('CRITICAL ERROR: Failed to read CSV file.', err)
    return // Exit if CSV can't be read
  }

  console.log(`CSV file processed. Found ${rows.length} entries to process.`)

  let createdCount = 0,
    updatedCount = 0,
    skippedCount = 0

  for (const row of rows) {
    if (!row.name || !row.type) {
      console.error(`[SKIP] Row is missing 'name' or 'type'. Data:`, row)
      skippedCount++
      continue
    }

    try {
      // --- NEW LOGIC FOR MULTIPLE PARENTS ---
      const parentIds = []
      if (row.containing_regions_names) {
        const parentNames = row.containing_regions_names.split('|').map((name) => name.trim())
        for (const parentName of parentNames) {
          const parentDoc = await findDoc(COLLECTION_SLUG, parentName)
          if (parentDoc) {
            parentIds.push(parentDoc.id)
          } else {
            console.warn(
              `[WARN] Parent region "${parentName}" not found for "${row.name}". It will be skipped.`,
            )
          }
        }
      }
      // ------------------------------------

      const payload = {
        name: row.name.trim(),
        type: row.type.trim(),
        containing_regions: parentIds, // Use the new field name and the array of IDs
      }

      const existingEntry = await findDoc(COLLECTION_SLUG, row.name)

      if (existingEntry) {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}/${existingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const errData = await response.json()
          throw new Error(
            `API PATCH failed with status ${response.status}: ${JSON.stringify(errData)}`,
          )
        }
        console.log(`[UPDATE] Updated "${row.name}"`)
        updatedCount++
      } else {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const errData = await response.json()
          throw new Error(
            `API POST failed with status ${response.status}: ${JSON.stringify(errData)}`,
          )
        }
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
