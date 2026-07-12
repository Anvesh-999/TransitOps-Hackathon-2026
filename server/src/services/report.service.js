const Vehicle = require('../models/Vehicle.model');
const Trip = require('../models/Trip.model');
const Driver = require('../models/Driver.model');
const FuelLog = require('../models/FuelLog.model');
const Maintenance = require('../models/Maintenance.model');
const Expense = require('../models/Expense.model');

/**
 * Vehicle Utilization — (Days On Trip / Total Days) × 100 per vehicle.
 */
const vehicleUtilization = async (dateRange, vehicleId) => {
  const match = { status: 'Completed' };
  if (dateRange?.start) match.completedAt = { $gte: new Date(dateRange.start) };
  if (dateRange?.end) match.completedAt = { ...match.completedAt, $lte: new Date(dateRange.end) };
  if (vehicleId) match.vehicleId = vehicleId;

  const trips = await Trip.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$vehicleId',
        tripCount: { $sum: 1 },
        totalDistanceKm: { $sum: '$actualDistanceKm' },
        totalDays: {
          $sum: {
            $divide: [{ $subtract: ['$completedAt', '$dispatchedAt'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
    },
    {
      $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' },
    },
    { $unwind: '$vehicle' },
    {
      $project: {
        registrationNumber: '$vehicle.registrationNumber',
        name: '$vehicle.name',
        tripCount: 1,
        totalDistanceKm: { $round: ['$totalDistanceKm', 2] },
        totalDays: { $round: ['$totalDays', 2] },
      },
    },
  ]);

  return trips;
};

/**
 * Fuel Efficiency — km/L per vehicle or trip.
 */
const fuelEfficiency = async (dateRange, vehicleId) => {
  const match = { status: 'Completed', fuelConsumedLiters: { $gt: 0 } };
  if (dateRange?.start) match.completedAt = { $gte: new Date(dateRange.start) };
  if (dateRange?.end) match.completedAt = { ...match.completedAt, $lte: new Date(dateRange.end) };
  if (vehicleId) match.vehicleId = vehicleId;

  return Trip.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$vehicleId',
        totalDistance: { $sum: '$actualDistanceKm' },
        totalFuel: { $sum: '$fuelConsumedLiters' },
        tripCount: { $sum: 1 },
      },
    },
    {
      $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' },
    },
    { $unwind: '$vehicle' },
    {
      $project: {
        registrationNumber: '$vehicle.registrationNumber',
        name: '$vehicle.name',
        totalDistance: { $round: ['$totalDistance', 2] },
        totalFuel: { $round: ['$totalFuel', 2] },
        efficiency: { $round: [{ $divide: ['$totalDistance', '$totalFuel'] }, 2] },
        tripCount: 1,
      },
    },
    { $sort: { efficiency: -1 } },
  ]);
};

/**
 * Operational Cost — Fuel + Maintenance + Expenses per vehicle.
 */
const operationalCost = async (dateRange, vehicleId) => {
  const dateFilter = {};
  if (dateRange?.start) dateFilter.$gte = new Date(dateRange.start);
  if (dateRange?.end) dateFilter.$lte = new Date(dateRange.end);

  const vehicleFilter = vehicleId ? { vehicleId } : {};
  const dateMatch = Object.keys(dateFilter).length ? { date: dateFilter } : {};

  const [fuelCosts, maintCosts, expenseCosts] = await Promise.all([
    FuelLog.aggregate([
      { $match: { ...vehicleFilter, ...dateMatch } },
      { $group: { _id: '$vehicleId', total: { $sum: '$totalCost' } } },
    ]),
    Maintenance.aggregate([
      { $match: { ...vehicleFilter, ...(Object.keys(dateFilter).length ? { startDate: dateFilter } : {}) } },
      { $group: { _id: '$vehicleId', total: { $sum: '$cost' } } },
    ]),
    Expense.aggregate([
      { $match: { ...vehicleFilter, ...dateMatch } },
      { $group: { _id: '$vehicleId', total: { $sum: '$amount' } } },
    ]),
  ]);

  // Merge by vehicleId
  const costMap = {};
  const addToMap = (arr, key) => {
    arr.forEach(({ _id, total }) => {
      const id = _id.toString();
      if (!costMap[id]) costMap[id] = { vehicleId: _id, fuel: 0, maintenance: 0, expenses: 0 };
      costMap[id][key] = total;
    });
  };

  addToMap(fuelCosts, 'fuel');
  addToMap(maintCosts, 'maintenance');
  addToMap(expenseCosts, 'expenses');

  const results = Object.values(costMap).map((item) => ({
    ...item,
    total: item.fuel + item.maintenance + item.expenses,
  }));

  // Populate vehicle info
  const vehicleIds = results.map((r) => r.vehicleId);
  const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } }, 'registrationNumber name');
  const vehicleMap = {};
  vehicles.forEach((v) => { vehicleMap[v._id.toString()] = v; });

  return results.map((r) => ({
    ...r,
    registrationNumber: vehicleMap[r.vehicleId.toString()]?.registrationNumber,
    vehicleName: vehicleMap[r.vehicleId.toString()]?.name,
  }));
};

/**
 * Driver Statistics — trips completed, distance, avg safety score.
 */
const driverStats = async (dateRange, driverId) => {
  const match = { status: 'Completed' };
  if (dateRange?.start) match.completedAt = { $gte: new Date(dateRange.start) };
  if (dateRange?.end) match.completedAt = { ...match.completedAt, $lte: new Date(dateRange.end) };
  if (driverId) match.driverId = driverId;

  return Trip.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$driverId',
        tripsCompleted: { $sum: 1 },
        totalDistance: { $sum: '$actualDistanceKm' },
      },
    },
    {
      $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' },
    },
    { $unwind: '$driver' },
    {
      $project: {
        name: '$driver.name',
        licenseNumber: '$driver.licenseNumber',
        safetyScore: '$driver.safetyScore',
        tripsCompleted: 1,
        totalDistance: { $round: ['$totalDistance', 2] },
      },
    },
    { $sort: { tripsCompleted: -1 } },
  ]);
};

/**
 * Fleet Utilization — % of non-retired vehicles on trip at any point.
 */
const fleetUtilization = async () => {
  const [totalNonRetired, onTrip] = await Promise.all([
    Vehicle.countDocuments({ status: { $ne: 'Retired' } }),
    Vehicle.countDocuments({ status: 'On Trip' }),
  ]);

  return {
    totalVehicles: totalNonRetired,
    vehiclesOnTrip: onTrip,
    utilizationPercent: totalNonRetired > 0 ? Math.round((onTrip / totalNonRetired) * 100 * 100) / 100 : 0,
  };
};

module.exports = { vehicleUtilization, fuelEfficiency, operationalCost, driverStats, fleetUtilization };
