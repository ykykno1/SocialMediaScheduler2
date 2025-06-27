/**
 * Ultra-simple token encryption for YouTube tokens
 */
import crypto from 'crypto';

const SECRET_KEY = 'shabbat-robot-youtube-encrypt-key32';

export class SimpleTokenEncryption {
  private static instance: SimpleTokenEncryption;
  private key: Buffer;

  constructor() {
    // Ensure exactly 32 bytes for AES-256
    const keyString = SECRET_KEY.padEnd(32, '0').slice(0, 32);
    this.key = Buffer.from(keyString, 'utf8');
  }

  static getInstance(): SimpleTokenEncryption {
    if (!SimpleTokenEncryption.instance) {
      SimpleTokenEncryption.instance = new SimpleTokenEncryption();
    }
    return SimpleTokenEncryption.instance;
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // For database storage compatibility
  encryptForStorage(token: string): { encrypted: string; metadata: string } {
    const encryptedText = this.encrypt(token);
    return {
      encrypted: encryptedText,
      metadata: JSON.stringify({ format: 'simple', version: 2 })
    };
  }

  decryptFromStorage(encrypted: string, metadata: string): string {
    const meta = JSON.parse(metadata);
    if (meta.format !== 'simple' || meta.version !== 2) {
      throw new Error('Unsupported encryption format');
    }
    return this.decrypt(encrypted);
  }
}

export const simpleTokenEncryption = SimpleTokenEncryption.getInstance();