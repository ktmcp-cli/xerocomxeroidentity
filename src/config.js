import Conf from 'conf';

const config = new Conf({
  projectName: 'xerocomxeroidentity-cli',
  schema: {
    clientId: { type: 'string', default: '' },
    clientSecret: { type: 'string', default: '' },
    accessToken: { type: 'string', default: '' },
    refreshToken: { type: 'string', default: '' },
    tokenExpiry: { type: 'number', default: 0 }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function isConfigured() {
  return !!(config.get('clientId') && config.get('clientSecret'));
}

export function hasValidToken() {
  const accessToken = config.get('accessToken');
  const tokenExpiry = config.get('tokenExpiry');
  if (!accessToken) return false;
  return tokenExpiry > Date.now() + 60000;
}

export default config;
