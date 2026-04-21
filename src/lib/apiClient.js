/**
 * Reusable API Client for Laravel Backend
 * Handles authentication, error handling, and JSON parsing
 */

function createApiClient({ env, logger }) {
  const baseUrl = env.TMS_API_BASE_URL;
  const apiKey = env.TMS_API_KEY;

  if (!baseUrl) {
    throw new Error('TMS_API_BASE_URL is required');
  }

  if (!apiKey) {
    throw new Error('TMS_API_KEY is required');
  }

  async function request({ method = 'GET', path, body = null, headers = {} }) {
    const url = `${baseUrl}${path}`;

    const requestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...headers,
    };

    const options = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            url,
            method,
            errorBody: errorText,
          },
          `API Error: ${response.status} ${response.statusText}`
        );
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.warn({ contentType, url }, 'Response is not JSON');
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('API Error:')) {
        throw error;
      }
      logger.error({ error: error.message, url, method }, 'Request failed');
      throw new Error(`Failed to reach API: ${error.message}`);
    }
  }

  return {
    async healthCheck(path) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        });

        return response.ok;
      } catch (error) {
        return false;
      }
    },

    async get(path) {
      return request({ method: 'GET', path });
    },

    async post(path, body, customHeaders = {}) {
      return request({ method: 'POST', path, body, headers: customHeaders });
    },

    async put(path, body, customHeaders = {}) {
      return request({ method: 'PUT', path, body, headers: customHeaders });
    },

    async patch(path, body, customHeaders = {}) {
      return request({ method: 'PATCH', path, body, headers: customHeaders });
    },

    async delete(path, customHeaders = {}) {
      return request({ method: 'DELETE', path, headers: customHeaders });
    },
  };
}

module.exports = { createApiClient };
