const Expense = require('../models/Expense.model');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityLog.service');

const getAll = async (req, res, next) => {
  try {
    const { vehicleId, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (vehicleId) query.vehicleId = vehicleId;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Expense.find(query).populate('vehicleId', 'registrationNumber name').sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(query),
    ]);
    sendPaginated(res, data, total, page, limit);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const expense = await Expense.create(req.body);
    await logActivity({ userId: req.user.id, action: 'expense.create', entityType: 'Expense', entityId: expense._id, currentValue: expense.toJSON() });
    sendCreated(res, expense, 'Expense created');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: { message: 'Expense not found' } });
    await logActivity({ userId: req.user.id, action: 'expense.delete', entityType: 'Expense', entityId: req.params.id, previousValue: expense.toJSON() });
    sendSuccess(res, { message: 'Expense deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, remove };
