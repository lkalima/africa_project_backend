const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const fetch = require('node-fetch')

const PAYLOAD_API_URL = 'http://localhost:3000/api'
const PERIODS_CSV_PATH = path.join(__dirname, 'data', 'historical_periods.csv')

// Re-using the same helper function from the other script
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

async function seedHistoricalPeriods() {
  console.log('--- Seeding Historical Periods ---')
  const rows = []

  await new Promise((resolve, reject) => {
    fs.createReadStream(PERIODS_CSV_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CSV file processed. Found ${rows.length} entries.`)
  let createdCount = 0
  let skippedCount = 0

  for (const row of rows) {
    if (!row.name || !row.year || !row.era) {
      console.error(`[SKIP] Row is missing required 'name', 'year', or 'era'. Data:`, row)
      skippedCount++
      continue
    }

    const existing = await findExisting('historical-periods', row.name)
    if (existing) {
      console.log(`[SKIP] Historical Period "${row.name}" already exists.`)
      skippedCount++
      continue
    }

    // Construct the payload, ensuring year is a number
    const payload = {
      name: row.name.trim(),
      conventional_name: row.conventional_name || '',
      period_date: {
        year: parseInt(row.year, 10),
        era: row.era,
        precision: row.precision || '',
      },
      description: row.description || '',
    }

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

seedHistoricalPeriods()
