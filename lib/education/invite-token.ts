/**
 * Generates a random invite token: 8–10 chars, A-Z + 0-9 (uppercase + digits), not easily guessable.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MIN_LENGTH = 8;
const MAX_LENGTH = 10;

export function generateInviteToken(): string {
  const length =
    MIN_LENGTH + Math.floor(Math.random() * (MAX_LENGTH - MIN_LENGTH + 1));
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
