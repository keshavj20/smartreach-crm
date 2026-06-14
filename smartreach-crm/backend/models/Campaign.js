const mongoose = require('mongoose');

const audienceQuerySchema = require('./AudienceQuery');

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      trim: true
    },
    audienceName: {
      type: String,
      required: [true, 'Audience name is required'],
      trim: true
    },
    audienceDescription: {
      type: String,
      default: ''
    },
    audienceQuery: {
      type: audienceQuerySchema,
      required: true
    },
    audienceSize: {
      type: Number,
      default: 0
    },
    audienceSignature: {
      type: String,
      required: true,
      unique: true
    },
    channel: {
      type: String,
      required: [true, 'Channel is required'],
      enum: ['Email', 'SMS', 'WhatsApp', 'Push', 'In-App']
    },
    tone: {
      type: String,
      default: 'Promotional'
    },
    campaignGoal: {
      type: String,
      default: ''
    },
    messageSubject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required']
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Completed', 'Paused', 'Failed'],
      default: 'Draft'
    },
    audienceRuleKey: {
      type: String,
      default: ''
    },
    sentAt: {
      type: Date,
      default: null
    },
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
