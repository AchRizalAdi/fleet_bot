function createFleetService({ repository, logger }) {
  return {
    async getVehicleDocuments(params = {}) {
      console.log("Fetching vehicle documents with params:", params);
      return repository.findVehicleDocuments(params);
    },

    async updateVehicleDocument({ plate, type, expiryDate, actor }) {
      logger.info({ plate, type, expiryDate, actor }, 'Updating vehicle document');
      return repository.updateVehicleDocument({ plate, type, expiryDate, actor });
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
