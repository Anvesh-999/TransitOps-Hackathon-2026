const driverService = require('../services/driver.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const { status, licenseCategory, page = 1, limit = 20 } = req.query;
    const result = await driverService.getAll({ status, licenseCategory }, Number(page), Number(limit));
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const driver = await driverService.getById(req.params.id);
    sendSuccess(res, driver);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const driver = await driverService.create(req.body, req.user.id);
    sendCreated(res, driver, 'Driver created successfully');
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const driver = await driverService.update(req.params.id, req.body, req.user.id);
    sendSuccess(res, driver, 200, 'Driver updated successfully');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await driverService.remove(req.params.id, req.user.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const driver = await driverService.updateStatus(req.params.id, req.body.status, req.user.id);
    sendSuccess(res, driver, 200, 'Driver status updated');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
