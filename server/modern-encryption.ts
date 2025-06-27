/**
 * Modern AES-256-GCM encryption for auth tokens
 * Replaces deprecated crypto.createCipher with secure implementation
 */
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '32-character-default-key-for-dev';
const ALGORITHM = 'aes-256-gcm';

export interface EncryptedData {
  encrypted: string;
  authTag: string;
  iv: string;
}

export class ModernTokenEncryption {
  private static instance: ModernTokenEncryption;
  private encryptionKey: Buffer;

  constructor() {
    // Ensure we have a 32-byte key for AES-256
    this.encryptionKey = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  }

  static getInstance(): ModernTokenEncryption {
    if (!ModernTokenEncryption.instance) {
      ModernTokenEncryption.instance = new ModernTokenEncryption();
    }
    return ModernTokenEncryption.instance;
  }

  /**
   * Encrypt a token string using AES-256-GCM
   */
  encrypt(token: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(16); // 128-bit IV
      const cipher = crypto.createCipherGCM(ALGORITHM, this.encryptionKey);
      cipher.setIVLength(16);
      
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        authTag: authTag.toString('hex'),
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt a token string using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      const decipher = crypto.createDecipherGCM(ALGORITHM, this.encryptionKey);
      decipher.setIVLength(16);
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt token - may be corrupted or tampered');
    }
  }

  /**
   * Create a hash of the token for lookup without decryption
   */
  createTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);
  }

  /**
   * Encrypt token and return database-ready format
   */
  encryptForStorage(token: string): { 
    encryptedToken: string; 
    tokenHash: string; 
    metadata: string;
  } {
    const encryptedData = this.encrypt(token);
    const tokenHash = this.createTokenHash(token);
    
    return {
      encryptedToken: encryptedData.encrypted,
      tokenHash,
      metadata: JSON.stringify({
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        algorithm: ALGORITHM,
        version: '2.0'
      })
    };
  }

  /**
   * Decrypt token from database format
   */
  decryptFromStorage(encryptedToken: string, metadata: string): string {
    try {
      const meta = JSON.parse(metadata);
      
      const encryptedData: EncryptedData = {
        encrypted: encryptedToken,
        authTag: meta.authTag,
        iv: meta.iv
      };
      
      return this.decrypt(encryptedData);
    } catch (error) {
      console.error('Failed to decrypt from storage:', error);
      throw new Error('Invalid encrypted token format');
    }
  }

  /**
   * Check if token can be decrypted (for validation)
   */
  canDecrypt(encryptedToken: string, metadata: string): boolean {
    try {
      this.decryptFromStorage(encryptedToken, metadata);
      return true;
    } catch {
      return false;
    }
  }
}

export const modernTokenEncryption = ModernTokenEncryption.getInstance();