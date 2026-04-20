/**
 * User Repository - Calls Laravel API for user management
 */

function normalizeJid(jid) {
  return String(jid || '').trim().toLowerCase();
}

function jidMatches(recordJid, inputJid) {
  const normalizedRecord = normalizeJid(recordJid);
  const normalizedInput = normalizeJid(inputJid);

  if (!normalizedRecord || !normalizedInput) return false;
  if (normalizedRecord === normalizedInput) return true;

  const recordLocal = normalizedRecord.split('@')[0];
  const inputLocal = normalizedInput.split('@')[0];
  return recordLocal === inputLocal;
}

function createUserRepository({ apiClient, logger }) {
  return {
    /**
     * Check or register user via API
     * Response: { user: {...} | null, pending: {...} | null, isActive: boolean }
     */
    async findUserByJid(jid, number = null) {
      try {
        const response = await apiClient.post('/api/wa-bot/users/check', {
          jid,
          number,
        });

        if (response?.data && response.data.is_active) {
          return {
            jid: response.data.jid,
            name: response.data.name,
            role: response.data.role,
            isActive: true,
          };
        }

        return null;
      } catch (error) {
        logger.error({ error: error.message, jid }, 'Failed to check user');
        return null;
      }
    },

    /**
     * Find or create pending user registration
     * Response: { pending: {...} | null }
     */
    async findPendingByJid(jid, number = null) {
      try {
        const response = await apiClient.post('/api/wa-bot/users/check', {
          jid,
          number,
        });

        if (response?.data && response.data.status === 'pending') {
          return {
            code: response.data.code,
            jid: response.data.jid,
            status: 'pending',
            requestedAt: response.data.created_at,
          };
        }

        return null;
      } catch (error) {
        logger.error({ error: error.message, jid }, 'Failed to check pending user');
        return null;
      }
    },

    /**
     * Find pending user by registration code
     */
    async findPendingByCode(code) {
      try {
        const response = await apiClient.get(`/api/wa-bot/users/pending/${code}`);

        if (response?.data && response.data.status === 'pending') {
          return {
            code: response.data.code,
            jid: response.data.jid,
            status: 'pending',
            requestedAt: response.data.created_at,
          };
        }

        return null;
      } catch (error) {
        logger.error({ error: error.message, code }, 'Failed to find pending by code');
        return null;
      }
    },

    /**
     * Create new pending user (called from check endpoint, but exposed here for compatibility)
     */
    async createPendingUser({ jid, number = null }) {
      try {
        const response = await apiClient.post('/api/wa-bot/users/check', {
          jid,
          number,
        });

        if (response?.data && response.data.status === 'pending') {
          return {
            code: response.data.code,
            jid: response.data.jid,
            status: 'pending',
            requestedAt: response.data.created_at,
          };
        }

        logger.warn({ jid }, 'No pending user returned from API');
        return null;
      } catch (error) {
        logger.error({ error: error.message, jid }, 'Failed to create pending user');
        throw error;
      }
    },

    /**
     * Approve pending user
     */
    async approvePendingUser({ code, role, name, approvedBy }) {
      try {
        const response = await apiClient.post('/api/wa-bot/users/approve', {
          code,
          role,
          name,
          approved_by: approvedBy,
        });

        if (!response?.data) {
          return null;
        }

        return {
          pending: {
            code,
            jid: response.data.jid,
          },
          role: response.data.role,
        };
      } catch (error) {
        logger.error({ error: error.message, code }, 'Failed to approve user');
        return null;
      }
    },

    /**
     * Reject pending user
     */
    async rejectPendingUser({ code, rejectedBy }) {
      try {
        const response = await apiClient.post('/api/wa-bot/users/reject', {
          code,
          rejected_by: rejectedBy,
        });

        if (!response?.data) {
          return null;
        }

        return {
          code: response.data.code,
          jid: response.data.jid,
          status: 'rejected',
        };
      } catch (error) {
        logger.error({ error: error.message, code }, 'Failed to reject user');
        return null;
      }
    },

    /**
     * Get all pending users
     * GET /api/wa-bot/users/pending
     */
    async getPendingUsers() {
      try {
        const response = await apiClient.get('/api/wa-bot/users/pending');

        if (!Array.isArray(response?.data)) {
          return [];
        }

        return response.data.map((item) => ({
          code: item.code,
          jid: item.jid,
          status: item.status,
          requestedAt: item.created_at,
        }));
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to get pending users');
        return [];
      }
    },
  };
}

module.exports = { createUserRepository };