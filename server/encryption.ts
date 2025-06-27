/**
 * Simple token encryption module for auth tokens
 */
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '32-character-default-key-for-dev';
const ALGORITHM = 'aes-256-cbc';

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
    const iv = crypto.randomBytes(16); // 128-bit IV for CBC
    const cipher = crypto.createCipher(ALGORITHM, this.encryptionKey);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Create HMAC for integrity
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(encrypted + iv.toString('hex'));
    const authTag = hmac.digest('hex');
    
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
    // Verify HMAC first
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(encryptedData.encrypted + encryptedData.iv);
    const expectedAuthTag = hmac.digest('hex');
    
    if (expectedAuthTag !== encryptedData.authTag) {
      throw new Error('Authentication failed - token may be tampered');
    }
    
    const decipher = crypto.createDecipher(ALGORITHM, this.encryptionKey);
    
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