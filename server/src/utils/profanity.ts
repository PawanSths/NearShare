const BLOCKED_WORDS = new Set([
  'damn', 'hell', 'ass', 'shit', 'fuck', 'bitch', 'crap',
  'bastard', 'dick', 'cock', 'piss', 'slut', 'whore',
]);

const REPLACEMENT = '****';

export function containsProfanity(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  return words.some((w) => BLOCKED_WORDS.has(w.replace(/[^a-z]/g, '')));
}

export function filterProfanity(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => {
      const clean = w.replace(/[^a-z]/g, '');
      return BLOCKED_WORDS.has(clean) ? REPLACEMENT : w;
    })
    .join(' ');
}
