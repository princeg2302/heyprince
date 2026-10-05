import type { CollectionConfig } from 'payload';

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'pricingType', 'published', 'sortOrder'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        published: {
          equals: true,
        },
      };
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique URL path segment (e.g., ai-automation, react-development)',
      },
    },
    {
      name: 'shortTitle',
      type: 'text',
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'categoryName',
      type: 'text',
    },
    {
      name: 'cardTheme',
      type: 'select',
      defaultValue: 'black',
      options: [
        { label: 'Black (Dark Slate)', value: 'black' },
        { label: 'White (Light Cream)', value: 'white' },
        { label: 'Red (Accent Branded)', value: 'red' },
        { label: 'Featured (Border Highlight)', value: 'featured' },
      ],
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'featuredBadge',
      type: 'text',
    },
    {
      name: 'iconName',
      type: 'text',
      defaultValue: 'FaCode',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
    },
    {
      name: 'heroDescription',
      type: 'textarea',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'overview',
      type: 'array',
      fields: [
        {
          name: 'paragraph',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'deliverables',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'desc',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'techStack',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'process',
      type: 'array',
      fields: [
        {
          name: 'step',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'desc',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'faqs',
      type: 'array',
      fields: [
        {
          name: 'q',
          type: 'text',
          required: true,
        },
        {
          name: 'a',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'pricingType',
      type: 'select',
      defaultValue: 'custom',
      options: [
        { label: 'Custom Quote', value: 'custom' },
        { label: 'Starting At', value: 'starting_at' },
        { label: 'Fixed Package', value: 'fixed' },
        { label: 'Hourly Retainer', value: 'hourly' },
      ],
    },
    {
      name: 'startingPrice',
      type: 'number',
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroImage',
      type: 'text',
    },
    {
      name: 'seoTitle',
      type: 'text',
    },
    {
      name: 'seoDescription',
      type: 'textarea',
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};

