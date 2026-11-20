const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const helmet = require('helmet');
const { loginRateLimit, passwordRecoveryRateLimit } = require('../middlewares/rateLimits');
const { getJwtSecret, validateJwtSecret } = require('../utils/jwtSecret');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

const withEnv = async (values, callback) => {
  const original = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    await callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const listen = async (app) => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
};

test('JWT config rejects missing/default secrets and weak production secrets', async () => {
  await withEnv({ JWT_SECRET: '', NODE_ENV: 'test' }, async () => {
    assert.throws(() => getJwtSecret(), /must be configured/);
  });
  await withEnv({ JWT_SECRET: 'your_jwt_secret_key', NODE_ENV: 'test' }, async () => {
    assert.throws(() => getJwtSecret(), /must be configured/);
  });
  await withEnv({ JWT_SECRET: 'short-production-secret', NODE_ENV: 'production' }, async () => {
    assert.throws(() => validateJwtSecret(), /at least 32 bytes/);
  });
  await withEnv({ JWT_SECRET: 'a'.repeat(32), NODE_ENV: 'production' }, async () => {
    assert.doesNotThrow(() => validateJwtSecret());
    const token = generateToken('507f1f77bcf86cd799439011');
    assert.equal(jwt.verify(token, getJwtSecret()).id, '507f1f77bcf86cd799439011');
  });
});

test('Helmet adds baseline security headers', async (t) => {
  const app = express();
  app.use(helmet());
  app.get('/health', (req, res) => res.sendStatus(204));
  const { server, url } = await listen(app);
  t.after(() => server.close());

  const response = await fetch(`${url}/health`);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(response.headers.get('content-security-policy'));
});

test('login endpoint rate limit returns 429 after ten requests', async (t) => {
  const app = express();
  app.set('trust proxy', false);
  app.post('/login', loginRateLimit, (req, res) => res.sendStatus(204));
  const { server, url } = await listen(app);
  t.after(() => server.close());

  const responses = [];
  for (let attempt = 0; attempt < 11; attempt += 1) {
    responses.push(await fetch(`${url}/login`, { method: 'POST' }));
  }
  assert.equal(responses[9].status, 204);
  assert.equal(responses[10].status, 429);
  assert.match((await responses[10].json()).message, /Too many sign-in attempts/);
});

test('password recovery endpoint has an independent rate limit', async (t) => {
  const app = express();
  app.set('trust proxy', false);
  app.post('/forgot-password', passwordRecoveryRateLimit, (req, res) => res.sendStatus(204));
  const { server, url } = await listen(app);
  t.after(() => server.close());

  const responses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    responses.push(await fetch(`${url}/forgot-password`, { method: 'POST' }));
  }
  assert.equal(responses[4].status, 204);
  assert.equal(responses[5].status, 429);
});
