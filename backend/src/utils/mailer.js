// Envoi d'emails via SMTP (OVH). Silencieux si non configuré.
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;

export function mailConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_TO);
}

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 465,
      secure: Number(SMTP_PORT) !== 587,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, replyTo }) {
  if (!mailConfigured()) return false;
  try {
    await getTransporter().sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: to || MAIL_TO,
      replyTo,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error('mailer:', e.message);
    return false;
  }
}
