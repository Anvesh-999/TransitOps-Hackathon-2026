const Vehicle = require('../models/Vehicle.model');
const Trip = require('../models/Trip.model');
const Maintenance = require('../models/Maintenance.model');
const AppError = require('../utils/AppError');
const { logActivity } = require('./activityLog.service');

const getAll = async (filters = {}, page = 1, limit = 20) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.region) query.region = filters.region;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Vehicle.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vehicle.countDocuments(query),
  ]);

  return { data, total, page, limit };
};

const getById = async (id) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
  return vehicle;
};

const create = async (data, userId) => {
  const vehicle = await Vehicle.create(data);

  await logActivity({
    userId,
    action: 'vehicle.create',
    entityType: 'Vehicle',
    entityId: vehicle._id,
    currentValue: vehicle.toJSON(),
  });

  return vehicle;
};

const update = async (id, data, userId) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');

  const previousValue = vehicle.toJSON();
  Object.assign(vehicle, data);
  await vehicle.save();

  await logActivity({
    userId,
    action: 'vehicle.update',
    entityType: 'Vehicle',
    entityId: vehicle._id,
    previousValue,
    currentValue: vehicle.toJSON(),
  });

  return vehicle;
};

const remove = async (id, userId) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');

  // Check for trip history — cannot hard-delete
  const tripCount = await Trip.countDocuments({ vehicleId: id });
  const maintCount = await Maintenance.countDocuments({ vehicleId: id });

  if (tripCount > 0 || maintCount > 0) {
    throw new AppError(
      'Cannot delete vehicle with existing trip or maintenance records; retire instead',
      409,
      'CONFLICT'
    );
  }

  await Vehicle.findByIdAndDelete(id);

  await logActivity({
    userId,
    action: 'vehicle.delete',
    entityType: 'Vehicle',
    entityId: id,
    previousValue: vehicle.toJSON(),
  });

  return { message: 'Vehicle deleted successfully' };
};

const updateStatus = async (id, status, userId) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');

  const previousValue = { status: vehicle.status };
  vehicle.status = status;
  await vehicle.save();

  await logActivity({
    userId,
    action: 'vehicle.statusChange',
    entityType: 'Vehicle',
    entityId: vehicle._id,
    previousValue,
    currentValue: { status },
  });

  return vehicle;
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
