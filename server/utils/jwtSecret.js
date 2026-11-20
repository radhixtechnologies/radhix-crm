const DEFAULT_SECRET = 'your_jwt_secret_key';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEFAULT_SECRET) {
    throw new Error('JWT_SECRET must be configured with a private, unique value.');
  }
  return secret;
};

const validateJwtSecret = () => {
  const secret = getJwtSecret();
  if (process.env.NODE_ENV === 'production' && Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes in production.');
  }
  if (process.env.NODE_ENV !== 'production' && Buffer.byteLength(secret, 'utf8') < 32) {
    console.warn('[Security] JWT_SECRET is shorter than 32 bytes; use a longer random secret before deployment.');
  }
};

module.exports = { getJwtSecret, validateJwtSecret };
