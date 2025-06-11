const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const fetch = 'node-fetch'

const PAYLOAD_API_URL = 'http://localhost:3000/api'
const GROUPS_CSV_PATH = path.join(__dirname, 'data', 'ethnic_groups.csv')

// Re-using the same helper function
async function findExisting(slug, name) {
  // ... (copy the findExisting function from one of the scripts above) ...
}

async function seedEthnicGroups() {
  console.log('--- Seeding Ethnic Groups ---')
  const rows = []

  await new Promise((resolve, reject) => {
    fs.createReadStream(GROUPS_CSV_PATH)
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
      console.error(`[SKIP] Row is missing required 'name' or 'description_short'. Data:`, row)
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
  console.log(`Skipped: ${skippedCount}`)
}

seedEthnicGroups()
