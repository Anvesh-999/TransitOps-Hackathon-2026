const Driver = require('../models/Driver.model');
const Trip = require('../models/Trip.model');
const AppError = require('../utils/AppError');
const { logActivity } = require('./activityLog.service');
const { createNotification } = require('./notification.service');

const getAll = async (filters = {}, page = 1, limit = 20) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.licenseCategory) query.licenseCategory = filters.licenseCategory;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { licenseNumber: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Driver.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Driver.countDocuments(query),
  ]);

  return { data, total, page, limit };
};

const getById = async (id) => {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError('Driver not found', 404, 'NOT_FOUND');
  return driver;
};

const create = async (data, userId) => {
  const driver = await Driver.create(data);

  // Check if license expires within 30 days — trigger notification
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (new Date(data.licenseExpiryDate) <= thirtyDaysFromNow) {
    const daysUntilExpiry = Math.ceil((new Date(data.licenseExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    await createNotification({
      type: 'license_expiry_warning',
      recipientRoles: ['SafetyOfficer', 'Admin'],
      message: `Driver ${driver.name}'s license expires in ${daysUntilExpiry} days`,
      priority: daysUntilExpiry <= 7 ? 'High' : 'Medium',
      relatedEntityType: 'Driver',
      relatedEntityId: driver._id,
    });
  }

  await logActivity({
    userId,
    action: 'driver.create',
    entityType: 'Driver',
    entityId: driver._id,
    currentValue: driver.toJSON(),
  });

  return driver;
};

const update = async (id, data, userId) => {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError('Driver not found', 404, 'NOT_FOUND');

  const previousValue = driver.toJSON();
  Object.assign(driver, data);
  await driver.save();

  await logActivity({
    userId,
    action: 'driver.update',
    entityType: 'Driver',
    entityId: driver._id,
    previousValue,
    currentValue: driver.toJSON(),
  });

  return driver;
};

const remove = async (id, userId) => {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError('Driver not found', 404, 'NOT_FOUND');

  const tripCount = await Trip.countDocuments({ driverId: id });
  if (tripCount > 0) {
    throw new AppError('Cannot delete driver with existing trip records; suspend instead', 409, 'CONFLICT');
  }

  await Driver.findByIdAndDelete(id);

  await logActivity({
    userId,
    action: 'driver.delete',
    entityType: 'Driver',
    entityId: id,
    previousValue: driver.toJSON(),
  });

  return { message: 'Driver deleted successfully' };
};

const updateStatus = async (id, status, userId) => {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError('Driver not found', 404, 'NOT_FOUND');

  const previousValue = { status: driver.status };
  driver.status = status;
  await driver.save();

  const action = status === 'Suspended' ? 'driver.suspend' : 'driver.statusChange';
  await logActivity({
    userId,
    action,
    entityType: 'Driver',
    entityId: driver._id,
    previousValue,
    currentValue: { status },
  });

  return driver;
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
