import sanitizeHtml from 'sanitize-html';

// HTML riche des articles/réalisations — whitelist stricte, rendu via
// set:html côté frontend. Pas de <script>/<style>/<iframe>, pas d'attributs
// d'événement, liens http(s) uniquement, images locales ou https.
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'h2', 'h3', 'h4',
    'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href'],
    img: ['src', 'alt', 'width', 'height'],
  },
  allowedSchemes: ['https', 'http'],
  // Chemins relatifs (/uploads/...) autorisés par défaut ; //proto-relatifs bloqués
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function sanitizeRichHtml(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, OPTIONS);
}
