/**
 * Seed script — populates demo data for hackathon demo.
 * Run: npm run seed
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Role = require('../src/models/Role.model');
const User = require('../src/models/User.model');
const Vehicle = require('../src/models/Vehicle.model');
const Driver = require('../src/models/Driver.model');
const Trip = require('../src/models/Trip.model');
const Maintenance = require('../src/models/Maintenance.model');
const FuelLog = require('../src/models/FuelLog.model');
const Expense = require('../src/models/Expense.model');
const { PERMISSIONS } = require('../src/config/constants');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('🔌 Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Role.deleteMany({}),
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Trip.deleteMany({}),
    Maintenance.deleteMany({}),
    FuelLog.deleteMany({}),
    Expense.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Roles ──
  const roles = await Role.insertMany([
    { name: 'Admin', permissions: PERMISSIONS['Admin'] },
    { name: 'FleetManager', permissions: PERMISSIONS['FleetManager'] },
    { name: 'Driver', permissions: PERMISSIONS['Driver'] },
    { name: 'SafetyOfficer', permissions: PERMISSIONS['SafetyOfficer'] },
    { name: 'FinancialAnalyst', permissions: PERMISSIONS['FinancialAnalyst'] },
  ]);
  console.log('✅ Roles seeded');

  const roleMap = {};
  roles.forEach((r) => { roleMap[r.name] = r._id; });

  // ── Users ──
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const users = await User.create([
    { name: 'System Admin', email: 'admin@transitops.com', passwordHash, role: roleMap['Admin'] },
    { name: 'Rajesh Kumar', email: 'rajesh@transitops.com', passwordHash: await bcrypt.hash('Fleet@123', 10), role: roleMap['FleetManager'] },
    { name: 'Alex Menon', email: 'alex@transitops.com', passwordHash: await bcrypt.hash('Driver@123', 10), role: roleMap['Driver'] },
    { name: 'Priya Sharma', email: 'priya@transitops.com', passwordHash: await bcrypt.hash('Safety@123', 10), role: roleMap['SafetyOfficer'] },
    { name: 'Meera Iyer', email: 'meera@transitops.com', passwordHash: await bcrypt.hash('Finance@123', 10), role: roleMap['FinancialAnalyst'] },
  ]);
  console.log('✅ Users seeded');

  // ── Vehicles ──
  const vehicles = await Vehicle.insertMany([
    { registrationNumber: 'MH12AB1234', name: 'Truck-01', type: 'Truck', maxLoadCapacityKg: 5000, odometerKm: 45000, acquisitionCost: 2500000, status: 'Available', region: 'West' },
    { registrationNumber: 'MH12CD5678', name: 'Van-02', type: 'Van', maxLoadCapacityKg: 1000, odometerKm: 28000, acquisitionCost: 800000, status: 'Available', region: 'West' },
    { registrationNumber: 'KA01EF9012', name: 'Truck-03', type: 'Truck', maxLoadCapacityKg: 8000, odometerKm: 62000, acquisitionCost: 3200000, status: 'Available', region: 'South' },
    { registrationNumber: 'DL04GH3456', name: 'Van-04', type: 'Van', maxLoadCapacityKg: 800, odometerKm: 15000, acquisitionCost: 600000, status: 'Available', region: 'North' },
    { registrationNumber: 'TN07IJ7890', name: 'Bus-05', type: 'Bus', maxLoadCapacityKg: 3000, odometerKm: 90000, acquisitionCost: 4500000, status: 'Available', region: 'South' },
    { registrationNumber: 'MH14KL2345', name: 'Bike-06', type: 'Bike', maxLoadCapacityKg: 20, odometerKm: 5000, acquisitionCost: 120000, status: 'Available', region: 'West' },
    { registrationNumber: 'GJ05MN6789', name: 'Trailer-07', type: 'Trailer', maxLoadCapacityKg: 15000, odometerKm: 75000, acquisitionCost: 5000000, status: 'In Shop', region: 'West' },
    { registrationNumber: 'RJ14OP0123', name: 'Truck-08', type: 'Truck', maxLoadCapacityKg: 6000, odometerKm: 105000, acquisitionCost: 2800000, status: 'Retired', region: 'North' },
  ]);
  console.log('✅ Vehicles seeded');

  // ── Drivers ──
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);

  const nearExpiryDate = new Date();
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 15);

  const drivers = await Driver.insertMany([
    { name: 'Alex Menon', licenseNumber: 'DL0120230001', licenseCategory: 'HMV', licenseExpiryDate: futureDate, contactNumber: '9876543210', safetyScore: 95, status: 'Available', userId: users[2]._id },
    { name: 'Vikram Singh', licenseNumber: 'DL0220230002', licenseCategory: 'HMV', licenseExpiryDate: futureDate, contactNumber: '9876543211', safetyScore: 88, status: 'Available' },
    { name: 'Suresh Patel', licenseNumber: 'DL0320230003', licenseCategory: 'LMV', licenseExpiryDate: nearExpiryDate, contactNumber: '9876543212', safetyScore: 72, status: 'Available' },
    { name: 'Ramesh Yadav', licenseNumber: 'DL0420230004', licenseCategory: 'HMV', licenseExpiryDate: futureDate, contactNumber: '9876543213', safetyScore: 91, status: 'Available' },
    { name: 'Kiran Das', licenseNumber: 'DL0520230005', licenseCategory: 'LMV', licenseExpiryDate: futureDate, contactNumber: '9876543214', safetyScore: 65, status: 'Suspended' },
    { name: 'Anil Kumar', licenseNumber: 'DL0620230006', licenseCategory: 'MCWG', licenseExpiryDate: futureDate, contactNumber: '9876543215', safetyScore: 100, status: 'Available' },
  ]);
  console.log('✅ Drivers seeded');

  // ── Sample completed trip ──
  const completedTrip = await Trip.create({
    source: 'Mumbai', destination: 'Pune', vehicleId: vehicles[0]._id, driverId: drivers[0]._id,
    cargoWeightKg: 3000, plannedDistanceKm: 150, actualDistanceKm: 148, finalOdometerKm: 45148,
    fuelConsumedLiters: 30, revenue: 15000, status: 'Completed',
    dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: users[1]._id,
  });

  // Draft trip
  await Trip.create({
    source: 'Delhi', destination: 'Jaipur', vehicleId: vehicles[3]._id, driverId: drivers[3]._id,
    cargoWeightKg: 500, plannedDistanceKm: 280, status: 'Draft', createdBy: users[1]._id,
  });
  console.log('✅ Trips seeded');

  // ── Maintenance ──
  await Maintenance.create({
    vehicleId: vehicles[6]._id, type: 'Repair', description: 'Engine overhaul',
    cost: 45000, startDate: new Date(), expectedEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'Open',
  });
  console.log('✅ Maintenance seeded');

  // ── Fuel Logs ──
  await FuelLog.create({
    vehicleId: vehicles[0]._id, tripId: completedTrip._id, liters: 30, costPerLiter: 105,
    totalCost: 3150, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });
  console.log('✅ Fuel logs seeded');

  // ── Expenses ──
  await Expense.insertMany([
    { vehicleId: vehicles[0]._id, category: 'Toll', amount: 450, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), notes: 'Mumbai-Pune expressway' },
    { vehicleId: vehicles[2]._id, category: 'Insurance', amount: 25000, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), notes: 'Annual insurance renewal' },
    { vehicleId: vehicles[4]._id, category: 'Parking', amount: 200, date: new Date(), notes: 'Bus depot parking' },
  ]);
  console.log('✅ Expenses seeded');

  console.log('\n🎉 Seed complete! Demo data ready.\n');
  console.log('Demo Credentials:');
  console.log('  Admin:            admin@transitops.com / Admin@123');
  console.log('  Fleet Manager:    rajesh@transitops.com / Fleet@123');
  console.log('  Driver:           alex@transitops.com / Driver@123');
  console.log('  Safety Officer:   priya@transitops.com / Safety@123');
  console.log('  Financial Analyst: meera@transitops.com / Finance@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
