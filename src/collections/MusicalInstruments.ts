// ... imports
const MusicalInstruments: CollectionConfig = {
  slug: 'musical-instruments',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description_short', type: 'textarea' },
    {
      name: 'primary_ethnic_group',
      type: 'relationship',
      relationTo: 'ethnic-groups', // Links to the 'ethnic-groups' collection
      hasMany: false,
    },
    {
      name: 'associated_ethnic_groups',
      type: 'relationship',
      relationTo: 'ethnic-groups',
      hasMany: true, // This makes it a many-to-many relationship
    },
    // ... add other fields like classification, etc.
  ],
}
export default MusicalInstruments
