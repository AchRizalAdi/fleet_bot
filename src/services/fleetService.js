function createFleetService({ repository, logger }) {
  return {
    async getVehicleDocuments(plate) {
      return repository.findVehicleDocuments(plate);
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
