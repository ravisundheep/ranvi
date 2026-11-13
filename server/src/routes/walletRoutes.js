const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.get('/my-wallet', authenticate, walletController.getMyWallet);
router.post('/payout-request', authenticate, walletController.requestPayout);
router.get('/admin/payouts', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), walletController.getAdminPayouts);
router.put('/admin/payouts/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), walletController.processAdminPayout);
router.get('/admin/referral-rewards', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), walletController.getAdminReferralRewards);
router.put('/admin/referral-rewards/:id/release', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_STAFF'), walletController.releaseReferralReward);

module.exports = router;
