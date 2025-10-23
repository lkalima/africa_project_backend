import { CollectionConfig } from 'payload/types'

const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')

const Geographies: CollectionConfig = {
  slug: 'geographies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'updatedAt'],
  },
  access: {
    // Anyone can perform the 'read' operation
    read: () => true,
    create: () => true,
    update: () => true, // <-- ADD THIS LINE
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
            if (value) return formatSlug(value)
            if (data.name) return formatSlug(data.name)
            return value
          },
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        'Continental Zone', // i.e., West Africa, East Africa
        'Ecological Region', // i.e., The Sahel, Nile Valley, Great Lakes
        'Physical Feature', // i.e., Sahara Desert, Congo River, Mount Kilimanjaro
        'Modern Nation', // i.e., Nigeria, Kenya
        'Historical State', // i.e., Kingdom of Benin (link to Historical Period)
        'Province / State', // i.e., Kano State
        'City', // i.e., Lagos
      ],
    },
    // --- NEW, FLEXIBLE RELATIONSHIP ---
    // This replaces parent_region
    {
      name: 'containing_regions',
      label: 'Part Of (Broader Regions)',
      type: 'relationship',
      relationTo: 'geographies',
      hasMany: true, // <-- The key change: allows multiple parents
      admin: {
        description:
          'Link this geography to the larger regions it belongs to (e.g., link a country to its continental and ecological zones).',
        // Optional: Filter so you can only select larger region types
        filterOptions: {
          type: {
            in: ['Continental Zone', 'Ecological Region'],
          },
        },
      },
    },
    // --------------------------------

    {
      name: 'instruments',
      type: 'join',
      collection: 'musical-instruments',
      on: 'geography_origin',
      label: 'Instruments from this Region',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'child_regions',
      type: 'join',
      collection: 'geographies',
      on: 'containing_regions', // <-- UPDATE THIS TO POINT TO THE NEW FIELD.
      label: 'Sub-Regions / Nations',
      admin: { readOnly: true },
    },
    // --- STABLE JOIN FIELD ---
    {
      name: 'ethnic_groups',
      type: 'join',
      collection: 'ethnic-groups',
      // Join ONLY on the direct primary nation link.
      // We will handle the broader region logic on the frontend.
      on: 'primary_nations',
      label: 'Ethnic Groups Primarily Found Here',
      admin: { readOnly: true },
    },
    // -----------------------
    {
      name: 'sources',
      type: 'richText', // Rich text allows for formatted links, lists, and notes
    },
    // We can add a relationship to Historical Periods here later if needed
    // to link, for example, the "Kingdom of Benin" geography to the
    // "Kingdom of Benin Era" historical period.
  ],
}

export default Geographies
