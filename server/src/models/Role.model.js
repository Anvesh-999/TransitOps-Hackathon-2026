const mongoose = require('mongoose');
const { ROLE_LIST } = require('../config/constants');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ROLE_LIST,
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model('Role', roleSchema);
