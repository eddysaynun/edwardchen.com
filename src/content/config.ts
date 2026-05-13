import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).default([]),
    pinned: z.boolean().default(false),
  }),
});

export const collections = { blog };