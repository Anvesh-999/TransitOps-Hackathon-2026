const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const Trip = require('../models/Trip.model');
const Maintenance = require('../models/Maintenance.model');
const FuelLog = require('../models/FuelLog.model');
const Expense = require('../models/Expense.model');
const ActivityLog = require('../models/ActivityLog.model');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Helper — resolves date range from query params.
 * Supports: days=7|30|90 or start/end ISO dates.
 */
const resolveDateRange = (query) => {
  if (query.days) {
    return new Date(Date.now() - Number(query.days) * 24 * 60 * 60 * 1000);
  }
  if (query.start) {
    return new Date(query.start);
  }
  // Default: last 30 days
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
};

const getKpis = async (req, res, next) => {
  try {
    const sinceDate = resolveDateRange(req.query);

    const [
      totalVehicles, availableVehicles, inShopVehicles, onTripVehicles,
      activeTrips, pendingTrips, completedTrips, cancelledTrips,
      totalDrivers, driversOnDuty, expiringLicenses,
    ] = await Promise.all([
      Vehicle.countDocuments({ status: { $ne: 'Retired' } }),
      Vehicle.countDocuments({ status: 'Available' }),
      Vehicle.countDocuments({ status: 'In Shop' }),
      Vehicle.countDocuments({ status: 'On Trip' }),
      Trip.countDocuments({ status: 'Dispatched' }),
      Trip.countDocuments({ status: 'Draft' }),
      Trip.countDocuments({ status: 'Completed', completedAt: { $gte: sinceDate } }),
      Trip.countDocuments({ status: 'Cancelled', cancelledAt: { $gte: sinceDate } }),
      Driver.countDocuments({ status: { $ne: 'Suspended' } }),
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

    // Total operational cost within date range
    const [fuelCost, maintCost, expenseCost] = await Promise.all([
      FuelLog.aggregate([{ $match: { date: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }]),
      Maintenance.aggregate([{ $match: { startDate: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Total revenue within date range
    const revenueResult = await Trip.aggregate([
      { $match: { status: 'Completed', completedAt: { $gte: sinceDate } } },
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]);

    const totalOperationalCost =
      (fuelCost[0]?.total || 0) + (maintCost[0]?.total || 0) + (expenseCost[0]?.total || 0);
    const totalRevenue = revenueResult[0]?.total || 0;

    sendSuccess(res, {
      totalVehicles,
      availableVehicles,
      inShopVehicles,
      onTripVehicles,
      activeTrips,
      pendingTrips,
      completedTrips,
      cancelledTrips,
      totalDrivers,
      driversOnDuty,
      fleetUtilization,
      totalOperationalCost,
      totalRevenue,
      netProfit: totalRevenue - totalOperationalCost,
      expiringLicenses,
      isEmpty: totalVehicles === 0,
    });
  } catch (error) { next(error); }
};

const getCharts = async (req, res, next) => {
  try {
    const sinceDate = resolveDateRange(req.query);

    // Cost breakdown (Fuel vs Maintenance vs Expenses)
    const [fuelTotal, maintTotal, expenseTotal] = await Promise.all([
      FuelLog.aggregate([{ $match: { date: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }]),
      Maintenance.aggregate([{ $match: { startDate: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: sinceDate } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Trip status breakdown within date range
    const tripStatusBreakdown = await Trip.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Vehicle type distribution
    const vehicleTypeDistribution = await Vehicle.aggregate([
      { $match: { status: { $ne: 'Retired' } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
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

    // Trips per day trend (last N days)
    const tripsPerDay = await Trip.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    sendSuccess(res, {
      costBreakdown: {
        labels: ['Fuel', 'Maintenance', 'Expenses'],
        datasets: [{
          data: [fuelTotal[0]?.total || 0, maintTotal[0]?.total || 0, expenseTotal[0]?.total || 0],
          backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444'],
        }],
      },
      tripStatusBreakdown: {
        labels: tripStatusBreakdown.map((s) => s._id),
        datasets: [{
          data: tripStatusBreakdown.map((s) => s.count),
          backgroundColor: ['#6B7280', '#3B82F6', '#16A34A', '#DC2626'],
        }],
      },
      vehicleTypeDistribution: {
        labels: vehicleTypeDistribution.map((v) => v._id),
        datasets: [{
          data: vehicleTypeDistribution.map((v) => v.count),
          backgroundColor: ['#8B5CF6', '#06B6D4', '#F97316', '#14B8A6', '#EC4899'],
        }],
      },
      safetyDistribution: {
        labels: ['0-50 (Poor)', '50-75 (Fair)', '75-100 (Good)'],
        datasets: [{
          data: safetyDistribution.map((b) => b.count),
          backgroundColor: ['#EF4444', '#F59E0B', '#16A34A'],
        }],
      },
      tripsPerDay: {
        labels: tripsPerDay.map((d) => d._id),
        datasets: [{
          label: 'Trips',
          data: tripsPerDay.map((d) => d.count),
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
        }],
      },
    });
  } catch (error) { next(error); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const activities = await ActivityLog.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit);

    sendSuccess(res, activities);
  } catch (error) { next(error); }
};

module.exports = { getKpis, getCharts, getRecentActivity };
