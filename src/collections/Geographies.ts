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
    {
      name: 'parent_region',
      type: 'relationship',
      relationTo: 'geographies',
      hasMany: false,
    },
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
