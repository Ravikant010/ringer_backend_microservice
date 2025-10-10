type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...(meta && { meta }),
    };
    console.log(JSON.stringify(logObject));
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger(process.env.SERVICE_NAME || 'social-service');
