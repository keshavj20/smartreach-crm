const mongoose = require('mongoose');

const audienceQuerySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    include: { type: [String], default: [] },
    exclude: { type: [String], default: [] },
    days: { type: Number, default: 30 },
    totalSpent: { type: Number, default: 0 }
  },
  { _id: false }
);

module.exports = audienceQuerySchema;
