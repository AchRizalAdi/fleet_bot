function createFleetService({ repository, logger }) {
  const documentFieldMap = {
    STNK: "stnk_date",
    KIR: "kir_date",
    B3: "b3_jatuh_tempo",
    STID: "stid_date",
    GPS1: "gps1_date_end",
    GPS2: "gps2_date_end",
    GPS3: "gps3_date_end",
    INSURANCE: "insurance_expired_date",
  };

  return {
    async getVehicleDocuments(params = {}) {
      const normalizedParams =
        typeof params === "string"
          ? { nopol: params }
          : params || {};

      return repository.findVehicleDocuments(normalizedParams);
    },

    async updateVehicleDocument({ vehicleId, documentType, expiryDate, actor }) {
      const normalizedType = String(documentType || "").trim().toUpperCase();
      const mappedField = documentFieldMap[normalizedType];

      if (!vehicleId || !mappedField || !expiryDate) {
        return {
          ok: false,
          message: "Invalid update document payload.",
        };
      }

      const payload = {
        [mappedField]: expiryDate,
      };

      logger.info({ vehicleId, documentType: normalizedType, expiryDate, actor }, "Updating vehicle document");

      return repository.updateVehicleDocumentByVehicleId(vehicleId, payload);
    },

    async getTireStock(sku) {
      return repository.findTireStock(sku);
    },

    async updateTireUsage({ plate, position, km, actor }) {
      logger.info({ plate, position, km, actor }, 'Updating tire usage');
      return repository.updateTireUsage({ plate, position, km, actor });
    },

    async getVehicleNotification() {
      try {
        const alerts = await repository.getVehicleNotification();
        return alerts;
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to fetch today alerts');
        return [];
      }
    },
  };
}

module.exports = { createFleetService };
