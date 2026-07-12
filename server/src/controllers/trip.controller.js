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

module.exports = { getAll, getById, create, dispatch, complete, cancel };
