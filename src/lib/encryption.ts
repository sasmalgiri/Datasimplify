/**
 * AES-256-GCM encryption utility for storing user API keys
 *
 * Keys are encrypted using a master key stored in environment variables.
 * Format: iv:authTag:encryptedData (all hex-encoded)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the master encryption key from environment
 * Must be 64 hex characters (32 bytes = 256 bits)
 */
function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY is not set. Generate one with: openssl rand -hex 32'
    );
  }

  if (key.length !== 64) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt an API key using AES-256-GCM
 *
 * @param plaintext - The API key to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all hex)
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext provided');
  }

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all hex-encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an API key encrypted with encryptApiKey
 *
 * @param ciphertext - The encrypted string (iv:authTag:encrypted format)
 * @returns The original plaintext API key
 */
export function decryptApiKey(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('Invalid ciphertext provided');
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const masterKey = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Get a hint for the API key (last 4 characters)
 * Used for display purposes without exposing the full key
 *
 * @param apiKey - The full API key
 * @returns Last 4 characters of the key
 */
export function getKeyHint(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '****';
  }
  return apiKey.slice(-4);
}

/**
 * Check if the encryption key is properly configured
 * Useful for health checks
 */
export function isEncryptionConfigured(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random encryption master key (for setup purposes)
 * NOTE: In production, use: openssl rand -hex 32
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
