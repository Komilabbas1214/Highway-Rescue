const mongoose = require('mongoose');

const commissionSettlementSchema = new mongoose.Schema(
  {
    settlementId: {
      type: String,
      unique: true,
      required: true,
    },
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mechanic',
      required: true,
    },
    settlementType: {
      type: String,
      enum: ['Mechanic_Payout', 'Cash_Commission_Reconciliation', 'Adjustment'],
      required: true,
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
    ],
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank_Transfer', 'UPI', 'Cash_Reconciled', 'Direct_Offset', 'Other'],
      default: 'Bank_Transfer',
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Failed'],
      default: 'Completed',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CommissionSettlement', commissionSettlementSchema);
