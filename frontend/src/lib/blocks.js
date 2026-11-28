// Blocs de contenu éditables (BO → Contenu, table content_blocks).
// Calqué sur AL-Metallerie : les textes du site vivent en blocs « text »
// référencés par leur block_key ; les blocs « html » s'assemblent par zone.
// Tout a un fallback côté code — la page ne casse jamais si la base est vide.
import { getBlocks } from './api.js';

// Map block_key → value (toutes pages confondues, petit volume).
export async function getBlocksMap() {
  const rows = await getBlocks().catch(() => []);
  const map = {};
  for (const b of rows || []) map[b.blockKey] = b.value ?? '';
  return map;
}

// Lookup de texte : valeur du bloc si renseignée, sinon le défaut du code.
// Usage : T('home.process.title', signature.processTitle)
export const blockText = (map, key, fallback) => {
  const v = map?.[key];
  return v !== undefined && v !== '' ? v : fallback;
};

// Remplace les tokens {{block_key}} par la valeur du bloc (blocs html
// pouvant référencer des blocs text/image).
export function substitute(html, map) {
  let out = html;
  for (let i = 0; i < 4; i++) {
    const next = out.replace(/\{\{([a-z0-9_.-]+)\}\}/g, (m, k) =>
      map[k] !== undefined ? map[k] : m);
    if (next === out) break;
    out = next;
  }
  return out;
}
