// Notification push via ntfy (optionnelle — silencieuse si non configurée)
export async function notify(title, body) {
  const base = process.env.NTFY_BASE; // ex: https://ntfy.agencepoint.fr
  const topic = process.env.NTFY_TOPIC;
  if (!base || !topic) return;
  try {
    // Le header Title n'accepte que du Latin-1 — l'UTF-8 complet passe dans
    // le corps du message (ntfy l'affiche comme texte).
    await fetch(`${base.replace(/\/$/, '')}/${topic}`, {
      method: 'POST',
      headers: { Title: title.replace(/[^\x20-\xFF]/g, ''), Priority: 'default', Tags: 'pepito' },
      body: `${title}\n\n${body ?? ''}`,
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error('ntfy notify failed:', err.message);
  }
}
