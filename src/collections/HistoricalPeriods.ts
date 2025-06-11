import { CollectionConfig } from 'payload/types'

const HistoricalPeriods: CollectionConfig = {
  slug: 'historical-periods',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'period_date.year', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'conventional_name',
      label: 'Conventional Name (for reference)',
      type: 'text',
      admin: {
        placeholder: 'e.g., Neolithic, Medieval, Iron Age',
      },
    },

    // The new, improved date structure using a 'group' field
    {
      name: 'period_date',
      label: 'Period Date Information',
      type: 'group',
      fields: [
        {
          name: 'year',
          label: 'Start Year (Use negative for BCE)',
          type: 'number',
          required: true,
          admin: {
            // This makes the fields appear side-by-side in the admin panel
            width: '50%',
          },
        },
        {
          name: 'era',
          type: 'select',
          required: true,
          defaultValue: 'BCE/CE',
          options: [
            { label: 'BCE / CE', value: 'BCE/CE' }, // Academic Standard
            { label: 'BC / AD', value: 'BC/AD' }, // Common Standard
            { label: 'BP (Before Present)', value: 'BP' }, // Archaeological
          ],
          admin: {
            width: '50%',
          },
        },
        {
          name: 'precision',
          label: 'Date Precision',
          type: 'text',
          admin: {
            placeholder: 'e.g., c. 1235, Mid-13th Century, Approximately',
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}

export default HistoricalPeriods
