const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance.model');
const Vehicle = require('../models/Vehicle.model');
const AppError = require('../utils/AppError');
const { logActivity } = require('./activityLog.service');

const getAll = async (filters = {}, page = 1, limit = 20) => {
  const query = {};
  if (filters.vehicleId) query.vehicleId = filters.vehicleId;
  if (filters.status) query.status = filters.status;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Maintenance.find(query)
      .populate('vehicleId', 'registrationNumber name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Maintenance.countDocuments(query),
  ]);

  return { data, total, page, limit };
};

const getById = async (id) => {
  const record = await Maintenance.findById(id).populate('vehicleId', 'registrationNumber name type status');
  if (!record) throw new AppError('Maintenance record not found', 404, 'NOT_FOUND');
  return record;
};

/**
 * Create maintenance — sets vehicle to 'In Shop'. Validates no active maintenance exists.
 */
const create = async (data, userId) => {
  const vehicle = await Vehicle.findById(data.vehicleId);
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');

  if (vehicle.status === 'On Trip') {
    throw new AppError('Cannot schedule maintenance for a vehicle currently on trip', 409, 'CONFLICT');
  }

  // Check for existing open maintenance
  const existingOpen = await Maintenance.findOne({ vehicleId: data.vehicleId, status: 'Open' });
  if (existingOpen) {
    throw new AppError('Vehicle already has an active maintenance record', 409, 'CONFLICT');
  }

  // Validate dates
  if (new Date(data.startDate) > new Date(data.expectedEndDate)) {
    throw new AppError('Start date must be before expected end date', 400, 'VALIDATION_ERROR');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [record] = await Maintenance.create([data], { session });

    vehicle.status = 'In Shop';
    await vehicle.save({ session });

    await session.commitTransaction();

    await logActivity({ userId, action: 'maintenance.create', entityType: 'Maintenance', entityId: record._id, currentValue: record.toJSON() });

    return record;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const update = async (id, data, userId) => {
  const record = await Maintenance.findById(id);
  if (!record) throw new AppError('Maintenance record not found', 404, 'NOT_FOUND');
  if (record.status === 'Closed') throw new AppError('Cannot update a closed maintenance record', 409, 'CONFLICT');

  const previousValue = record.toJSON();
  Object.assign(record, data);
  await record.save();

  await logActivity({ userId, action: 'maintenance.update', entityType: 'Maintenance', entityId: record._id, previousValue, currentValue: record.toJSON() });

  return record;
};

/**
 * Close maintenance — restores vehicle to 'Available', unless vehicle is 'Retired'.
 */
const close = async (id, actualEndDate, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const record = await Maintenance.findById(id).session(session);
    if (!record) throw new AppError('Maintenance record not found', 404, 'NOT_FOUND');
    if (record.status === 'Closed') throw new AppError('Maintenance record already closed', 409, 'CONFLICT');

    record.status = 'Closed';
    record.actualEndDate = actualEndDate || new Date();
    await record.save({ session });

    // Restore vehicle — unless Retired
    const vehicle = await Vehicle.findById(record.vehicleId).session(session);
    if (vehicle && vehicle.status !== 'Retired') {
      vehicle.status = 'Available';
      await vehicle.save({ session });
    }

    await session.commitTransaction();

    await logActivity({ userId, action: 'maintenance.close', entityType: 'Maintenance', entityId: record._id, previousValue: { status: 'Open' }, currentValue: { status: 'Closed' } });

    return record;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { getAll, getById, create, update, close };
