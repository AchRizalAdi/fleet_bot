/**
 * Fleet Repository - Calls Laravel API for vehicle and fleet operations
 */

function createFleetRepository({ apiClient, logger }) {
  return {
    /**
     * Get vehicle documents by plate
     * GET /api/wa-bot/fleet/vehicle-documents/{plate}
     */
    async findVehicleDocuments(plate) {
      try {
        const response = await apiClient.get(`/api/wa-bot/fleet/vehicle-documents`);

        if (!response?.vehicle) {
          return null;
        }

        return {
          plate: response.vehicle.plate,
          documents: response.vehicle.documents || {},
          status: response.vehicle.status,
        };
      } catch (error) {
        logger.error({ error: error.message, plate }, "Failed to fetch vehicle documents");
        return null;
      }
    },

    /**
     * Update vehicle document
     * POST /api/wa-bot/fleet/vehicle-documents/update
     */
    async updateVehicleDocument({ plate, type, expiryDate, actor }) {
      try {
        const response = await apiClient.post("/api/wa-bot/fleet/vehicle-documents/update", {
          plate,
          type,
          expiry_date: expiryDate,
          actor,
        });

        if (!response?.vehicle) {
          return null;
        }

        return {
          plate: response.vehicle.plate,
          documents: response.vehicle.documents || {},
          status: response.vehicle.status,
        };
      } catch (error) {
        logger.error({ error: error.message, plate, type }, "Failed to update vehicle document");
        return null;
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
