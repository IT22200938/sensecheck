import winston from 'winston';

// Check if running in serverless environment (Vercel sets this automatically)
const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isProduction = process.env.NODE_ENV === 'production';

// Define log format (JSON for better log aggregation)
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for local development (colorized and readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger with console transport only
// Vercel captures console.log output automatically
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: isServerless || isProduction ? logFormat : consoleFormat,
    })
  ],
});

// Interaction logger - also console only
export const interactionLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: isServerless || isProduction ? logFormat : consoleFormat,
    }),
  ],
});

// Add file transports only in local development
if (!isServerless && !isProduction) {
  import('winston-daily-rotate-file').then((module) => {
    const DailyRotateFile = module.default;
    import('path').then((path) => {
      import('url').then(({ fileURLToPath }) => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const logsDir = path.join(__dirname, '../../logs');

        logger.add(new DailyRotateFile({
          filename: path.join(logsDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
        }));

        logger.add(new DailyRotateFile({
          filename: path.join(logsDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
        }));

        interactionLogger.add(new DailyRotateFile({
          filename: path.join(logsDir, 'interactions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '30d',
          format: logFormat,
        }));
      });
    });
  }).catch(() => {
    // File logging not available, continue with console only
  });
}
