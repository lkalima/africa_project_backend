const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const fetch = require('node-fetch')

const PAYLOAD_API_URL = 'http://localhost:3000/api'
const GEOGRAPHIES_CSV_PATH = path.join(__dirname, 'data', 'geographies.csv')

// --- Helper function to find an existing entry by name ---
async function findExisting(slug, name) {
  const query = `${PAYLOAD_API_URL}/${slug}?where[name][equals]=${encodeURIComponent(name)}`
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

// --- Main Seeding Function ---
async function seedGeographies() {
  console.log('--- Seeding Geographies ---')
  const rows = []

  // 1. Read all rows from CSV into memory first
  await new Promise((resolve, reject) => {
    fs.createReadStream(GEOGRAPHIES_CSV_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CSV file processed. Found ${rows.length} entries to process.`)
  let createdCount = 0
  let skippedCount = 0

  // 2. Process each row
  for (const row of rows) {
    // A. Basic validation
    if (!row.name || !row.type) {
      console.error(`[SKIP] Row is missing required 'name' or 'type'. Data:`, row)
      skippedCount++
      continue
    }

    // B. Check for duplicates to prevent errors
    const existing = await findExisting('geographies', row.name)
    if (existing) {
      console.log(`[SKIP] Geography "${row.name}" already exists.`)
      skippedCount++
      continue
    }

    // C. Find the parent region's ID
    let parentId = null
    if (row.parent_region_name && row.parent_region_name.trim() !== '') {
      const parent = await findExisting('geographies', row.parent_region_name)
      if (parent) {
        parentId = parent.id
      } else {
        console.warn(
          `[WARN] Parent region "${row.parent_region_name}" not found for "${row.name}". Creating without parent.`,
        )
      }
    }

    // D. Construct the payload
    const payload = {
      name: row.name.trim(),
      type: row.type.trim(),
      ...(parentId && { parent_region: parentId }),
    }

    // E. Send to Payload API
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
        console.error(
          `[FAIL] Failed to create "${row.name}". Reason:`,
          errorData.errors?.[0]?.message || 'Unknown error',
        )
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
