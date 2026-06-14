const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Failed', 'Opened', 'Clicked'],
      default: 'Sent'
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

communicationSchema.index({ campaignId: 1 });
communicationSchema.index({ customerId: 1 });
communicationSchema.index({ status: 1 });

module.exports = mongoose.model('Communication', communicationSchema);
