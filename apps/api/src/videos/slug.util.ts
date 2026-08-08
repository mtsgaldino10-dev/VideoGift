import { randomBytes } from 'crypto';

const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SLUG_LENGTH = 8;

export function generateSlug(): string {
  const bytes = randomBytes(SLUG_LENGTH);
  let slug = '';
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return slug;
}
