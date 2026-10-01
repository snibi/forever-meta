import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { specSchema, tierListSchema } from './lib/schema';

const specs = defineCollection({
  loader: glob({ base: './src/content/specs', pattern: '*.json' }),
  schema: specSchema,
});

const tierlists = defineCollection({
  loader: glob({ base: './src/content/tierlists', pattern: '*.json' }),
  schema: tierListSchema,
});

export const collections = { specs, tierlists };
