const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/copilotController');

router.post('/preview', ctrl.previewCampaign);
router.post('/launch', ctrl.launchCampaign);

module.exports = router;
