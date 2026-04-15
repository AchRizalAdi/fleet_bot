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
      return repository.getTodayAlerts();
    },
  };
}

module.exports = { createFleetService };
