const FuelLog = require('../models/FuelLog.model');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityLog.service');

const getAll = async (req, res, next) => {
  try {
    const { vehicleId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (vehicleId) query.vehicleId = vehicleId;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      FuelLog.find(query).populate('vehicleId', 'registrationNumber name').populate('tripId', 'source destination').sort({ date: -1 }).skip(skip).limit(Number(limit)),
      FuelLog.countDocuments(query),
    ]);
    sendPaginated(res, data, total, page, limit);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.costPerLiter && !data.totalCost) {
      data.totalCost = data.liters * data.costPerLiter;
    }
    if (!data.totalCost) data.totalCost = 0;

    const log = await FuelLog.create(data);
    await logActivity({ userId: req.user.id, action: 'fuelLog.create', entityType: 'FuelLog', entityId: log._id, currentValue: log.toJSON() });
    sendCreated(res, log, 'Fuel log created');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const log = await FuelLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: { message: 'Fuel log not found' } });
    await logActivity({ userId: req.user.id, action: 'fuelLog.delete', entityType: 'FuelLog', entityId: req.params.id, previousValue: log.toJSON() });
    sendSuccess(res, { message: 'Fuel log deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, remove };
