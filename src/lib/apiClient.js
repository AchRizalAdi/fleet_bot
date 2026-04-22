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

  function buildSafeRequestMeta(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return undefined;
    }

    // Keep request metadata compact and avoid logging sensitive values.
    return {
      bodyKeys: Object.keys(body).slice(0, 10),
    };
  }

  async function request({ method = 'GET', path, body = null, headers = {} }) {
    const normalizedMethod = String(method || 'GET').toUpperCase();
    const url = `${baseUrl}${path}`;
    const start = Date.now();
    const requestMeta = buildSafeRequestMeta(body);

    logger.info(
      {
        method: normalizedMethod,
        endpoint: path,
        ...(requestMeta ? { request: requestMeta } : {}),
      },
      'API request started'
    );

    const requestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...headers,
    };

    const options = {
      method: normalizedMethod,
      headers: requestHeaders,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        const apiError = new Error(`API Error: ${response.status} ${response.statusText}`);

        logger.error(
          {
            method: normalizedMethod,
            endpoint: path,
            statusCode: response.status,
            duration: Date.now() - start,
            responseError: errorText ? errorText.slice(0, 300) : undefined,
            err: apiError,
          },
          'API request failed'
        );

        throw apiError;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.warn(
          {
            method: normalizedMethod,
            endpoint: path,
            statusCode: response.status,
            duration: Date.now() - start,
            contentType,
          },
          'API response is not JSON'
        );
        return null;
      }

      const data = await response.json();

      logger.info(
        {
          method: normalizedMethod,
          endpoint: path,
          statusCode: response.status,
          duration: Date.now() - start,
        },
        'API request success'
      );

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('API Error:')) {
        throw error;
      }

      logger.error(
        {
          method: normalizedMethod,
          endpoint: path,
          duration: Date.now() - start,
          err: error,
        },
        'API request failed'
      );

      throw new Error(`Failed to reach API: ${error.message}`);
    }
  }

  return {
    async healthCheck(path) {
      const start = Date.now();

      logger.info(
        {
          method: 'GET',
          endpoint: path,
        },
        'API request started'
      );

      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        });

        logger.info(
          {
            method: 'GET',
            endpoint: path,
            statusCode: response.status,
            duration: Date.now() - start,
          },
          'API request success'
        );

        return response.ok;
      } catch (error) {
        logger.error(
          {
            method: 'GET',
            endpoint: path,
            duration: Date.now() - start,
            err: error,
          },
          'API request failed'
        );

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
