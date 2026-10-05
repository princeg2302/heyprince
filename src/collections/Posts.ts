import type { CollectionConfig } from 'payload';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'status', 'publishedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: {
          equals: 'published',
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
        description: 'URL segment for insights (e.g. freelancing-tips-it-professionals-2026)',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'readMins',
      type: 'text',
      defaultValue: '5 min',
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
      name: 'author',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          defaultValue: 'Prince',
          required: true,
        },
        {
          name: 'role',
          type: 'text',
          defaultValue: 'Senior Full Stack Engineer & IT Consultant',
        },
        {
          name: 'avatar',
          type: 'text',
          defaultValue: 'https://heyprince.in/wp-content/uploads/2025/09/cropped-prince-profile.webp',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'paragraphs',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'textarea',
              required: true,
            },
          ],
        },
        {
          name: 'bulletPoints',
          type: 'array',
          fields: [
            {
              name: 'point',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'quote',
          type: 'textarea',
        },
        {
          name: 'proTip',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coverImage',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
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
      name: 'canonical',
      type: 'text',
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};

