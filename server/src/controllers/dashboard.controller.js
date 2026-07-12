const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const Trip = require('../models/Trip.model');
const Maintenance = require('../models/Maintenance.model');
const FuelLog = require('../models/FuelLog.model');
const Expense = require('../models/Expense.model');
const ActivityLog = require('../models/ActivityLog.model');
const { sendSuccess } = require('../utils/apiResponse');

const getKpis = async (req, res, next) => {
  try {
    const [
      totalVehicles, availableVehicles, inShopVehicles, onTripVehicles,
      activeTrips, pendingTrips,
      driversOnDuty, expiringLicenses,
    ] = await Promise.all([
      Vehicle.countDocuments({ status: { $ne: 'Retired' } }),
      Vehicle.countDocuments({ status: 'Available' }),
      Vehicle.countDocuments({ status: 'In Shop' }),
      Vehicle.countDocuments({ status: 'On Trip' }),
      Trip.countDocuments({ status: 'Dispatched' }),
      Trip.countDocuments({ status: 'Draft' }),
      Driver.countDocuments({ status: 'On Trip' }),
      Driver.countDocuments({
        licenseExpiryDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gte: new Date(),
        },
      }),
    ]);

    const nonRetired = totalVehicles || 1;
    const fleetUtilization = Math.round((onTripVehicles / nonRetired) * 100 * 100) / 100;

    // Total operational cost (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [fuelCost, maintCost, expenseCost] = await Promise.all([
      FuelLog.aggregate([{ $match: { date: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }]),
      Maintenance.aggregate([{ $match: { startDate: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const totalOperationalCost =
      (fuelCost[0]?.total || 0) + (maintCost[0]?.total || 0) + (expenseCost[0]?.total || 0);

    sendSuccess(res, {
      totalVehicles,
      availableVehicles,
      inShopVehicles,
      onTripVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      totalOperationalCost,
      expiringLicenses,
      isEmpty: totalVehicles === 0,
    });
  } catch (error) { next(error); }
};

const getCharts = async (req, res, next) => {
  try {
    // Cost breakdown (Fuel vs Maintenance vs Expenses)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [fuelTotal, maintTotal, expenseTotal] = await Promise.all([
      FuelLog.aggregate([{ $match: { date: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }]),
      Maintenance.aggregate([{ $match: { startDate: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Driver safety score distribution
    const safetyDistribution = await Driver.aggregate([
      {
        $bucket: {
          groupBy: '$safetyScore',
          boundaries: [0, 50, 75, 100.01],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    sendSuccess(res, {
      costBreakdown: {
        labels: ['Fuel', 'Maintenance', 'Expenses'],
        datasets: [{
          data: [fuelTotal[0]?.total || 0, maintTotal[0]?.total || 0, expenseTotal[0]?.total || 0],
        }],
      },
      safetyDistribution: {
        labels: ['0-50', '50-75', '75-100'],
        datasets: [{ data: safetyDistribution.map((b) => b.count) }],
      },
    });
  } catch (error) { next(error); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const activities = await ActivityLog.find()
      .populate('userId', 'name')
      .sort({ timestamp: -1 })
      .limit(10);

    sendSuccess(res, activities);
  } catch (error) { next(error); }
};

module.exports = { getKpis, getCharts, getRecentActivity };
