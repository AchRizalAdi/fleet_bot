function createFleetRepository() {
  const vehicleDocuments = {
    B1234CD: {
      plate: 'B1234CD',
      documents: {
        STNK: '2027-05-12',
        KIR: '2026-11-20',
        PAJAK: '2026-08-01',
      },
      status: 'Aman',
    },
  };

  const tireStock = {
    '750R16': {
      sku: '750R16',
      brand: 'Bridgestone',
      available: 8,
      minimum: 5,
    },
  };

  const tireUsage = [];
  const auditLogs = [];

  return {
    async findVehicleDocumentsByPlate(plate) {
      return vehicleDocuments[plate] || null;
    },

    async updateVehicleDocument({ plate, type, expiryDate, actor }) {
      if (!vehicleDocuments[plate]) {
        vehicleDocuments[plate] = {
          plate,
          documents: {},
          status: 'Perlu review',
        };
      }
      vehicleDocuments[plate].documents[type] = expiryDate;
      auditLogs.push({ type: 'UPDATE_SURAT', plate, documentType: type, expiryDate, actor, at: new Date().toISOString() });
      return vehicleDocuments[plate];
    },

    async findTireStockBySku(sku) {
      return tireStock[sku.toUpperCase()] || null;
    },

    async updateTireUsage({ plate, position, km, actor }) {
      tireUsage.push({ plate, position, km, actor, at: new Date().toISOString() });
      auditLogs.push({ type: 'UPDATE_BAN', plate, position, km, actor, at: new Date().toISOString() });
      return { ok: true };
    },

    async getTodayAlerts() {
      const alerts = [];
      Object.values(vehicleDocuments).forEach((item) => {
        Object.entries(item.documents).forEach(([key, value]) => {
          if (String(value).startsWith('2026-')) {
            alerts.push(`${item.plate} - ${key} mendekati masa berlaku (${value})`);
          }
        });
      });
      Object.values(tireStock).forEach((item) => {
        if (item.available <= item.minimum) {
          alerts.push(`Stock ban ${item.sku} tersisa ${item.available}`);
        }
      });
      return alerts;
    },
  };
}

module.exports = { createFleetRepository };
