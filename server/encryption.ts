/**
 * Simple token encryption module for auth tokens
 */
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '32-character-default-key-for-dev';
const ALGORITHM = 'aes-256-gcm';

export class TokenEncryption {
  private static instance: TokenEncryption;
  private encryptionKey: Buffer;

  constructor() {
    // Ensure we have a 32-byte key for AES-256
    this.encryptionKey = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
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
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipherGCM(ALGORITHM, this.encryptionKey, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      authTag: authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt a token string
   */
  decrypt(encryptedData: { encrypted: string; authTag: string; iv: string }): string {
    const decipher = crypto.createDecipherGCM(
      ALGORITHM, 
      this.encryptionKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
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
    const encrypted = this.encrypt(token);
    const tokenHash = this.createTokenHash(token);
    
    // Store IV and authTag as metadata
    const metadata = JSON.stringify({
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      version: 1
    });

    return {
      encryptedToken: encrypted.encrypted,
      tokenHash,
      metadata
    };
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