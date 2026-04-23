/**
 * Fleet Repository - Calls Laravel API for vehicle and fleet operations
 */

function createFleetRepository({ apiClient, logger }) {
  function extractStatusCode(error) {
    const match = String(error?.message || "").match(/API Error:\s*(\d{3})/i);
    return match ? Number(match[1]) : null;
  }

  return {
    /**
     * Get vehicle documents by plate
     * GET /api/wa-bot/fleet/vehicle-documents/{plate}
     */
    async findVehicleDocuments(params = {}) {
      try {
        const response = await apiClient.post(`/api/wa-bot/vehicle/document`, params);

        if (!response?.data) {
          return null;
        }

        return response.data;
      } catch (error) {
        logger.error({ error: error.message, params }, "Failed to fetch vehicle documents");
        return null;
      }
    },

    async updateVehicleDocumentByVehicleId(vehicleId, payload = {}) {
      try {
        const response = await apiClient.post(`/api/wa-bot/vehicle/update-document/${vehicleId}`, payload);

        if (response?.status === "error") {
          return {
            ok: false,
            notFound: /not found/i.test(String(response?.message || "")),
            message: response?.message || "Update vehicle document failed.",
          };
        }

        return {
          ok: true,
          message: response?.message || "Vehicle document updated successfully.",
        };
      } catch (error) {
        const statusCode = extractStatusCode(error);
        const notFound = statusCode === 404 || /vehicle not found/i.test(String(error?.message || ""));

        logger.error({ error: error.message, vehicleId, payload }, "Failed to update vehicle document by vehicle id");
        return {
          ok: false,
          notFound,
          backendUnavailable: !notFound,
          message: notFound ? "Vehicle not found." : "Backend unavailable.",
        };
      }
    },

    /**
     * Get tire stock by SKU
     * GET /api/wa-bot/fleet/tire-stock/{sku}
     */
    async findTireStock(sku = null) {
      try {
        const response = await apiClient.post(`/api/wa-bot/vehicle/tire_stock`, { sku });

        if (!response?.data) {
          return null;
        }

        return response.data;
      } catch (error) {
        logger.error({ error: error.message, sku }, "Failed to fetch tire stock");
        return null;
      }
    },

    /**
     * Update tire usage
     * POST /api/wa-bot/fleet/tire-usage/update
     */
    async updateTireUsage({ plate, position, km, actor }) {
      try {
        const response = await apiClient.post("/api/wa-bot/fleet/tire-usage/update", {
          plate,
          position,
          km,
          actor,
        });

        return { ok: response?.ok !== false };
      } catch (error) {
        logger.error({ error: error.message, plate, position }, "Failed to update tire usage");
        return { ok: false };
      }
    },

    /**
     * Get today's alerts
     * GET /api/wa-bot/fleet/alerts/today
     */
    async getVehicleNotification() {
      try {
        const response = await apiClient.get("/api/wa-bot/vehicle/notification");
        return Array.isArray(response?.data) ? response.data : [];
      } catch (error) {
        logger.error({ error: error.message }, "Failed to fetch today alerts");
        return [];
      }
    },
  };
}

module.exports = { createFleetRepository };
