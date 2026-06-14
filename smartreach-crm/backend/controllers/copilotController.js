const Campaign = require('../models/Campaign');
const Communication = require('../models/Communication');
const emailService = require('../services/emailService');
const { buildCampaignPreview, getAudienceCustomers } = require('../services/aiCopilotService');

exports.previewCampaign = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const preview = await buildCampaignPreview(prompt);
    res.json({ success: true, data: preview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.launchCampaign = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const preview = await buildCampaignPreview(prompt);

    const existing = await Campaign.findOne({
      audienceSignature: preview.audienceSignature,
      channel: preview.channel,
      prompt: preview.normalizedPrompt
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A similar campaign already exists',
        data: existing
      });
    }

    const campaign = new Campaign({
      name: `${preview.audienceName} Campaign`,
      prompt: preview.prompt,
      audienceName: preview.audienceName,
      audienceDescription: preview.audienceDescription,
      audienceQuery: preview.audienceQuery,
      audienceSize: preview.audienceSize,
      channel: preview.channel,
      messageSubject: preview.messageSubject,
      message: preview.messageBody,
      audienceSignature: preview.audienceSignature,
      tone: preview.tone,
      campaignGoal: preview.campaignGoal,
      status: 'Draft'
    });

    await campaign.save();

    const customers = await getAudienceCustomers(preview.audienceQuery);
    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No audience members were found for this campaign.'
      });
    }

    const communications = customers.map((customer) => ({
      campaignId: campaign._id,
      customerId: customer._id,
      status: 'Sent',
      statusHistory: [{ status: 'Sent', timestamp: new Date() }],
      timestamp: new Date()
    }));

    await Communication.insertMany(communications);

    campaign.status = 'Active';
    campaign.sentAt = new Date();
    campaign.stats.sent = communications.length;
    await campaign.save();

    emailService.simulateCampaign(campaign._id.toString());

    res.status(201).json({
      success: true,
      message: `Campaign launched to ${communications.length} recipients`,
      data: { campaign, preview }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
