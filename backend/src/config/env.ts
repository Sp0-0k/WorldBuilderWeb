export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3001'),
  DATABASE_URL: process.env.DATABASE_URL!,
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
}
