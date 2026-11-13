const crypto = require('crypto');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const PayoutRequest = require('../models/PayoutRequest');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Helper to generate unique transaction ID e.g. WTX-2026-10492
const generateTransactionId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `WTX-${year}-${rand}`;
};

// Helper to generate unique payout ID e.g. PAY-2026-10492
const generatePayoutId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PAY-${year}-${rand}`;
};

const FIXED_REFERRAL_REWARD = 100;
const MIN_WITHDRAWAL_AMOUNT = 500;

// Internal Service: Award fixed ₹100 single-level referral reward (starts as PENDING until verified)
const processReferralReward = async (buyerId, orderId, orderAmount) => {
  try {
    if (!orderAmount || Number(orderAmount) <= 0) return null;

    const buyer = await User.findById(buyerId);
    if (!buyer || !buyer.referredBy) return null;

    // Strict Rule: Single-level direct referral only. Prevent self-referral.
    if (buyer.referredBy.toString() === buyer._id.toString()) return null;

    // Check if referrer already received a reward for this buyer (reward only on first paid course enrollment)
    const existingReward = await WalletTransaction.findOne({
      referredUserId: buyer._id,
      source: 'REFERRAL_REWARD',
      status: { $in: ['PENDING', 'COMPLETED'] },
    });
    if (existingReward) return null;

    const referrer = await User.findById(buyer.referredBy);
    if (!referrer || !referrer.isActive) return null;

    // Fixed ₹100 reward (no percentage commission), held in PENDING until enrollment/refund verification
    const rewardAmount = FIXED_REFERRAL_REWARD;

    const transaction = await WalletTransaction.create({
      transactionId: generateTransactionId(),
      userId: referrer._id,
      type: 'CREDIT',
      source: 'REFERRAL_REWARD',
      amount: rewardAmount,
      balanceAfter: referrer.walletBalance || 0,
      orderId,
      referredUserId: buyer._id,
      description: `Pending referral reward (₹${rewardAmount}) for ${buyer.name}'s paid enrollment (awaiting verification)`,
      status: 'PENDING',
    });

    await Notification.create({
      recipientId: referrer._id,
      title: `🕒 Pending Referral Reward: ₹${rewardAmount}`,
      message: `Your invited friend ${buyer.name} completed a paid enrollment! ₹${rewardAmount} is in Pending Rewards and will move to Available Balance once verification & refund checks complete.`,
      type: 'PAYMENT',
      link: '/student/wallet',
    });

    return transaction;
  } catch (error) {
    console.error('Error processing referral reward:', error);
    return null;
  }
};

// Internal Service: Reverse referral reward if the referred enrollment is refunded or cancelled
const reverseReferralReward = async (orderId, buyerId, reason = 'Enrollment refunded or cancelled') => {
  try {
    const queryConditions = [];
    if (orderId) queryConditions.push({ orderId });
    if (buyerId) queryConditions.push({ referredUserId: buyerId });
    if (queryConditions.length === 0) return null;

    const rewardTxn = await WalletTransaction.findOne({
      source: 'REFERRAL_REWARD',
      status: { $in: ['PENDING', 'COMPLETED'] },
      $or: queryConditions,
    });
    if (!rewardTxn) return null;

    const wasCompleted = rewardTxn.status === 'COMPLETED';
    rewardTxn.status = 'REVERSED';
    rewardTxn.description = `${rewardTxn.description} [REVERSED: ${reason}]`;
    await rewardTxn.save();

    const referrer = await User.findById(rewardTxn.userId);
    if (referrer && wasCompleted) {
      referrer.walletBalance = Math.max(0, (referrer.walletBalance || 0) - rewardTxn.amount);
      await referrer.save();

      await WalletTransaction.create({
        transactionId: generateTransactionId(),
        userId: referrer._id,
        type: 'DEBIT',
        source: 'REFERRAL_REVERSAL',
        amount: rewardTxn.amount,
        balanceAfter: referrer.walletBalance,
        orderId: rewardTxn.orderId,
        referredUserId: rewardTxn.referredUserId,
        description: `Referral reward reversed (${rewardTxn.transactionId}): ${reason}`,
        status: 'COMPLETED',
      });
    }

    if (referrer) {
      await Notification.create({
        recipientId: referrer._id,
        title: `⚠️ Referral Reward Reversed: ₹${rewardTxn.amount}`,
        message: `Your referral reward (${rewardTxn.transactionId}) of ₹${rewardTxn.amount} was reversed due to: ${reason}.`,
        type: 'PAYMENT',
        link: '/student/wallet',
      });
    }

    return rewardTxn;
  } catch (error) {
    console.error('Error reversing referral reward:', error);
    return null;
  }
};

// Student: Get my wallet balance, ledger, payout history, & referral stats
const getMyWallet = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('name email phone referralCode walletBalance payoutDetails studentId');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Ensure user has a referral code
    if (!user.referralCode) {
      user.referralCode = 'RV' + crypto.randomBytes(3).toString('hex').toUpperCase();
      await user.save();
    }

    const [transactions, payoutRequests, referredCount, totalEarnedResult, pendingRewardsResult, totalWithdrawnResult] = await Promise.all([
      WalletTransaction.find({ userId })
        .populate('referredUserId', 'name studentId')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      PayoutRequest.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      User.countDocuments({ referredBy: userId }),
      WalletTransaction.aggregate([
        { $match: { userId, type: 'CREDIT', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { userId, source: 'REFERRAL_REWARD', status: 'PENDING' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { userId, source: 'PAYOUT_WITHDRAWAL', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalEarned = totalEarnedResult.length > 0 ? totalEarnedResult[0].total : 0;
    const pendingRewards = pendingRewardsResult.length > 0 ? pendingRewardsResult[0].total : 0;
    const totalWithdrawn = totalWithdrawnResult.length > 0 ? totalWithdrawnResult[0].total : 0;

    return sendSuccess(res, 'Wallet details retrieved', {
      walletBalance: user.walletBalance || 0,
      referralCode: user.referralCode,
      payoutDetails: user.payoutDetails || {},
      fixedRewardAmount: FIXED_REFERRAL_REWARD,
      minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
      stats: {
        totalEarned,
        pendingRewards,
        totalWithdrawn,
        referredCount,
        pendingPayoutsCount: payoutRequests.filter((p) => p.status === 'PENDING').length,
      },
      transactions,
      payoutRequests,
    });
  } catch (error) {
    next(error);
  }
};

// Student: Request a payout withdrawal
const requestPayout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { amount, payoutMethod, paymentDetails } = req.body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      return sendError(res, `Minimum payout withdrawal threshold is ₹${MIN_WITHDRAWAL_AMOUNT}`, 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if ((user.walletBalance || 0) < withdrawAmount) {
      return sendError(res, `Insufficient wallet balance. You have ₹${user.walletBalance || 0} available.`, 400);
    }

    // Check if user already has an active pending payout request
    const pendingRequest = await PayoutRequest.findOne({ userId, status: 'PENDING' });
    if (pendingRequest) {
      return sendError(res, 'You already have a pending payout request under review.', 400);
    }

    // Validate payout details
    const method = payoutMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'UPI';
    const finalDetails = {
      upiId: paymentDetails?.upiId || user.payoutDetails?.upiId || '',
      bankAccountNumber: paymentDetails?.bankAccountNumber || user.payoutDetails?.bankAccountNumber || '',
      ifscCode: (paymentDetails?.ifscCode || user.payoutDetails?.ifscCode || '').toUpperCase(),
      accountHolderName: paymentDetails?.accountHolderName || user.payoutDetails?.accountHolderName || user.name,
      bankName: paymentDetails?.bankName || user.payoutDetails?.bankName || '',
    };

    if (method === 'UPI' && (!finalDetails.upiId || !finalDetails.upiId.includes('@'))) {
      return sendError(res, 'Please provide a valid UPI ID (e.g. name@okhdfcbank)', 400);
    }

    if (method === 'BANK_TRANSFER' && (!finalDetails.bankAccountNumber || !finalDetails.ifscCode)) {
      return sendError(res, 'Please provide your Bank Account Number and 11-character IFSC code', 400);
    }

    // Save payout details on user profile for convenience
    user.payoutDetails = finalDetails;

    // Atomically debit wallet balance
    const newBalance = user.walletBalance - withdrawAmount;
    user.walletBalance = newBalance;
    await user.save();

    const payoutId = generatePayoutId();
    const payout = await PayoutRequest.create({
      payoutId,
      userId,
      amount: withdrawAmount,
      payoutMethod: method,
      paymentDetails: finalDetails,
      status: 'PENDING',
    });

    // Create ledger entry
    await WalletTransaction.create({
      transactionId: generateTransactionId(),
      userId,
      type: 'DEBIT',
      source: 'PAYOUT_WITHDRAWAL',
      amount: withdrawAmount,
      balanceAfter: newBalance,
      description: `Payout withdrawal request ${payoutId} via ${method}`,
      status: 'PENDING',
    });

    return sendSuccess(res, 'Payout request submitted successfully. Eligible requests are processed within 7 working days after verification.', payout, 201);
  } catch (error) {
    next(error);
  }
};

// Admin: Get all student payout requests with filtering & pagination
const getAdminPayouts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await PayoutRequest.countDocuments(query);
    const payouts = await PayoutRequest.find(query)
      .populate('userId', 'name email phone studentId referralCode')
      .populate('processedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return sendSuccess(res, 'Payout requests retrieved', {
      payouts,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Process or update payout request (APPROVE, PROCESSED, REJECTED)
const processAdminPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote, referenceNumber } = req.body;

    const payout = await PayoutRequest.findById(id);
    if (!payout) {
      return sendError(res, 'Payout request not found', 404);
    }

    if (payout.status === 'PROCESSED') {
      return sendError(res, 'This payout request has already been disbursed and completed', 400);
    }

    if (status === 'PROCESSED') {
      if (req.user.role === 'FINANCE_STAFF' && payout.status === 'PENDING') {
        return sendError(
          res,
          'Referral payouts require Admin / Super Admin approval (APPROVED status) before Finance Staff can disburse funds.',
          403
        );
      }
      if (!referenceNumber || !referenceNumber.trim()) {
        return sendError(res, 'Bank transaction UTR or reference number is required to mark as processed', 400);
      }
      payout.status = 'PROCESSED';
      payout.referenceNumber = referenceNumber.trim();
      payout.adminNote = adminNote || 'Disbursed via online transfer';
      payout.processedAt = new Date();
      payout.processedBy = req.user._id;

      // Update matching ledger transaction
      await WalletTransaction.findOneAndUpdate(
        { userId: payout.userId, source: 'PAYOUT_WITHDRAWAL', status: 'PENDING' },
        { status: 'COMPLETED' }
      );

      // Notify student
      await Notification.create({
        recipientId: payout.userId,
        title: `✅ Payout Disbursed: ₹${payout.amount}`,
        message: `Your payout request ${payout.payoutId} for ₹${payout.amount} has been processed. Bank Ref / UTR: ${payout.referenceNumber}.`,
        type: 'PAYMENT',
        link: '/student/wallet',
      });
    } else if (status === 'REJECTED') {
      payout.status = 'REJECTED';
      payout.adminNote = adminNote || 'Rejected by finance administrator';
      payout.processedAt = new Date();
      payout.processedBy = req.user._id;

      // Refund debited funds back to student wallet
      const student = await User.findById(payout.userId);
      if (student) {
        student.walletBalance = (student.walletBalance || 0) + payout.amount;
        await student.save();

        await WalletTransaction.create({
          transactionId: generateTransactionId(),
          userId: student._id,
          type: 'CREDIT',
          source: 'ADMIN_ADJUSTMENT',
          amount: payout.amount,
          balanceAfter: student.walletBalance,
          description: `Refund for rejected payout ${payout.payoutId}: ${payout.adminNote}`,
          status: 'COMPLETED',
        });
      }

      await Notification.create({
        recipientId: payout.userId,
        title: `⚠️ Payout Request Rejected`,
        message: `Your payout request ${payout.payoutId} was rejected (${payout.adminNote}). ₹${payout.amount} has been refunded to your wallet.`,
        type: 'PAYMENT',
        link: '/student/wallet',
      });
    } else if (status === 'APPROVED') {
      payout.status = 'APPROVED';
      payout.adminNote = adminNote || 'Approved for payment queue';
    }

    await payout.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'PAYOUT_STATUS_UPDATE',
      resource: 'PayoutRequest',
      resourceId: payout._id.toString(),
      category: 'FINANCIAL',
      isImmutable: true,
      details: { payoutId: payout.payoutId, status: payout.status, amount: payout.amount },
    });

    return sendSuccess(res, `Payout request updated to ${payout.status}`, payout);
  } catch (error) {
    next(error);
  }
};

// Admin / Finance: List referral rewards (PENDING / COMPLETED / REVERSED) for verification
const getAdminReferralRewards = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { source: 'REFERRAL_REWARD' };
    if (status && status !== 'ALL') query.status = status;

    const rewards = await WalletTransaction.find(query)
      .populate('userId', 'name email studentId')
      .populate('referredUserId', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return sendSuccess(res, 'Referral rewards retrieved', { rewards });
  } catch (error) {
    next(error);
  }
};

// Admin / Finance: Verify & release a PENDING referral reward into Available Balance
const releaseReferralReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const txn = await WalletTransaction.findById(id);
    if (!txn || txn.source !== 'REFERRAL_REWARD') {
      return sendError(res, 'Referral reward transaction not found', 404);
    }
    if (txn.status !== 'PENDING') {
      return sendError(res, `Reward is already ${txn.status}`, 409);
    }

    const referrer = await User.findById(txn.userId);
    if (!referrer) {
      return sendError(res, 'Referrer account not found', 404);
    }

    referrer.walletBalance = (referrer.walletBalance || 0) + txn.amount;
    await referrer.save();

    txn.status = 'COMPLETED';
    txn.balanceAfter = referrer.walletBalance;
    txn.description = txn.description.replace('(awaiting verification)', '(verified & released)');
    await txn.save();

    await Notification.create({
      recipientId: referrer._id,
      title: `🎉 Referral Reward Released: ₹${txn.amount}`,
      message: `Your ₹${txn.amount} referral reward (${txn.transactionId}) has been verified and moved to your Available Wallet Balance.`,
      type: 'PAYMENT',
      link: '/student/wallet',
    });

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'REFERRAL_REWARD_RELEASED',
      resource: 'WalletTransaction',
      resourceId: txn._id.toString(),
      category: 'FINANCIAL',
      isImmutable: true,
      details: { transactionId: txn.transactionId, amount: txn.amount, referrerId: referrer._id },
    });

    return sendSuccess(res, `₹${txn.amount} referral reward verified and released to student wallet`, txn);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processReferralReward,
  reverseReferralReward,
  getMyWallet,
  requestPayout,
  getAdminPayouts,
  processAdminPayout,
  getAdminReferralRewards,
  releaseReferralReward,
};
