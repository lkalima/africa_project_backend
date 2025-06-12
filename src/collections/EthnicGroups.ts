import { CollectionConfig } from 'payload/types'

// The hook function to generate a slug
const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')

const EthnicGroups: CollectionConfig = {
  // The 'slug' is the name of the collection in the API (e.g., /api/ethnic-groups)
  slug: 'ethnic-groups',

  // The 'admin' object configures the admin panel experience
  admin: {
    // This tells Payload to use the 'name' field as the title in lists and relationships
    useAsTitle: 'name',
    // Sets the default sorting order in the admin list view
    defaultColumns: ['name', 'updatedAt'],
  },

  access: {
    // Anyone can perform the 'read' operation
    read: () => true,
    create: () => true,
  },

  // The 'fields' array defines the data structure
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true, // Ensures no two ethnic groups have the same name
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) {
              return formatSlug(value)
            }
            if (data.name) {
              return formatSlug(data.name)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'alternative_names',
      type: 'text',
    },
    {
      name: 'description_short',
      type: 'textarea',
      required: true,
    },
    {
      name: 'sources',
      type: 'richText', // Rich text allows for formatted links, lists, and notes
    },
  ],
}

export default EthnicGroups
