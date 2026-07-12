const tripService = require('../services/trip.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const { status, vehicleId, driverId, page = 1, limit = 20 } = req.query;
    // Driver role: only own trips
    const filters = { status, vehicleId, driverId };
    if (req.user.role === 'Driver') {
      const Driver = require('../models/Driver.model');
      const driver = await Driver.findOne({ userId: req.user.id });
      if (driver) filters.driverId = driver._id.toString();
    }
    const result = await tripService.getAll(filters, Number(page), Number(limit));
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const trip = await tripService.getById(req.params.id);
    sendSuccess(res, trip);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const trip = await tripService.create(req.body, req.user.id);
    sendCreated(res, trip, 'Trip created successfully');
  } catch (error) { next(error); }
};

const dispatch = async (req, res, next) => {
  try {
    const trip = await tripService.dispatch(req.params.id, req.user.id);
    sendSuccess(res, trip, 200, 'Trip dispatched successfully');
  } catch (error) { next(error); }
};

const complete = async (req, res, next) => {
  try {
    const trip = await tripService.complete(req.params.id, req.body, req.user.id);
    sendSuccess(res, trip, 200, 'Trip completed successfully');
  } catch (error) { next(error); }
};

const cancel = async (req, res, next) => {
  try {
    const trip = await tripService.cancel(req.params.id, req.body.reason, req.user.id);
    sendSuccess(res, trip, 200, 'Trip cancelled successfully');
  } catch (error) { next(error); }
};

const logTelemetryEvent = async (req, res, next) => {
  try {
    const { eventType, value, message } = req.body;
    const tripId = req.params.id;
    
    const trip = await tripService.getById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { message: 'Trip not found' } });
    }
    
    const notificationService = require('../services/notification.service');
    const activityLogService = require('../services/activityLog.service');
    
    const vehicleReg = trip.vehicleId?.registrationNumber || 'Vehicle';
    const driverName = trip.driverId?.name || 'Driver';
    
    let alertMsg = message || `Telemetry update for ${vehicleReg}`;
    let priority = 'Medium';
    let type = 'trip_dispatched';
    
    if (eventType === 'speeding') {
      alertMsg = `Speed Warning: ${vehicleReg} (Driver: ${driverName}) clocked at ${value} km/h (Limit: 80 km/h).`;
      priority = 'High';
    } else if (eventType === 'overheating') {
      alertMsg = `Engine Coolant Alert: ${vehicleReg} temperature is at ${value}°C (Threshold: 98°C).`;
      priority = 'High';
      type = 'maintenance_due';
    } else if (eventType === 'fatigue') {
      alertMsg = `Safety Warning: Driver fatigue warning triggered for ${driverName} on route ${trip.source} to ${trip.destination}.`;
      priority = 'High';
    } else if (eventType === 'crash') {
      alertMsg = `CRITICAL COLLISION INCIDENT: G-Force impact alert triggered on ${vehicleReg} (Driver: ${driverName}). Assist immediately!`;
      priority = 'High';
      type = 'system';
      
      // Update trip in database
      trip.status = 'Cancelled';
      trip.cancelReason = 'Collision incident event telemetry alert';
      await trip.save();
      
      // Change vehicle status to In Shop
      const Vehicle = require('../models/Vehicle.model');
      if (trip.vehicleId) {
        await Vehicle.findByIdAndUpdate(trip.vehicleId._id, { status: 'In Shop' });
      }
    }
    
    // Create Notification
    await notificationService.createNotification({
      type,
      recipientRoles: ['Admin', 'FleetManager', 'SafetyOfficer'],
      message: alertMsg,
      priority,
      relatedEntityType: 'Trip',
      relatedEntityId: tripId,
    });
    
    // Log Activity
    await activityLogService.logActivity({
      userId: req.user.id,
      action: 'vehicle.statusChange',
      entityType: 'Trip',
      entityId: tripId,
      previousValue: { telemetry: 'Normal' },
      currentValue: { telemetry: eventType, value },
    });
    
    res.status(200).json({ success: true, message: 'Telemetry event logged successfully', status: trip.status });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, dispatch, complete, cancel, logTelemetryEvent };
