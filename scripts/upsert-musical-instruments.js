import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

// --- CONFIG ---
const PAYLOAD_API_URL = 'http://localhost:3000/api'
const COLLECTION_SLUG = 'musical-instruments'

// ... copy the `findDoc` helper function from the other scripts ...

// --- MAIN SCRIPT ---
async function upsertMusicalInstruments() {
  console.log(`--- Starting Upsert for ${COLLECTION_SLUG} ---`)
  // ... copy CSV reading logic ...

  for (const row of rows) {
    if (!row.name) {
      /* skip */ continue
    }

    try {
      // --- 1. RESOLVE ALL RELATIONSHIP IDs ---
      const primaryEthnicGroup = await findDoc('ethnic-groups', row.primary_ethnic_group_name)

      const associatedEthnicGroupIds = []
      if (row.associated_ethnic_groups_names) {
        for (const name of row.associated_ethnic_groups_names.split('|')) {
          const doc = await findDoc('ethnic-groups', name.trim())
          if (doc) associatedEthnicGroupIds.push(doc.id)
        }
      }

      const geographyOriginIds = []
      if (row.geography_origin_names) {
        for (const name of row.geography_origin_names.split('|')) {
          const doc = await findDoc('geographies', name.trim())
          if (doc) geographyOriginIds.push(doc.id)
        }
      }

      const historicalContextIds = []
      if (row.historical_context_names) {
        for (const name of row.historical_context_names.split('|')) {
          const doc = await findDoc('historical-periods', name.trim())
          if (doc) historicalContextIds.push(doc.id)
        }
      }

      // --- 2. CONSTRUCT PAYLOAD ---
      const payload = {
        name: row.name.trim(),
        description_short: row.description_short || '',
        sound_source: row.sound_source || '',
        playing_technique: row.playing_technique || '',
        resonator_type: row.resonator_type || '',
        primary_ethnic_group: primaryEthnicGroup ? primaryEthnicGroup.id : null,
        associated_ethnic_groups: associatedEthnicGroupIds,
        geography_origin: geographyOriginIds,
        historical_context: historicalContextIds,
      }

      // --- 3. UPSERT LOGIC (same as other scripts) ---
      const existingEntry = await findDoc(COLLECTION_SLUG, row.name)
      if (existingEntry) {
        // PATCH request logic...
        console.log(`[UPDATE] Updated "${row.name}"`)
      } else {
        // POST request logic...
        console.log(`[CREATE] Created "${row.name}"`)
      }
    } catch (e) {
      console.error(`[FAIL] Error for "${row.name}":`, e.message)
      skippedCount++
      /* ... error handling ... */
    }
  }

  // ... log summary ...
  console.log(`\n--- Upsert Complete ---`)
  console.log(`Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`)
}

upsertMusicalInstruments()
