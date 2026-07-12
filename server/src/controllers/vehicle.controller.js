const vehicleService = require('../services/vehicle.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const { status, type, region, page = 1, limit = 20 } = req.query;
    const result = await vehicleService.getAll({ status, type, region }, Number(page), Number(limit));
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getById(req.params.id);
    sendSuccess(res, vehicle);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.create(req.body, req.user.id);
    sendCreated(res, vehicle, 'Vehicle created successfully');
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.update(req.params.id, req.body, req.user.id);
    sendSuccess(res, vehicle, 200, 'Vehicle updated successfully');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await vehicleService.remove(req.params.id, req.user.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateStatus(req.params.id, req.body.status, req.user.id);
    sendSuccess(res, vehicle, 200, 'Vehicle status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
