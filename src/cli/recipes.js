import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeRecipe } from '../lib/recipe.js';

export async function loadRecipe(path) {
  if (!path) throw new Error('Recipe path is required.');
  const absolute = resolve(process.cwd(), path);
  let text;
  try {
    text = await readFile(absolute, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read recipe file ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Recipe file ${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return normalizeRecipe(parsed);
}
