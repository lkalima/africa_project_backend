import { CollectionConfig } from 'payload/types'

const EthnicGroups: CollectionConfig = {
  slug: 'ethnic-groups',
  admin: {
    useAsTitle: 'name', // This is the fix for the display name issue!
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // We'll add more fields later
  ],
}

export default EthnicGroups
