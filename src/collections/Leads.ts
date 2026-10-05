import type { CollectionConfig } from 'payload';

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'service', 'budget', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
    create: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'service',
      type: 'text',
      required: true,
    },
    {
      name: 'budget',
      type: 'text',
    },
    {
      name: 'timeline',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'website_contact_form',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'NEW',
      options: [
        { label: 'New Inquiry', value: 'NEW' },
        { label: 'Contacted', value: 'CONTACTED' },
        { label: 'Qualified', value: 'QUALIFIED' },
        { label: 'Proposal Sent', value: 'PROPOSAL_SENT' },
        { label: 'Won / Client', value: 'WON' },
        { label: 'Lost / Closed', value: 'LOST' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
};

