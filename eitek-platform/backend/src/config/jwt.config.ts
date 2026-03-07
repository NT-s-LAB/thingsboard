import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'eitek-access-secret-key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'eitek-refresh-secret-key',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  issuer: process.env.JWT_ISSUER || 'eitek-platform',
  audience: process.env.JWT_AUDIENCE || 'eitek-platform-users',
}));