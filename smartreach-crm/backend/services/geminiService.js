const { GoogleGenerativeAI } = require('@google/generative-ai');
const Settings = require('../models/Settings');

async function getApiKey() {
  // Check DB first, then env
  try {
    const setting = await Settings.findOne({ key: 'geminiApiKey' });
    if (setting?.value && setting.value.length > 10) return setting.value;
  } catch {}
  return process.env.GEMINI_API_KEY;
}

exports.getAudienceRecommendation = async ({ title, description, audienceSize, recommendation }) => {
  const apiKey = await getApiKey();

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Return mock data if no API key
    return getMockRecommendation(title);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert marketing strategist for a modern e-commerce brand.

Audience Segment: "${title}"
Description: "${description}"
Audience Size: ${audienceSize} customers
Current Recommendation: "${recommendation}"

Based on this customer audience, provide a detailed marketing strategy in the following JSON format:
{
  "campaignGoal": "A clear, specific campaign goal (1-2 sentences)",
  "bestChannel": "The single best channel (Email, SMS, WhatsApp, Push, or In-App) with brief reasoning",
  "marketingStrategy": "A detailed 3-4 sentence marketing strategy",
  "personalizedMessage": "A compelling, personalized marketing message for this audience (2-3 sentences)"
}

Respond ONLY with valid JSON. No markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return getMockRecommendation(title);
  }
};

exports.generateEmailCopy = async ({ prompt, audienceName, audienceDescription, audienceSize, channel, tone, campaignGoal }) => {
  const apiKey = await getApiKey();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      subject: `Exclusive offer for ${audienceName}`,
      body: `Hi there, this campaign is designed for ${audienceName}. ${campaignGoal} We recommend a ${tone.toLowerCase()} message with a strong incentive and personalization.`
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const promptText = `You are an AI marketing copywriter.

Audience: ${audienceName}
Description: ${audienceDescription}
Audience Size: ${audienceSize}
Channel: ${channel}
Tone: ${tone}
Campaign Goal: ${campaignGoal}
User Prompt: ${prompt}

Generate a subject line and email body. Return JSON only in this format:
{
  "subject": "...",
  "body": "..."
}`;

    const response = await model.generateContent(promptText);
    const text = response.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini email copy error:', err.message);
    return {
      subject: `Exclusive offer for ${audienceName}`,
      body: `Hi there, this campaign is designed for ${audienceName}. ${campaignGoal} We recommend a ${tone.toLowerCase()} message with a strong incentive and personalization.`
    };
  }
};

function getMockRecommendation(title) {
  const mocks = {
    'High Value Inactive Customers': {
      campaignGoal: 'Re-activate high-spending customers who have gone quiet, aiming for a 25% re-engagement rate within 2 weeks.',
      bestChannel: 'Email — preferred channel for personalized, high-value messaging with detailed offers.',
      marketingStrategy: 'Launch a personalized "We Miss You" email sequence with tiered loyalty rewards. Emphasize their VIP status and offer an exclusive comeback discount. Follow up with a second email showcasing new arrivals tailored to their past purchase history.',
      personalizedMessage: 'Hi [Name], as one of our most valued customers, we\'ve saved something special just for you. Use code VIPBACK20 for 20% off your next order — valid for 72 hours only.'
    },
    'Frequent Buyers': {
      campaignGoal: 'Convert top buyers into brand advocates and increase average order value by 15%.',
      bestChannel: 'WhatsApp — direct, personal channel ideal for VIP communication.',
      marketingStrategy: 'Launch an exclusive VIP loyalty program with tiered rewards for your most frequent buyers. Offer early access to new collections, referral bonuses, and personalized product recommendations based on their purchase history.',
      personalizedMessage: 'You\'re in our top 1% of shoppers! As a VIP member, you get first access to our new collection before anyone else — shop now and earn double points this weekend.'
    },
    'New Customers': {
      campaignGoal: 'Drive second purchase within 14 days to establish buying habit and reduce churn.',
      bestChannel: 'Email — best for onboarding sequences with educational and promotional content.',
      marketingStrategy: 'Deploy a 3-email welcome series: introduce your brand story, showcase bestsellers in their purchase category, and offer a limited-time second-purchase incentive. Include social proof and customer reviews to build trust.',
      personalizedMessage: 'Welcome to the family! Since your first order with us, we\'ve picked some products we think you\'ll love. Grab 15% off your second order with code WELCOME15 — expires in 7 days.'
    },
    'Cross-Sell Opportunities': {
      campaignGoal: 'Increase basket size through relevant product recommendations, targeting 30% cross-sell conversion.',
      bestChannel: 'Push — timely, contextual notifications ideal for product discovery.',
      marketingStrategy: 'Use smart "Complete the Look" campaigns showing Socks and accessories that pair with their Shoes purchases. Bundle pricing creates additional incentive. Include styling tips and outfit inspirations to make the recommendation feel natural and helpful.',
      personalizedMessage: 'Your new shoes are calling for a match! Complete your look with our bestselling sock bundles — designed to go perfectly with your style. Bundle and save 20% today!'
    },
    'Churn Risk Customers': {
      campaignGoal: 'Prevent customer loss by re-engaging at-risk customers with urgent, compelling offers.',
      bestChannel: 'SMS — highest open rates for urgent, time-sensitive communications.',
      marketingStrategy: 'Deploy a 2-message emergency re-engagement sequence. First SMS creates urgency with a time-limited offer. Follow up SMS escalates with a stronger incentive. Keep messages short, personal, and action-focused with a clear CTA link.',
      personalizedMessage: 'We haven\'t seen you in a while, [Name]! Your exclusive 30% off code COMEBACK30 expires in 48 hours. Don\'t miss out — tap to shop now.'
    }
  };

  return mocks[title] || {
    campaignGoal: 'Drive engagement and conversions for this targeted customer segment.',
    bestChannel: 'Email — versatile channel suitable for personalized messaging.',
    marketingStrategy: 'Create targeted content that speaks directly to this audience\'s needs and preferences. Use personalization tokens, compelling visuals, and a clear call-to-action.',
    personalizedMessage: 'We have a special offer tailored just for you. Check out our latest products and take advantage of your exclusive discount today!'
  };
}

exports.generateCampaignFromCustomer = async (customer, orders = []) => {
  const apiKey = await getApiKey();

  const daysSinceLastPurchase = customer.lastPurchaseDate
    ? Math.floor((Date.now() - new Date(customer.lastPurchaseDate)) / (1000 * 60 * 60 * 24))
    : null;

  const prompt = `You are a CRM marketing expert. Analyze this customer and generate a personalized campaign.

Customer Profile:
- Name: ${customer.name}
- City: ${customer.city || 'Unknown'}
- Total Spent: ₹${customer.totalSpent || 0}
- Last Purchase: ${daysSinceLastPurchase !== null ? daysSinceLastPurchase + ' days ago' : 'Never'}
- Order Count: ${orders.length}
- Recent Orders: ${orders.slice(0, 3).map(o => `₹${o.amount} (${o.status})`).join(', ') || 'None'}

Generate a personalized campaign in this JSON format:
{
  "name": "Campaign name (5-7 words)",
  "audienceName": "Segment name (e.g. Loyal Buyer, At-Risk Customer)",
  "channel": "Email or SMS or WhatsApp or Push or In-App",
  "message": "Personalized message for this specific customer (2-3 sentences, include their name)",
  "reasoning": "Why this campaign suits this customer (1 sentence)"
}

Respond ONLY with valid JSON.`;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      name: `Re-engage ${customer.name.split(' ')[0]}`,
      audienceName: customer.totalSpent > 5000 ? 'High Value Customer' : 'Regular Customer',
      channel: 'Email',
      message: `Hi ${customer.name}, we miss you! Here's a special 15% discount just for you. Use code BACK15 at checkout.`,
      reasoning: 'Customer has not purchased recently — re-engagement campaign recommended.'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini campaign generation error:', err.message);
    return {
      name: `Campaign for ${customer.name.split(' ')[0]}`,
      audienceName: 'General Segment',
      channel: 'Email',
      message: `Hi ${customer.name}, we have an exclusive offer just for you!`,
      reasoning: 'AI generation failed — using fallback.'
    };
  }
};
