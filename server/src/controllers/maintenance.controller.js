const maintenanceService = require('../services/maintenance.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const { vehicleId, status, page = 1, limit = 20 } = req.query;
    const result = await maintenanceService.getAll({ vehicleId, status }, Number(page), Number(limit));
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const record = await maintenanceService.getById(req.params.id);
    sendSuccess(res, record);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const record = await maintenanceService.create(req.body, req.user.id);
    sendCreated(res, record, 'Maintenance record created');
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const record = await maintenanceService.update(req.params.id, req.body, req.user.id);
    sendSuccess(res, record, 200, 'Maintenance record updated');
  } catch (error) { next(error); }
};

const close = async (req, res, next) => {
  try {
    const record = await maintenanceService.close(req.params.id, req.body.actualEndDate, req.user.id);
    sendSuccess(res, record, 200, 'Maintenance record closed');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, close };
