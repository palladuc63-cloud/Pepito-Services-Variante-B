// Assistant SAV du back-office : POST /api/admin/support (JWT requis).
//   {action:'ask', message}            → réponse KB ou suggestions
//   {action:'escalate', name, contact, description, page, transcript}
//     → message source 'sav' en base + email au prestataire + notif ntfy.
import { db } from '../db.js';
import { messages } from '../db/schema.js';
import { upsertProspect } from '../utils/prospects.js';
import { notify } from '../utils/notify.js';
import { sendMail } from '../utils/mailer.js';
import { findKbAnswer } from '../support/matcher.js';

const trim = (v, n) => String(v ?? '').trim().slice(0, n);

export async function support(req, res) {
  try {
    const { action } = req.body ?? {};

    if (action === 'ask') {
      const message = trim(req.body.message, 2000);
      if (message.length < 2) return res.status(400).json({ error: 'Message requis.' });
      const r = findKbAnswer(message);
      if (r.kind === 'answer') {
        const e = r.entry;
        return res.json({ kind: 'answer', entryId: e.id, title: e.title, answer: e.answer, tab: e.tab || null });
      }
      return res.json({
        kind: 'suggestions',
        suggestions: r.suggestions.map((s) => ({ id: s.id, title: s.title, answer: s.answer, tab: s.tab || null })),
      });
    }

    if (action === 'escalate') {
      const name = trim(req.body.name, 150);
      const contact = trim(req.body.contact, 200);
      const description = trim(req.body.description, 5000);
      if (name.length < 2) return res.status(400).json({ error: 'Nom requis.' });
      if (contact.length < 5) return res.status(400).json({ error: 'Email ou téléphone requis.' });
      if (description.length < 5) return res.status(400).json({ error: 'Description trop courte.' });

      const page = trim(req.body.page, 200);
      const transcript = Array.isArray(req.body.transcript) ? req.body.transcript.slice(-10) : [];
      const transcriptTxt = transcript
        .map((m) => `${m?.role === 'user' ? 'Client' : 'Assistant'} : ${trim(m?.text, 2000)}`)
        .filter((l) => !l.endsWith(': '))
        .join('\n');

      const full = [
        `Contact : ${contact}`,
        page ? `Page : ${page}` : null,
        '',
        description,
        transcriptTxt ? `\n— Historique widget —\n${transcriptTxt}` : null,
      ].filter((l) => l !== null).join('\n');

      // Traçable dans le BO : entrée messages avec source 'sav' et pastille
      // « SAV » (projectType) + prospect dédoublonné comme les autres canaux.
      const email = contact.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? contact : null;
      const phone = email ? null : contact;
      await db.insert(messages).values({
        name, email, phone,
        projectType: 'SAV',
        message: full,
        source: 'sav',
      });
      upsertProspect({ name, email, phone, projectType: 'SAV', source: 'sav' });

      // Notification au prestataire : SUPPORT_EMAIL si défini, sinon le
      // destinataire mail habituel (MAIL_TO) — documenté dans AGENTS.md.
      const text = `Nom : ${name}\n${full}`;
      sendMail({
        to: process.env.SUPPORT_EMAIL || undefined,
        subject: `🛠 SAV back-office Pépito — ${name}`,
        text,
      }).catch((e) => console.error('sav mailer:', e.message));
      notify('🛠 SAV back-office Pépito', `${name}\n${description.slice(0, 300)}`);

      return res.status(201).json({ kind: 'escalated' });
    }

    return res.status(400).json({ error: 'Action inconnue.' });
  } catch (err) {
    console.error('support:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
