import axios from 'axios';
import { getConfig, setConfig, hasValidToken } from './config.js';

const XERO_BASE_URL = 'https://api.xero.com';
const XERO_AUTH_URL = 'https://identity.xero.com/connect/token';

async function refreshAccessToken() {
  const clientId = getConfig('clientId');
  const clientSecret = getConfig('clientSecret');
  const refreshToken = getConfig('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token. Please authenticate.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(XERO_AUTH_URL, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }), {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    setConfig('accessToken', access_token);
    if (refresh_token) setConfig('refreshToken', refresh_token);
    setConfig('tokenExpiry', Date.now() + (expires_in * 1000));

    return access_token;
  } catch (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

async function getAccessToken() {
  if (hasValidToken()) {
    return getConfig('accessToken');
  }
  return await refreshAccessToken();
}

async function apiRequest(method, endpoint, data = null, params = null) {
  const token = await getAccessToken();

  const config = {
    method,
    url: `${XERO_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Authentication failed.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else {
        throw new Error(`API Error (${status})`);
      }
    } else {
      throw error;
    }
  }
}

export async function getConnections(params = {}) {
  return await apiRequest('GET', '/Connections', null, params);
}

export async function deleteConnection(connectionId) {
  return await apiRequest('DELETE', `/Connections/${connectionId}`);
}

export async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = getConfig('clientId');
  const clientSecret = getConfig('clientSecret');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(XERO_AUTH_URL, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    }), {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    setConfig('accessToken', access_token);
    setConfig('refreshToken', refresh_token);
    setConfig('tokenExpiry', Date.now() + (expires_in * 1000));

    return response.data;
  } catch (error) {
    throw new Error(`Token exchange failed: ${error.message}`);
  }
}
