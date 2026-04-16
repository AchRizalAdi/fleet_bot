function createFleetService({ repository, logger }) {
  return {
    async getVehicleDocuments(plate) {
      return repository.findVehicleDocumentsByPlate(plate);
    },

    async updateVehicleDocument({ plate, type, expiryDate, actor }) {
      logger.info({ plate, type, expiryDate, actor }, 'Updating vehicle document');
      return repository.updateVehicleDocument({ plate, type, expiryDate, actor });
    },

    async getTireStock(sku) {
      return repository.findTireStockBySku(sku);
    },

    async updateTireUsage({ plate, position, km, actor }) {
      logger.info({ plate, position, km, actor }, 'Updating tire usage');
      return repository.updateTireUsage({ plate, position, km, actor });
    },

    async getTodayAlerts() {
      try {
        const alerts = await repository.fetchNotifications();
        return alerts;
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to fetch notifications');
        return { error: true };
      }
    },
  };
}

module.exports = { createFleetService };
