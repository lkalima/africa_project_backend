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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, EthnicGroups, Geographies, HistoricalPeriods, MusicalInstruments],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Africa Project API', version: '0.0.1' },
    }),
    swaggerUI({}),
  ],

  sharp,
})
