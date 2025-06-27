/**
 * Simple and reliable token encryption for auth tokens
 */
import crypto from 'crypto';

const ENCRYPTION_KEY = 'shabbat-robot-secure-key-32-ch!!';
const ALGORITHM = 'aes-256-cbc';

export class TokenEncryption {
  private static instance: TokenEncryption;
  private encryptionKey: Buffer;

  constructor() {
    // Fixed 32-byte key for consistency
    this.encryptionKey = Buffer.from(ENCRYPTION_KEY, 'utf8');
  }

  static getInstance(): TokenEncryption {
    if (!TokenEncryption.instance) {
      TokenEncryption.instance = new TokenEncryption();
    }
    return TokenEncryption.instance;
  }

  /**
   * Encrypt a token string
   */
  encrypt(token: string): { encrypted: string; authTag: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Simple hash for integrity check
    const hash = crypto.createHash('sha256');
    hash.update(encrypted + iv.toString('hex') + ENCRYPTION_KEY);
    const authTag = hash.digest('hex');
    
    return {
      encrypted,
      authTag,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt a token string
   */
  decrypt(encryptedData: { encrypted: string; authTag: string; iv: string }): string {
    // Verify integrity
    const hash = crypto.createHash('sha256');
    hash.update(encryptedData.encrypted + encryptedData.iv + ENCRYPTION_KEY);
    const expectedAuthTag = hash.digest('hex');
    
    if (expectedAuthTag !== encryptedData.authTag) {
      throw new Error('Token integrity check failed');
    }
    
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Token decryption failed - invalid token');
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
    try {
      console.log('Starting token encryption...');
      const encrypted = this.encrypt(token);
      const tokenHash = this.createTokenHash(token);
      
      // Store IV and authTag as metadata
      const metadata = JSON.stringify({
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        version: 1
      });

      console.log('Token encryption successful');
      return {
        encryptedToken: encrypted.encrypted,
        tokenHash,
        metadata
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token for storage');
    }
  }

  /**
   * Decrypt token from database format
   */
  decryptFromStorage(encryptedToken: string, metadata: string): string {
    const meta = JSON.parse(metadata);
    
    return this.decrypt({
      encrypted: encryptedToken,
      authTag: meta.authTag,
      iv: meta.iv
    });
  }
}

export const tokenEncryption = TokenEncryption.getInstance();