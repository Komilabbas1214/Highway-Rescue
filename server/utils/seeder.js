const mongoose = require('mongoose');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Service = require('../models/Service');
const PetrolPump = require('../models/PetrolPump');
const Booking = require('../models/Booking');
const { servicesData, petrolPumpsData, sampleMechanicsData } = require('./seedData');

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking database initial seed state...');

    // 1. Seed Admin User
    const adminEmail = 'admin@highwayrescue.in';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Highway Rescue Admin',
        email: adminEmail,
        phone: '+91 99999 00112',
        password: 'Admin@123',
        role: 'admin',
        vehicleType: 'Car',
      });
      console.log('[Seeder] Created default Admin: admin@highwayrescue.in / Admin@123');
    }

    // 2. Seed Default Demo Customer
    const customerEmail = 'rahul.sharma@example.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: 'Rahul Sharma',
        email: customerEmail,
        phone: '+91 98980 12345',
        password: 'Customer@123',
        role: 'customer',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
      });
      console.log('[Seeder] Created demo Customer: rahul.sharma@example.com / Customer@123');
    }

    // 3. Seed Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(servicesData);
      console.log(`[Seeder] Seeded ${servicesData.length} core highway vehicle services.`);
    }

    // 4. Seed Petrol Pumps
    const pumpCount = await PetrolPump.countDocuments();
    if (pumpCount === 0) {
      await PetrolPump.insertMany(petrolPumpsData);
      console.log(`[Seeder] Seeded ${petrolPumpsData.length} verified highway petrol pumps in Ahmedabad.`);
    }

    // 5. Seed Mechanics
    for (const item of sampleMechanicsData) {
      let mechUser = await User.findOne({ email: item.user.email });
      if (!mechUser) {
        mechUser = await User.create({
          name: item.user.name,
          email: item.user.email,
          phone: item.user.phone,
          password: item.user.password,
          role: 'mechanic',
        });
      }

      let existingMech = await Mechanic.findOne({ email: item.mechanic.email });
      if (!existingMech) {
        await Mechanic.create({
          ...item.mechanic,
          user: mechUser._id,
        });
      }
    }
    console.log(`[Seeder] Seeded ${sampleMechanicsData.length} verified & applicant mechanics across Ahmedabad.`);

    // 6. Seed Sample Initial Bookings for Demo
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      const firstMechanic = await Mechanic.findOne({ isVerified: true });
      if (firstMechanic && customer) {
        await Booking.create({
          bookingId: 'HR-108245',
          customer: customer._id,
          mechanic: firstMechanic._id,
          serviceType: 'Puncture Repair',
          vehicleType: 'Car',
          vehicleNumber: 'GJ-01-AB-1234',
          problemDescription: 'Right front tyre punctured near ISCON flyover on SG highway. Need urgent repair.',
          customerLocation: {
            type: 'Point',
            coordinates: [72.5075, 23.0315],
            address: 'Near ISCON Flyover, SG Highway, Ahmedabad',
          },
          status: 'Completed',
          isEmergency: false,
          estimatedCost: 250,
          finalCost: 250,
          paymentMethod: 'Online',
          paymentStatus: 'Paid',
          statusTimeline: [
            { status: 'Pending', timestamp: new Date(Date.now() - 3600000 * 2), note: 'Booking requested' },
            { status: 'Accepted', timestamp: new Date(Date.now() - 3600000 * 1.8), note: 'Mechanic accepted request' },
            { status: 'Arrived', timestamp: new Date(Date.now() - 3600000 * 1.4), note: 'Mechanic arrived at location' },
            { status: 'Completed', timestamp: new Date(Date.now() - 3600000 * 1), note: 'Service completed successfully' },
          ],
        });
        console.log('[Seeder] Seeded demo completed booking HR-108245.');
      }
    }

    console.log('[Seeder] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seeder] Error during database seeding:', error);
  }
};

module.exports = seedDatabase;
