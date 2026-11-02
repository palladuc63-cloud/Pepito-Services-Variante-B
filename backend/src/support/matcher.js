// Matching local de la base SAV (backend/src/support/kb.js) — 100 %
// déterministe, aucune dépendance externe : c'est ce qui garantit que
// l'assistant reste dans son périmètre (BO Pépito + technique basique).
import { KB } from './kb.js';

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9àâäéèêëîïôöùûüç\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreEntry(message, entry) {
  const norm = ` ${normalize(message)} `;
  const words = norm.trim().split(' ');
  let score = 0;
  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (k.length < 3) continue;
    // Égalité, préfixe commun ≥4 lettres (flexions : publie/publier)
    // ou sous-chaîne.
    if (words.some((w) => w === k || (w.length >= 4 && k.length >= 4 && (w.startsWith(k) || k.startsWith(w))))) score += 2;
    else if (norm.includes(k)) score += 1;
  }
  for (const ph of entry.phrases) {
    if (norm.includes(normalize(ph))) score += 6;
  }
  return score;
}

// Seuil : 4 = verbe + sujet (« créer un article ») ou deux mots-clés —
// en-dessous on propose des pistes plutôt qu'une réponse fausse.
const ANSWER_THRESHOLD = 4;

export function findKbAnswer(message) {
  const scored = KB
    .map((entry) => ({ entry, score: scoreEntry(message, entry) }))
    .sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score >= ANSWER_THRESHOLD) {
    return { kind: 'answer', entry: scored[0].entry };
  }
  const suggestions = scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.entry);
  return { kind: 'suggestions', suggestions };
}
