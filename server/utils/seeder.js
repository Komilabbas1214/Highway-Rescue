const User = require('../models/User');
const Service = require('../models/Service');
const PetrolPump = require('../models/PetrolPump');
const { servicesData, petrolPumpsData } = require('./seedData');

/**
 * Seeds ONLY essential master catalog data (Services, Petrol Pumps, default Admin).
 * Automatic demo mechanic creation is completely disabled so only genuinely registered,
 * admin-approved mechanics can exist in the production system.
 */
const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking database essential master records...');

    // 1. Seed Admin User if no admin exists
    const adminEmail = 'admin@highwayrescue.in';
    let admin = await User.findOne({ role: 'admin' });
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

    // 2. Seed Services Catalog if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(servicesData);
      console.log(`[Seeder] Seeded ${servicesData.length} core highway vehicle services.`);
    }

    // 3. Seed Verified Petrol Pumps in Ahmedabad if empty
    const pumpCount = await PetrolPump.countDocuments();
    if (pumpCount === 0) {
      await PetrolPump.insertMany(petrolPumpsData);
      console.log(`[Seeder] Seeded ${petrolPumpsData.length} highway petrol pumps in Ahmedabad.`);
    }

    console.log('[Seeder] Master data verification complete. Demo mechanic seeding is permanently DISABLED.');
  } catch (error) {
    console.error('[Seeder] Error during database seeding:', error.message);
  }
};

module.exports = seedDatabase;
