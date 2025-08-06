// utils/secureLogger.ts
// Secure logging utility that prevents sensitive data exposure

interface LogConfig {
  enableInProduction?: boolean;
  enableSensitiveData?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

class SecureLogger {
  private config: LogConfig;
  private sensitiveKeys = [
    'apiKey', 'api_key', 'API_KEY',
    'password', 'PASSWORD', 'secret', 'SECRET',
    'token', 'TOKEN', 'key', 'KEY',
    'private_key', 'PRIVATE_KEY',
    'client_secret', 'CLIENT_SECRET',
    'auth_token', 'AUTH_TOKEN',
    'firebase', 'FIREBASE'
  ];

  constructor(config: LogConfig = {}) {
    this.config = {
      enableInProduction: false,
      enableSensitiveData: false,
      logLevel: 'info',
      ...config
    };
  }

  private shouldLog(): boolean {
    if (process.env.NODE_ENV === 'production' && !this.config.enableInProduction) {
      return false;
    }
    return true;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Don't log if it looks like sensitive data
      if (this.containsSensitiveData(data)) {
        return '[REDACTED]';
      }
      return data;
    }

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeData(value);
        } else if (typeof value === 'string' && this.containsSensitiveData(value)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return data;
  }

  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.sensitiveKeys.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey.toLowerCase())
    );
  }

  private containsSensitiveData(str: string): boolean {
    // Check for patterns that look like API keys, tokens, etc.
    const patterns = [
      /AIza[0-9A-Za-z-_]{35}/, // Google API Key pattern
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, // UUID pattern (might be sensitive)
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API key pattern
      /xoxb-[0-9]{11}-[0-9]{12}-[a-zA-Z0-9]{24}/, // Slack bot token
      /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
    ];

    return patterns.some(pattern => pattern.test(str));
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      const sanitizedData = this.config.enableSensitiveData ? data : this.sanitizeData(data);
      return `${prefix} ${message} ${JSON.stringify(sanitizedData, null, 2)}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog()) return;
    console.debug(this.formatMessage('debug', message, data));
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog()) return;
    console.info(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog()) return;
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, data?: any): void {
    if (!this.shouldLog()) return;
    console.error(this.formatMessage('error', message, data));
  }

  // Firebase-specific logging methods
  firebaseInfo(message: string, config?: any): void {
    if (!this.shouldLog()) return;
    
    if (config) {
      const safeConfig = {
        projectId: config.projectId || '[NOT_SET]',
        authDomain: config.authDomain ? '[SET]' : '[NOT_SET]',
        storageBucket: config.storageBucket ? '[SET]' : '[NOT_SET]',
        apiKey: config.apiKey ? '[SET]' : '[NOT_SET]',
        messagingSenderId: config.messagingSenderId ? '[SET]' : '[NOT_SET]',
        appId: config.appId ? '[SET]' : '[NOT_SET]'
      };
      this.info(message, safeConfig);
    } else {
      this.info(message);
    }
  }

  // Development-only logging
  devOnly(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'development') return;
    this[level](message, data);
  }
}

// Create default logger instances
export const logger = new SecureLogger();

// Create a development-only logger that shows more details
export const devLogger = new SecureLogger({
  enableInProduction: false,
  enableSensitiveData: false, // Still keep sensitive data hidden
  logLevel: 'debug'
});

// Create a production-safe logger
export const prodLogger = new SecureLogger({
  enableInProduction: true,
  enableSensitiveData: false,
  logLevel: 'error'
});

export default logger;