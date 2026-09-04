import { readFile } from 'node:fs/promises';

export async function loadRecipe(path) {
  const parsed = JSON.parse(await readFile(path, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Recipe ${path} must contain a JSON object.`);
  return parsed;
}
