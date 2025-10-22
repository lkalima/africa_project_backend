// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
// Import collections here
import EthnicGroups from './collections/EthnicGroups'
import Geographies from './collections/Geographies'
import HistoricalPeriods from './collections/HistoricalPeriods'
import MusicalInstruments from './collections/MusicalInstruments'

// --- 1. IMPORT THE NEW PLUGINS ---
import { openapi } from 'payload-oapi'
import { swaggerUI } from 'payload-oapi'
import { searchPlugin } from '@payloadcms/plugin-search'
import { extractPlainText } from './utils/extractPlainText'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, EthnicGroups, Geographies, HistoricalPeriods, MusicalInstruments],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  sharp,
  // ------------------------------------------
  // ------------------------------------------

  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Africa Project API', version: '0.0.1' },
    }),
    swaggerUI({}),
    searchPlugin({
      collections: ['musical-instruments', 'ethnic-groups', 'geographies', 'historical-periods'],
      // --- ADD THIS BLOCK BACK ---
      defaultPriorities: {
        'musical-instruments': 9,
        'ethnic-groups': 8,
        geographies: 10,
        'historical-periods': 7,
      },
      // -------------------------
      // --- 2. ADD THE SEARCH PLUGIN ---
      searchOverrides: {
        slug: 'search',
        access: { read: () => true },

        fields: ({ defaultFields }) => [
          ...defaultFields,
          { name: 'description', type: 'textarea', admin: { readOnly: true } },
        ],
      },
      // --- THE DEFINITIVE `beforeSync` HOOK ---
      // This hook modifies the searchDoc before it's saved.
      beforeSync: ({ originalDoc, searchDoc }) => {
        const collection = searchDoc.doc.relationTo

        // Prepare the data to be returned. We modify the existing searchDoc.
        const updatedSearchDoc = { ...searchDoc }

        if (collection === 'musical-instruments') {
          updatedSearchDoc.title = originalDoc.name
          updatedSearchDoc.description = [
            originalDoc.description_short,
            extractPlainText(originalDoc.description_long?.root?.children),
          ]
            .filter(Boolean)
            .join(' ')
        }

        if (collection === 'ethnic-groups') {
          updatedSearchDoc.title = originalDoc.name
          updatedSearchDoc.description = originalDoc.description_short
        }

        if (collection === 'geographies') {
          updatedSearchDoc.title = originalDoc.name
          updatedSearchDoc.description = `A ${originalDoc.type} in Africa.`
        }

        if (collection === 'historical-periods') {
          updatedSearchDoc.title = originalDoc.name
          updatedSearchDoc.description = originalDoc.description
        }

        // Return the modified document
        return updatedSearchDoc
      },
    }),
  ],
})
