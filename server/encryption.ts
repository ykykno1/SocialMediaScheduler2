import crypto from 'crypto';
import { db } from './db.js';

export interface EncryptionResult {
  encrypted: string;
  hash: string;
}

/**
 * Simple encryption service for token security
 * Uses AES-256-CTR for simplicity and reliability
 */
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    // Use environment variable or default key
    const keyHex = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
    this.key = Buffer.from(keyHex, 'hex');
  }

  async initialize() {
    // Simple initialization - just validate key
    if (this.key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (64 hex chars)');
    }
    console.log('Encryption service ready');
  }

  async encryptToken(token: string): Promise<EncryptionResult> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-ctr', this.key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    const result = iv.toString('hex') + ':' + encrypted;
    
    // Create hash for indexing
    const hash = crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    
    return {
      encrypted: result,
      hash
    };
  }

  async decryptToken(encryptedData: string): Promise<string> {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-ctr', this.key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  createTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }
}

export const encryption = new EncryptionService();