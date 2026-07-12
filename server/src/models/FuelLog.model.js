const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    liters: {
      type: Number,
      required: [true, 'Liters is required'],
      min: [0.01, 'Liters must be greater than 0'],
    },
    costPerLiter: {
      type: Number,
      min: [0, 'Cost per liter cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  { timestamps: true }
);

fuelLogSchema.index({ vehicleId: 1, date: -1 });

// Auto-compute totalCost if not provided
fuelLogSchema.pre('validate', function (next) {
  if (this.costPerLiter && !this.totalCost) {
    this.totalCost = this.liters * this.costPerLiter;
  }
  if (!this.totalCost) {
    this.totalCost = 0;
  }
  next();
});

fuelLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('FuelLog', fuelLogSchema);
