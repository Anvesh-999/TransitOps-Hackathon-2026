const mongoose = require('mongoose');
const Trip = require('../models/Trip.model');
const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const FuelLog = require('../models/FuelLog.model');
const AppError = require('../utils/AppError');
const { logActivity } = require('./activityLog.service');
const { createNotification } = require('./notification.service');

const getAll = async (filters = {}, page = 1, limit = 20) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.vehicleId) query.vehicleId = filters.vehicleId;
  if (filters.driverId) query.driverId = filters.driverId;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Trip.find(query)
      .populate('vehicleId', 'registrationNumber name type')
      .populate('driverId', 'name licenseNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(query),
  ]);

  return { data, total, page, limit };
};

const getById = async (id) => {
  const trip = await Trip.findById(id)
    .populate('vehicleId', 'registrationNumber name type maxLoadCapacityKg odometerKm')
    .populate('driverId', 'name licenseNumber safetyScore status')
    .populate('createdBy', 'name');
  if (!trip) throw new AppError('Trip not found', 404, 'NOT_FOUND');
  return trip;
};

/**
 * Create a Draft trip — validates vehicle availability, driver eligibility, cargo weight.
 */
const create = async (data, userId) => {
  // Validate vehicle
  const vehicle = await Vehicle.findById(data.vehicleId);
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
  if (vehicle.status !== 'Available') {
    throw new AppError('Selected vehicle is not available for dispatch', 422, 'BUSINESS_RULE');
  }
  if (data.cargoWeightKg > vehicle.maxLoadCapacityKg) {
    throw new AppError(
      `Cargo weight (${data.cargoWeightKg} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacityKg} kg)`,
      422,
      'BUSINESS_RULE',
      'cargoWeightKg'
    );
  }

  // Validate driver
  const driver = await Driver.findById(data.driverId);
  if (!driver) throw new AppError('Driver not found', 404, 'NOT_FOUND');
  if (driver.status !== 'Available') {
    throw new AppError('Selected driver is not eligible for assignment', 422, 'BUSINESS_RULE');
  }
  if (driver.isLicenseExpired) {
    throw new AppError(
      `Driver license expired on ${driver.licenseExpiryDate.toISOString().split('T')[0]}; cannot assign to trip`,
      422,
      'BUSINESS_RULE'
    );
  }

  const trip = await Trip.create({
    ...data,
    status: 'Draft',
    createdBy: userId,
  });

  await logActivity({
    userId,
    action: 'trip.create',
    entityType: 'Trip',
    entityId: trip._id,
    currentValue: trip.toJSON(),
  });

  return trip;
};

/**
 * Dispatch — Draft → Dispatched. Sets Vehicle & Driver to 'On Trip'. Transactional.
 */
const dispatch = async (tripId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const trip = await Trip.findById(tripId).session(session);
    if (!trip) throw new AppError('Trip not found', 404, 'NOT_FOUND');
    if (trip.status !== 'Draft') {
      throw new AppError('Only draft trips can be dispatched', 409, 'CONFLICT');
    }

    // Re-validate vehicle & driver at dispatch time (PRD edge case)
    const vehicle = await Vehicle.findById(trip.vehicleId).session(session);
    if (!vehicle || vehicle.status !== 'Available') {
      throw new AppError('Selected vehicle is not available for dispatch', 422, 'BUSINESS_RULE');
    }

    const driver = await Driver.findById(trip.driverId).session(session);
    if (!driver || driver.status !== 'Available') {
      throw new AppError('Selected driver is not eligible for assignment', 422, 'BUSINESS_RULE');
    }
    if (driver.isLicenseExpired) {
      throw new AppError('Driver license has expired; cannot dispatch', 422, 'BUSINESS_RULE');
    }

    // Update statuses atomically
    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    await trip.save({ session });

    vehicle.status = 'On Trip';
    await vehicle.save({ session });

    driver.status = 'On Trip';
    await driver.save({ session });

    await session.commitTransaction();

    // Post-transaction: notifications + audit log
    await logActivity({ userId, action: 'trip.dispatch', entityType: 'Trip', entityId: trip._id, previousValue: { status: 'Draft' }, currentValue: { status: 'Dispatched' } });
    await createNotification({ type: 'trip_dispatched', recipientRoles: ['FleetManager', 'Admin'], message: `Trip ${trip._id} dispatched: ${trip.source} → ${trip.destination}`, priority: 'Low', relatedEntityType: 'Trip', relatedEntityId: trip._id });

    return trip;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Complete — Dispatched → Completed. Restores Vehicle & Driver. Updates odometer. Creates FuelLog.
 */
const complete = async (tripId, completionData, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const trip = await Trip.findById(tripId).session(session);
    if (!trip) throw new AppError('Trip not found', 404, 'NOT_FOUND');
    if (trip.status !== 'Dispatched') {
      throw new AppError('Only dispatched trips can be completed', 409, 'CONFLICT');
    }

    const vehicle = await Vehicle.findById(trip.vehicleId).session(session);
    if (completionData.finalOdometerKm < vehicle.odometerKm) {
      throw new AppError(
        `Final odometer (${completionData.finalOdometerKm}) must be >= current odometer (${vehicle.odometerKm})`,
        422,
        'BUSINESS_RULE',
        'finalOdometerKm'
      );
    }

    // Update trip
    trip.status = 'Completed';
    trip.completedAt = new Date();
    trip.finalOdometerKm = completionData.finalOdometerKm;
    trip.fuelConsumedLiters = completionData.fuelConsumedLiters || 0;
    trip.actualDistanceKm = completionData.finalOdometerKm - vehicle.odometerKm;
    await trip.save({ session });

    // Update vehicle
    vehicle.odometerKm = completionData.finalOdometerKm;
    vehicle.status = 'Available';
    await vehicle.save({ session });

    // Update driver
    const driver = await Driver.findById(trip.driverId).session(session);
    driver.status = 'Available';
    await driver.save({ session });

    // Auto-create FuelLog if fuel consumed
    if (completionData.fuelConsumedLiters && completionData.fuelConsumedLiters > 0) {
      await FuelLog.create(
        [{
          vehicleId: trip.vehicleId,
          tripId: trip._id,
          liters: completionData.fuelConsumedLiters,
          totalCost: 0, // cost to be updated by Financial Analyst
          date: new Date(),
        }],
        { session }
      );
    }

    await session.commitTransaction();

    await logActivity({ userId, action: 'trip.complete', entityType: 'Trip', entityId: trip._id, previousValue: { status: 'Dispatched' }, currentValue: { status: 'Completed', actualDistanceKm: trip.actualDistanceKm } });
    await createNotification({ type: 'trip_completed', recipientRoles: ['FleetManager', 'Admin'], message: `Trip ${trip._id} completed: ${trip.source} → ${trip.destination}`, priority: 'Low', relatedEntityType: 'Trip', relatedEntityId: trip._id });

    return trip;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel — Draft/Dispatched → Cancelled. Restores Vehicle & Driver if dispatched.
 */
const cancel = async (tripId, reason, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const trip = await Trip.findById(tripId).session(session);
    if (!trip) throw new AppError('Trip not found', 404, 'NOT_FOUND');
    if (trip.status === 'Completed') {
      throw new AppError('Completed trips cannot be cancelled', 409, 'CONFLICT');
    }
    if (trip.status === 'Cancelled') {
      throw new AppError('Trip is already cancelled', 409, 'CONFLICT');
    }

    const wasDispatched = trip.status === 'Dispatched';

    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    trip.cancelReason = reason || '';
    await trip.save({ session });

    if (wasDispatched) {
      const vehicle = await Vehicle.findById(trip.vehicleId).session(session);
      vehicle.status = 'Available';
      await vehicle.save({ session });

      const driver = await Driver.findById(trip.driverId).session(session);
      driver.status = 'Available';
      await driver.save({ session });
    }

    await session.commitTransaction();

    await logActivity({ userId, action: 'trip.cancel', entityType: 'Trip', entityId: trip._id, previousValue: { status: wasDispatched ? 'Dispatched' : 'Draft' }, currentValue: { status: 'Cancelled', reason } });

    return trip;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { getAll, getById, create, dispatch, complete, cancel };
