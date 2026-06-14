const Campaign = require('../models/Campaign');
const Communication = require('../models/Communication');

const statusFlows = [
  { status: 'Delivered', weight: 0.6 },
  { status: 'Opened', weight: 0.2 },
  { status: 'Clicked', weight: 0.1 },
  { status: 'Failed', weight: 0.1 }
];

function pickStatus() {
  const rand = Math.random();
  if (rand < 0.1) return 'Failed';
  if (rand < 0.5) return 'Delivered';
  if (rand < 0.8) return 'Opened';
  return 'Clicked';
}

async function updateCommunication(comm, nextStatus) {
  comm.status = nextStatus;
  comm.statusHistory.push({ status: nextStatus, timestamp: new Date() });
  await comm.save();
}

exports.simulateCampaign = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    const communications = await Communication.find({ campaignId });

    setTimeout(async () => {
      for (const comm of communications) {
        const nextStatus = pickStatus();
        await updateCommunication(comm, nextStatus);
      }

      const stats = communications.reduce(
        (acc, comm) => {
          acc[comm.status] = (acc[comm.status] || 0) + 1;
          return acc;
        },
        { Sent: 0, Delivered: 0, Opened: 0, Clicked: 0, Failed: 0 }
      );

      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'Completed',
        'stats.sent': communications.length,
        'stats.delivered': stats.Delivered + stats.Opened + stats.Clicked,
        'stats.opened': stats.Opened + stats.Clicked,
        'stats.clicked': stats.Clicked,
        'stats.failed': stats.Failed
      });

      console.log(`Email simulation complete for campaign ${campaignId}`);
    }, 3000);
  } catch (err) {
    console.error('Email simulation failed:', err.message);
  }
};
