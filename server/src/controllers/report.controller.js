const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/apiResponse');
const { exportCSV } = require('../utils/csvExporter');

const getReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { start, end, vehicleId, driverId } = req.query;
    const dateRange = start || end ? { start, end } : null;

    let data;
    switch (type) {
      case 'utilization':
        data = await reportService.vehicleUtilization(dateRange, vehicleId);
        break;
      case 'fuel-efficiency':
        data = await reportService.fuelEfficiency(dateRange, vehicleId);
        break;
      case 'operational-cost':
        data = await reportService.operationalCost(dateRange, vehicleId);
        break;
      case 'driver-stats':
        data = await reportService.driverStats(dateRange, driverId);
        break;
      case 'fleet-utilization':
        data = await reportService.fleetUtilization();
        break;
      default:
        return res.status(400).json({ success: false, error: { message: `Unknown report type: ${type}` } });
    }

    sendSuccess(res, data);
  } catch (error) { next(error); }
};

const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { start, end, vehicleId, driverId, format = 'csv' } = req.query;
    const dateRange = start || end ? { start, end } : null;

    let data;
    switch (type) {
      case 'utilization':
        data = await reportService.vehicleUtilization(dateRange, vehicleId);
        break;
      case 'fuel-efficiency':
        data = await reportService.fuelEfficiency(dateRange, vehicleId);
        break;
      case 'operational-cost':
        data = await reportService.operationalCost(dateRange, vehicleId);
        break;
      case 'driver-stats':
        data = await reportService.driverStats(dateRange, driverId);
        break;
      default:
        return res.status(400).json({ success: false, error: { message: `Unknown report type: ${type}` } });
    }

    if (format === 'csv') {
      const fields = data.length > 0 ? Object.keys(data[0]) : [];
      return exportCSV(res, data, fields, `${type}-report.csv`);
    }

    sendSuccess(res, data);
  } catch (error) { next(error); }
};

module.exports = { getReport, exportReport };
