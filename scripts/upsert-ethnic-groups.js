import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

// --- CONFIG ---
const PAYLOAD_API_URL = 'http://localhost:3000/api'
const COLLECTION_SLUG = 'ethnic-groups'

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- HELPER FUNCTIONS ---
async function findDoc(slug, name) {
  if (!name || name.trim() === '') return null
  const query = `${PAYLOAD_API_URL}/${slug}?where[name][equals]=${encodeURIComponent(name.trim())}&limit=1&depth=1`
  try {
    const response = await fetch(query)
    if (!response.ok) return null
    const data = await response.json()
    return data.docs && data.docs.length > 0 ? data.docs[0] : null
  } catch (e) {
    console.error(`Error finding ${slug} for name "${name}":`, e)
    return null
  }
}

// --- MAIN SCRIPT ---
async function upsertEthnicGroups() {
  console.log(`--- Starting Advanced Upsert for ${COLLECTION_SLUG} ---`)
  const rows = []
  const csvPath = path.join(__dirname, `../data/${COLLECTION_SLUG}.csv`)

  await new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      // This line is crucial
      return reject(new Error(`CSV file not found at ${csvPath}`))
    }
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', (err) => reject(err)) // Also handle read errors
  }).catch((err) => {
    console.error('CRITICAL ERROR: Failed to read CSV file.', err)
    process.exit(1) // Exit the script if the CSV can't be read
  })
  console.log(`CSV file processed. Found ${rows.length} entries.`)

  let createdCount = 0,
    updatedCount = 0,
    skippedCount = 0

  for (const row of rows) {
    if (!row.name) {
      console.error(`[SKIP] Row missing 'name':`, row)
      skippedCount++
      continue
    }

    try {
      // --- 1. RESOLVE PRIMARY NATION IDs ---
      const primaryNationIds = []
      const broaderRegionIds = new Set() // Use a Set to avoid duplicate parent regions

      if (row.primary_nations) {
        const nationNames = row.primary_nations.split('|').map((name) => name.trim())
        for (const nationName of nationNames) {
          const nationDoc = await findDoc('geographies', nationName)
          if (nationDoc) {
            primaryNationIds.push(nationDoc.id)
            // --- 2. INFERENCE STEP: GET THE PARENT ---
            if (nationDoc.parent_region && typeof nationDoc.parent_region === 'object') {
              broaderRegionIds.add(nationDoc.parent_region.id)
            }
          } else {
            console.warn(`[WARN] Nation "${nationName}" not found for "${row.name}".`)
          }
        }
      }

      // --- 3. CONSTRUCT THE PAYLOAD ---
      const payload = {
        name: row.name.trim(),
        alternative_names: row.alternative_names || '',
        description_short: row.description_short || '',
        primary_nations: primaryNationIds,
        broader_regions: Array.from(broaderRegionIds), // Convert Set to Array
      }

      // --- 4. UPSERT LOGIC ---
      const existingEntry = await findDoc(COLLECTION_SLUG, row.name)
      if (existingEntry) {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}/${existingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`API PATCH failed with status ${response.status}`)
        console.log(`[UPDATE] Successfully updated "${row.name}"`)
        updatedCount++
      } else {
        const response = await fetch(`${PAYLOAD_API_URL}/${COLLECTION_SLUG}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`API POST failed with status ${response.status}`)
        console.log(`[CREATE] Successfully created "${row.name}"`)
        createdCount++
      }
    } catch (e) {
      console.error(`[FAIL] An error occurred for "${row.name}":`, e.message)
      skippedCount++
    }
  }

  console.log('\n--- Upsert Complete ---')
  console.log(`Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`)
}

upsertEthnicGroups()
