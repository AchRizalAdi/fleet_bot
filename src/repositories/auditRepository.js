/**
 * Audit Repository - Calls Laravel API for audit logging
 * If your Laravel backend handles audit logging natively, this can be minimal
 */

function createAuditRepository({ apiClient, logger }) {
  return {
    /**
     * Create an audit log entry via API
     * POST /api/wa-bot/audit-logs (or similar endpoint in your Laravel API)
     */
    async createLog({
      action,
      actorName,
      actorJid,
      actorRole,
      target = null,
      payload = null,
      status = 'success',
      note = null,
    }) {
      try {
        await apiClient.post('/api/wa-bot/users/insert-audit-logs', {
          action,
          actor_name: actorName,
          actor_jid: actorJid,
          actor_role: actorRole,
          target,
          payload,
          status,
          note,
        });
      } catch (error) {
        logger.warn(
          { error: error.message, action, actorJid },
          'Failed to send audit log to API, logging locally'
        );
        // Optionally fallback to local logging if needed
      }
    },

    /**
     * Get audit logs (if needed)
     */
    async getLogs(limit = 20) {
      try {
        const response = await apiClient.get(`/api/wa-bot/audit-logs?limit=${limit}`);
        return Array.isArray(response?.logs) ? response.logs : [];
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to fetch audit logs');
        return [];
      }
    },
  };
}

module.exports = { createAuditRepository };