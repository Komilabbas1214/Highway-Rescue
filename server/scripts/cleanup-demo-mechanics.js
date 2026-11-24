/**
 * Highway Rescue — Safe Demo Mechanics Cleanup Script
 *
 * SAFETY INSTRUCTIONS:
 * 1. By default, this script runs in DRY-RUN mode and performs ZERO destructive actions.
 * 2. Positively identifies only known seed demo mechanics.
 * 3. Preserves all customers, admins, real mechanics, bookings, payments, and commission records.
 * 4. To execute changes, you must pass: --execute --confirm
 *
 * Usage:
 *   Dry Run:   node server/scripts/cleanup-demo-mechanics.js
 *   Execution: node server/scripts/cleanup-demo-mechanics.js --execute --confirm
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// Known demo mechanic emails positively identified from seeder
const KNOWN_DEMO_EMAILS = [
  'patel.auto@example.com',
  'gujarat.towing@example.com',
  'chamunda.battery@example.com',
  'highway.puncture@example.com',
  'apex.engine@example.com',
];

async function runCleanup() {
  console.log('================================================================');
  console.log('       HIGHWAY RESCUE — DEMO MECHANICS AUDIT & CLEANUP         ');
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute') || !args.includes('--confirm');

  if (isDryRun) {
    console.log('🔍 RUNNING IN DRY-RUN MODE (Zero changes will be written to MongoDB).\n');
  } else {
    console.log('⚠️  EXECUTE MODE DETECTED: Confirmed for database update.\n');
  }

  await connectDB();

  try {
    // 1. Identify demo mechanics
    const demoMechanics = await Mechanic.find({
      $or: [
        { email: { $in: KNOWN_DEMO_EMAILS } },
        { isDemo: true },
      ],
    }).populate('user', 'name email phone');

    console.log(`[Audit] Found ${demoMechanics.length} demo mechanic records:\n`);

    if (demoMechanics.length === 0) {
      console.log('✔ No demo mechanics found in the database. The system is clean!');
      process.exit(0);
    }

    const demoMechanicIds = demoMechanics.map((m) => m._id);
    const demoUserIds = demoMechanics.map((m) => m.user?._id).filter(Boolean);

    // 2. Check references to preserve booking & payment integrity
    for (const mech of demoMechanics) {
      const bookingCount = await Booking.countDocuments({ mechanic: mech._id });
      const paymentCount = await Payment.countDocuments({ mechanic: mech._id });
      const reviewCount = await Review.countDocuments({ mechanic: mech._id });

      console.log(` • ID: ${mech._id}`);
      console.log(`   Name: ${mech.name} (${mech.shopName})`);
      console.log(`   Email: ${mech.email}`);
      console.log(`   Associated Records: ${bookingCount} bookings, ${paymentCount} payments, ${reviewCount} reviews`);
      console.log(`   Action: ${bookingCount > 0 ? 'Archive & Deactivate (Preserves historical bookings)' : 'Complete Removal'}\n`);
    }

    // Identify genuine mechanics to confirm they are untouched
    const genuineMechanics = await Mechanic.find({
      _id: { $nin: demoMechanicIds },
      email: { $nin: KNOWN_DEMO_EMAILS },
    });

    console.log(`[Safety Check] ${genuineMechanics.length} legitimate registered mechanics identified (Will NOT be modified).\n`);

    if (isDryRun) {
      console.log('----------------------------------------------------------------');
      console.log('DRY RUN SUMMARY:');
      console.log(` - Demo mechanics to deactivate/remove: ${demoMechanics.length}`);
      console.log(` - Legitimate registered mechanics preserved: ${genuineMechanics.length}`);
      console.log(' - Customer accounts preserved: 100%');
      console.log(' - Admin accounts preserved: 100%');
      console.log(' - Booking history preserved: 100%');
      console.log('\nTo execute this cleanup on MongoDB Atlas, create a mongodump backup and run:');
      console.log('  node server/scripts/cleanup-demo-mechanics.js --execute --confirm');
      console.log('----------------------------------------------------------------');
      process.exit(0);
    }

    // 3. Execution Phase (only runs with --execute --confirm)
    console.log('[Execution] Starting safe cleanup...');

    let removedCount = 0;
    let archivedCount = 0;

    for (const mech of demoMechanics) {
      const associatedBookings = await Booking.countDocuments({ mechanic: mech._id });

      if (associatedBookings > 0) {
        // If demo mechanic has historical bookings, archive without breaking booking references
        mech.approvalStatus = 'Suspended';
        mech.isActive = false;
        mech.isOnline = false;
        mech.isVerified = false;
        mech.isDemo = true;
        mech.shopName = `[ARCHIVED DEMO] ${mech.shopName}`;
        await mech.save();

        if (mech.user) {
          await User.findByIdAndUpdate(mech.user._id, {
            $set: { isBlocked: true },
          });
        }
        archivedCount++;
      } else {
        // Safe to completely delete if no associated bookings
        if (mech.user) {
          await User.findByIdAndDelete(mech.user._id);
        }
        await Mechanic.findByIdAndDelete(mech._id);
        removedCount++;
      }
    }

    console.log(`\n✔ Cleanup Complete: ${removedCount} demo records deleted, ${archivedCount} demo records archived (historical bookings preserved).`);
    console.log('✔ All customer accounts, admin accounts, and legitimate mechanics remain intact.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

runCleanup();
