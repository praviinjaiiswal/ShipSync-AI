import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from environment or deterministic local fallback.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.CUSTOMS_ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    return crypto.createHash('sha256').update(envKey).digest();
  }

  // Development/Test fallback key
  return crypto
    .createHash('sha256')
    .update('shipsync-customs-default-development-encryption-key-2026')
    .digest();
}

export interface EncryptedPayload {
  encryptedData: string; // hex
  iv: string;            // hex
  authTag: string;       // hex
}

/**
 * Encrypts an object or string using AES-256-GCM.
 */
export function encryptCustomsData(data: Record<string, any> | string): EncryptedPayload {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload and verifies the auth tag.
 */
export function decryptCustomsData<T = any>(payload: EncryptedPayload): T {
  const { encryptedData, iv, authTag } = payload;
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
    { authTagLength: AUTH_TAG_LENGTH }
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}

/**
 * Sensitive fields to redact from logs, error reports, and client payloads.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'icegatepassword',
  'dscpin',
  'pin',
  'privatekey',
  'secret',
  'apisecret',
  'token',
  'bearer',
  'authorization',
  'encrypteddata',
  'authtag',
  'certificatedata',
]);

/**
 * Recursively deep-redacts sensitive keys from an object or array.
 */
export function redactSensitiveData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Redact Bearer tokens in headers
    if (obj.toLowerCase().startsWith('bearer ')) {
      return '[REDACTED_BEARER_TOKEN]' as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        if (typeof value === 'string' && value.toLowerCase().startsWith('bearer ')) {
          cleaned[key] = '[REDACTED_BEARER_TOKEN]';
        } else {
          cleaned[key] = '[REDACTED]';
        }
      } else if (typeof value === 'string' && value.toLowerCase().startsWith('bearer ')) {
        cleaned[key] = '[REDACTED_BEARER_TOKEN]';
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = redactSensitiveData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned as T;
  }

  return obj;
}
