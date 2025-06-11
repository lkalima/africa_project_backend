import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PAYLOAD_API_URL = 'http://localhost:3000/api'

// Helper function to find a SINGLE existing entry by name
async function findOne(slug, name) {
  if (!name || name.trim() === '') return null
  const query = `${PAYLOAD_API_URL}/${slug}?where[name][equals]=${encodeURIComponent(name.trim())}&limit=1`
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

// Helper function to find MULTIPLE existing entries by name
async function findMany(slug, namesString, delimiter = ';') {
  if (!namesString || namesString.trim() === '') return []
  const names = namesString
    .split(delimiter)
    .map((name) => name.trim())
    .filter(Boolean) // filter(Boolean) removes empty strings
  const ids = []

  for (const name of names) {
    const found = await findOne(slug, name)
    if (found) {
      ids.push(found.id)
    } else {
      console.warn(`[WARN] Could not find related ${slug} entry for name: "${name}"`)
    }
  }
  return ids
}

async function seedMusicalInstruments() {
  console.log('--- Seeding Musical Instruments ---')
  const rows = []
  const csvPath = path.join(__dirname, '../data/musical-instruments.csv')

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
    if (!row.name || !row.primary_ethnic_group_name || !row.description_short) {
      console.error(`[SKIP] Row for "${row.name}" is missing required fields.`)
      skippedCount++
      continue
    }

    const existing = await findOne('musical-instruments', row.name)
    if (existing) {
      console.log(`[SKIP] Instrument "${row.name}" already exists.`)
      skippedCount++
      continue
    }

    const primaryEthnicGroup = await findOne('ethnic-groups', row.primary_ethnic_group_name)
    if (!primaryEthnicGroup) {
      console.error(
        `[FAIL] Required primary ethnic group "${row.primary_ethnic_group_name}" not found for instrument "${row.name}". Skipping.`,
      )
      skippedCount++
      continue
    }

    // --- THIS IS THE KEY CHANGE ---
    // Start with only the required fields
    const payload = {
      name: row.name.trim(),
      description_short: row.description_short.trim(),
      primary_ethnic_group: primaryEthnicGroup.id,
    }

    // Conditionally add optional fields ONLY if they have a value
    if (row.alternative_names) payload.alternative_names = row.alternative_names
    if (row.sound_source) payload.sound_source = row.sound_source
    if (row.playing_technique) payload.playing_technique = row.playing_technique
    if (row.resonator_type) payload.resonator_type = row.resonator_type
    if (row.related_instruments_external)
      payload.related_instruments_external = row.related_instruments_external

    // For relationships, find the IDs and only add them if the array is not empty
    const associatedEthnicGroupIds = await findMany(
      'ethnic-groups',
      row.associated_ethnic_groups_names,
    )
    if (associatedEthnicGroupIds.length > 0)
      payload.associated_ethnic_groups = associatedEthnicGroupIds

    const geographyOriginIds = await findMany('geographies', row.geography_origin_names)
    if (geographyOriginIds.length > 0) payload.geography_origin = geographyOriginIds

    const historicalContextIds = await findMany('historical-periods', row.historical_context_names)
    if (historicalContextIds.length > 0) payload.historical_context = historicalContextIds

    // We are deliberately leaving out primary_image and audio_sample since we have no data for them

    try {
      const response = await fetch(`${PAYLOAD_API_URL}/musical-instruments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`[OK] Successfully created instrument: "${row.name}"`)
        createdCount++
      } else {
        const errorData = await response.json()
        // A more detailed error log
        const fieldErrors = errorData.errors?.map((e) => e.message).join(', ') || 'Unknown error'
        console.error(`[FAIL] Failed to create "${row.name}". Reason: ${fieldErrors}`)
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

seedMusicalInstruments()
