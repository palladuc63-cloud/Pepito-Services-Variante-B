// Notification push via ntfy (optionnelle — silencieuse si non configurée)
export async function notify(title, body) {
  const base = process.env.NTFY_BASE; // ex: https://ntfy.agencepoint.fr
  const topic = process.env.NTFY_TOPIC;
  if (!base || !topic) return;
  try {
    await fetch(`${base.replace(/\/$/, '')}/${topic}`, {
      method: 'POST',
      headers: { Title: title, Priority: 'default', Tags: 'pepito' },
      body: body ?? '',
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error('ntfy notify failed:', err.message);
  }
}
