import { CollectionConfig } from 'payload/types'

const MusicalInstruments: CollectionConfig = {
  slug: 'musical-instruments',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sound_source', 'playing_technique', 'updatedAt'],
  },
  access: {
    // Anyone can perform the 'read' operation
    read: () => true,
    create: () => true,
    update: () => true, // <-- ADD THIS LINE
  },
  fields: [
    // --- Basic Identification ---
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true, // Slugs must be unique
      admin: {
        position: 'sidebar', // Puts it in the sidebar for a cleaner layout
      },
      hooks: {
        // This hook runs before a document is created or updated
        beforeValidate: [
          ({ value, data }) => {
            // If a slug is provided, use it. If not, generate one from the 'name' field.
            if (value) {
              return value
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')
            }
            if (data.name) {
              return data.name
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')
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

    // --- New, Decolonized Classification System ---
    {
      // We will group these fields together for a cleaner layout in the admin panel
      type: 'row',
      fields: [
        {
          name: 'sound_source',
          label: 'Primary Sound Source',
          type: 'select',
          // required: true,
          options: [
            'String',
            'Membrane (Skin/Head)',
            'Body (Solid Object)',
            'Air Column',
            'Friction',
            'Other', // Add "Other" as a selectable option
          ],
          admin: {
            width: '50%', // This makes the fields appear side-by-side
          },
        },
        {
          name: 'sound_source_other',
          label: 'If Other, Please Specify',
          type: 'text',
          admin: {
            width: '50%',
            // This is the magic: The field will only show up if "Other" is selected above
            condition: (data) => data.sound_source === 'Other',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'playing_technique',
          label: 'Primary Playing Technique',
          type: 'select',
          // required: true,
          options: [
            'Plucked',
            'Bowed',
            'Struck',
            'Blown',
            'Shaken',
            'Scraped',
            'Friction',
            'Other', // Add "Other" as a selectable option
          ],
          admin: {
            width: '50%',
          },
        },
        {
          name: 'playing_technique_other',
          label: 'If Other, Please Specify',
          type: 'text',
          admin: {
            width: '50%',
            condition: (data) => data.playing_technique === 'Other',
          },
        },
      ],
    },
    {
      name: 'resonator_type',
      label: 'Resonator Type (Optional)',
      type: 'text', // <-- Change this from 'select' to 'text'
      admin: {
        placeholder: 'e.g., Gourd, Wooden Box, Skin',
      },
    },

    // --- Relational Fields (The Knowledge Graph) ---
    {
      name: 'primary_ethnic_group',
      type: 'relationship',
      relationTo: 'ethnic-groups',
      // required: true,
      hasMany: false,
    },
    {
      name: 'associated_ethnic_groups',
      type: 'relationship',
      relationTo: 'ethnic-groups',
      hasMany: true,
    },
    {
      name: 'geography_origin',
      type: 'relationship',
      relationTo: 'geographies',
      hasMany: true,
    },
    {
      name: 'historical_context',
      type: 'relationship',
      relationTo: 'historical-periods',
      hasMany: true,
    },
    {
      name: 'related_instruments_internal',
      label: 'Related African Instruments',
      type: 'relationship',
      relationTo: 'musical-instruments', // A link back to itself
      hasMany: true,
    },
    {
      name: 'related_instruments_external',
      label: 'Similar Global Instruments (for context)',
      type: 'text',
      admin: {
        placeholder: 'e.g., European Harp, Lute',
      },
    },

    // --- Content & Media Fields ---
    {
      name: 'primary_image',
      type: 'upload',
      relationTo: 'media', // This links to the Media collection
      // required: true,
    },
    {
      name: 'audio_sample',
      type: 'upload',
      relationTo: 'media', // This also links to the Media collection
      // required: true,
    },
    // This is the component for video links we discussed earlier
    // Let's add it now.
    {
      name: 'video_links',
      type: 'array', // Use an 'array' field for a repeatable list of fields
      label: 'Performance/Video Links',
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'Video URL (e.g., YouTube)',
          // required: true,
        },
        {
          name: 'description',
          type: 'text',
          label: 'Brief Description',
        },
      ],
    },
    {
      name: 'description_short',
      type: 'textarea',
      // required: true,
    },
    {
      name: 'description_long',
      type: 'richText',
    },
    {
      name: 'sources',
      type: 'richText', // Rich text allows for formatted links, lists, and notes
    },
  ],
}

export default MusicalInstruments
