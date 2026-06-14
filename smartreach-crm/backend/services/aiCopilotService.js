const Customer = require('../models/Customer');
const Order = require('../models/Order');
const geminiService = require('./geminiService');

function normalizePrompt(prompt = '') {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseChannel(prompt = '') {
  const lower = prompt.toLowerCase();
  if (lower.includes('whatsapp')) return 'WhatsApp';
  if (lower.includes('sms')) return 'SMS';
  if (lower.includes('push')) return 'Push';
  if (lower.includes('in-app') || lower.includes('in app')) return 'In-App';
  return 'Email';
}

function parseTone(prompt = '') {
  const lower = prompt.toLowerCase();
  if (lower.includes('formal')) return 'Formal';
  if (lower.includes('friendly')) return 'Friendly';
  if (lower.includes('urgent') || lower.includes('limited time') || lower.includes('hurry')) return 'Urgent';
  return 'Promotional';
}

function parseDays(prompt = '', fallback = 30) {
  const match = prompt.match(/(\d+)\s*days?/i);
  if (match) return Number(match[1]);
  return fallback;
}

function parseCampaignGoal(prompt = '') {
  const lower = prompt.toLowerCase();
  if (lower.includes('win-back')) return 'Re-engage churned customers with a high-converting win-back offer.';
  if (lower.includes('discount')) return 'Drive conversions by promoting a time-limited discount.';
  if (lower.includes('promotional')) return 'Increase revenue through a targeted promotional campaign.';
  if (lower.includes('cross-sell') || lower.includes('cross sell')) return 'Expand basket size by recommending complementary products.';
  return 'Engage the right customers with a personalized, high-value campaign.';
}

function stableStringify(value) {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildAudienceSignature(audienceQuery, channel) {
  return stableStringify({ channel, audienceQuery });
}

async function resolveAudience(prompt = '') {
  const lower = prompt.toLowerCase();
  const days = parseDays(prompt, 30);
  const channel = parseChannel(prompt);
  const tone = parseTone(prompt);
  const campaignGoal = parseCampaignGoal(prompt);

  if (/bought\s+shoes\s+but\s+not\s+socks|shoes.*not.*socks/i.test(lower)) {
    return {
      audienceName: 'Cross-Sell Opportunities',
      audienceDescription: 'Customers who bought Shoes but not Socks.',
      audienceQuery: { type: 'cross_sell', include: ['Shoes'], exclude: ['Socks'] },
      ruleKey: 'cross_sell',
      channel,
      tone,
      campaignGoal
    };
  }

  if (/(high[- ]value|vip|big spender|big spenders)/i.test(lower) && /inactive|not purchased|haven't purchased|haven’t purchased|no purchase/i.test(lower)) {
    return {
      audienceName: 'High Value Inactive Customers',
      audienceDescription: 'High-value customers who have not purchased in the last 30 days.',
      audienceQuery: { type: 'high_value_inactive', totalSpent: 5000, days },
      ruleKey: 'high_value_inactive',
      channel,
      tone,
      campaignGoal
    };
  }

  if (/new customers|first (?:order|purchase|time)/i.test(lower)) {
    return {
      audienceName: 'New Customers',
      audienceDescription: 'Customers who made exactly one purchase.',
      audienceQuery: { type: 'new_customers' },
      ruleKey: 'new_customers',
      channel,
      tone,
      campaignGoal
    };
  }

  if (/inactive|haven't purchased|haven’t purchased|no purchase|no order|churn risk|lost customer/i.test(lower)) {
    return {
      audienceName: 'Inactive Customers',
      audienceDescription: `Customers who have not purchased in the last ${days} days.`,
      audienceQuery: { type: 'inactive', days },
      ruleKey: 'inactive_customers',
      channel,
      tone,
      campaignGoal
    };
  }

  return {
    audienceName: 'All Customers',
    audienceDescription: 'A broad audience of all customers in the database.',
    audienceQuery: { type: 'all_customers' },
    ruleKey: 'all_customers',
    channel,
    tone,
    campaignGoal
  };
}

async function getAudienceCustomers(audienceQuery) {
  switch (audienceQuery.type) {
    case 'cross_sell': {
      const shoesBuyers = await Order.distinct('customerId', { category: { $in: audienceQuery.include || [] } });
      const excludeBuyers = await Order.distinct('customerId', { category: { $in: audienceQuery.exclude || [] } });
      const excludeSet = new Set((excludeBuyers || []).map(id => id.toString()));
      const customerIds = (shoesBuyers || []).filter(id => !excludeSet.has(id.toString()));
      return Customer.find({ _id: { $in: customerIds } });
    }
    case 'new_customers': {
      const orderCounts = await Order.aggregate([
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $match: { count: 1 } }
      ]);
      const ids = orderCounts.map(o => o._id);
      return Customer.find({ _id: { $in: ids } });
    }
    case 'high_value_inactive': {
      const threshold = audienceQuery.totalSpent || 5000;
      const days = audienceQuery.days || 30;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return Customer.find({
        totalSpent: { $gt: threshold },
        $or: [{ lastPurchaseDate: { $lt: cutoff } }, { lastPurchaseDate: null }]
      });
    }
    case 'inactive': {
      const days = audienceQuery.days || 30;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return Customer.find({ $or: [{ lastPurchaseDate: { $lt: cutoff } }, { lastPurchaseDate: null }] });
    }
    case 'all_customers':
    default:
      return Customer.find();
  }
}

async function generateEmailCopy({ prompt, audienceName, audienceDescription, audienceSize, channel, tone, campaignGoal }) {
  try {
    const result = await geminiService.generateEmailCopy({ prompt, audienceName, audienceDescription, audienceSize, channel, tone, campaignGoal });
    return {
      messageSubject: result.subject,
      messageBody: result.body
    };
  } catch (err) {
    return {
      messageSubject: `Special offer for ${audienceName}`,
      messageBody: `Hi there, we have a tailored offer for ${audienceName}. Don't miss this chance to take action and save today.`
    };
  }
}

async function buildCampaignPreview(prompt) {
  const normalizedPrompt = normalizePrompt(prompt);
  const audience = await resolveAudience(prompt);
  const customers = await getAudienceCustomers(audience.audienceQuery);
  const audienceSize = customers.length;
  const emailCopy = await generateEmailCopy({
    prompt,
    audienceName: audience.audienceName,
    audienceDescription: audience.audienceDescription,
    audienceSize,
    channel: audience.channel,
    tone: audience.tone,
    campaignGoal: audience.campaignGoal
  });

  const audienceSignature = buildAudienceSignature(audience.audienceQuery, audience.channel);

  return {
    prompt,
    normalizedPrompt,
    channel: audience.channel,
    tone: audience.tone,
    campaignGoal: audience.campaignGoal,
    audienceName: audience.audienceName,
    audienceDescription: audience.audienceDescription,
    audienceQuery: audience.audienceQuery,
    audienceSize,
    audienceSignature,
    messageSubject: emailCopy.messageSubject,
    messageBody: emailCopy.messageBody
  };
}

module.exports = {
  buildCampaignPreview,
  getAudienceCustomers,
  normalizePrompt,
  buildAudienceSignature
};
