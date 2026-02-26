
import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

import { User, Role, Skill } from '../users/entities/user.entity';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../users/entities/user-location.entity';
import { Availability } from '../availability/entities/availability.entity';
import { AvailabilityException } from '../availability/entities/availability-exception.entity';
import { Shift, ShiftStatus, RequiredSkill } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { SwapRequest, SwapType, SwapStatus } from '../swaps/entities/swap-request.entity';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) ?? 3306,
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'shiftsync',
  models: [User, Location, UserLocation, Availability, AvailabilityException, Shift, ShiftAssignment, SwapRequest],
  logging: false,
});

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log('Database connected and synced');

  const password = await bcrypt.hash('password123', 10);

  const [nairobiCBD, nairobiWestlands, capeTownVA, capeTownGardens] = await Location.bulkCreate([
    { name: 'Coastal Eats Nairobi CBD', address: 'Kimathi Street, Nairobi CBD, Kenya', timezone: 'Africa/Nairobi' },
    { name: 'Coastal Eats Nairobi Westlands', address: 'Westlands Road, Nairobi, Kenya', timezone: 'Africa/Nairobi' },
    { name: 'Coastal Eats Cape Town V&A', address: 'V&A Waterfront, Cape Town, South Africa', timezone: 'Africa/Johannesburg' },
    { name: 'Coastal Eats Cape Town Gardens', address: 'Gardens Centre, Cape Town, South Africa', timezone: 'Africa/Johannesburg' },
  ]);
  console.log('Locations created');

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@coastaleats.com',
    password,
    role: Role.ADMIN,
    skills: [],
  } as any);

  const managerNairobi = await User.create({
    name: 'Alice Kamau',
    email: 'alice@coastaleats.com',
    password,
    role: Role.MANAGER,
    skills: [],
  } as any);

  const managerCapeTown = await User.create({
    name: 'David Nkosi',
    email: 'david@coastaleats.com',
    password,
    role: Role.MANAGER,
    skills: [],
  } as any);

  const bob = await User.create({
    name: 'Bob Otieno',
    email: 'bob@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.BARTENDER, Skill.SERVER],
  } as any);

  const carol = await User.create({
    name: 'Carol Wanjiku',
    email: 'carol@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.BARTENDER, Skill.HOST],
  } as any);

  const james = await User.create({
    name: 'James Mwangi',
    email: 'james@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.LINE_COOK, Skill.DISHWASHER],
  } as any);

  const sarah = await User.create({
    name: 'Sarah Ndlovu',
    email: 'sarah@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.SERVER, Skill.HOST],
  } as any);

  const mike = await User.create({
    name: 'Mike Sithole',
    email: 'mike@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.BARTENDER],
  } as any);

  const linda = await User.create({
    name: 'Linda Osei',
    email: 'linda@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.LINE_COOK, Skill.SERVER],
  } as any);

  const tom = await User.create({
    name: 'Tom Achola',
    email: 'tom@coastaleats.com',
    password,
    role: Role.STAFF,
    skills: [Skill.DISHWASHER, Skill.BUSSER],
  } as any);

  console.log('Users created');

  await UserLocation.bulkCreate([

    { userId: bob.id, locationId: nairobiCBD.id },
    { userId: bob.id, locationId: nairobiWestlands.id },
    { userId: carol.id, locationId: nairobiCBD.id },
    { userId: carol.id, locationId: nairobiWestlands.id },
    { userId: james.id, locationId: nairobiCBD.id },
    { userId: linda.id, locationId: nairobiWestlands.id },

    { userId: sarah.id, locationId: capeTownVA.id },
    { userId: sarah.id, locationId: capeTownGardens.id },
    { userId: mike.id, locationId: capeTownVA.id },
    { userId: mike.id, locationId: capeTownGardens.id },
    { userId: tom.id, locationId: capeTownVA.id },

    { userId: bob.id, locationId: capeTownVA.id },

    { userId: managerNairobi.id, locationId: nairobiCBD.id },
    { userId: managerNairobi.id, locationId: nairobiWestlands.id },
    { userId: managerCapeTown.id, locationId: capeTownVA.id },
    { userId: managerCapeTown.id, locationId: capeTownGardens.id },
  ] as any);
  console.log('Certifications created');

  const staffUsers = [bob, carol, james, sarah, mike, linda, tom];
  const availabilityRecords: any[] = [];

  for (const staff of staffUsers) {
    for (let day = 1; day <= 6; day++) {
      availabilityRecords.push({
        userId: staff.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '22:00',
        isAvailable: true,
      });
    }
    if (staff.id === bob.id || staff.id === mike.id) {
      availabilityRecords.push({
        userId: staff.id,
        dayOfWeek: 0,
        startTime: '10:00',
        endTime: '20:00',
        isAvailable: true,
      });
    }
  }

  await Availability.bulkCreate(availabilityRecords);
  console.log('Availability created');
  const dates = {
    mon1: '2026-03-02',
    tue1: '2026-03-03',
    wed1: '2026-03-04',
    thu1: '2026-03-05',
    fri1: '2026-03-06',
    sat1: '2026-03-07',

    mon2: '2026-03-09',
    tue2: '2026-03-10',
    wed2: '2026-03-11',
    thu2: '2026-03-12',
    fri2: '2026-03-13',
    sat2: '2026-03-14',
  };

  const shifts = await Shift.bulkCreate([
    { locationId: nairobiCBD.id, date: dates.mon1, startTime: '09:00', endTime: '17:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: nairobiCBD.id, date: dates.tue1, startTime: '09:00', endTime: '17:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: nairobiCBD.id, date: dates.fri1, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: true },
    { locationId: nairobiCBD.id, date: dates.sat1, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.SERVER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: true },
    { locationId: nairobiCBD.id, date: dates.mon1, startTime: '09:00', endTime: '17:00', requiredSkill: RequiredSkill.LINE_COOK, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: false },

    { locationId: nairobiCBD.id, date: dates.mon2, startTime: '09:00', endTime: '17:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: nairobiCBD.id, date: dates.fri2, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: true },
    { locationId: nairobiCBD.id, date: dates.sat2, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.SERVER, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: true },

    { locationId: nairobiWestlands.id, date: dates.wed1, startTime: '10:00', endTime: '18:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: nairobiWestlands.id, date: dates.thu1, startTime: '10:00', endTime: '18:00', requiredSkill: RequiredSkill.LINE_COOK, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: nairobiWestlands.id, date: dates.sat1, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: true },

    { locationId: capeTownVA.id, date: dates.mon1, startTime: '09:00', endTime: '17:00', requiredSkill: RequiredSkill.SERVER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: capeTownVA.id, date: dates.fri1, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: true },
    { locationId: capeTownVA.id, date: dates.sat1, startTime: '17:00', endTime: '23:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.PUBLISHED, isPremium: true },
    { locationId: capeTownVA.id, date: dates.mon2, startTime: '09:00', endTime: '17:00', requiredSkill: RequiredSkill.SERVER, headcount: 1, status: ShiftStatus.PUBLISHED, isPremium: false },
    { locationId: nairobiCBD.id, date: dates.sat2, startTime: '09:00', endTime: '15:00', requiredSkill: RequiredSkill.BARTENDER, headcount: 2, status: ShiftStatus.DRAFT, isPremium: false },
  ] as any);

  console.log('Shifts created');


  await ShiftAssignment.bulkCreate([

    { shiftId: shifts[0].id, userId: bob.id },
    { shiftId: shifts[0].id, userId: carol.id },
    { shiftId: shifts[1].id, userId: bob.id },
    { shiftId: shifts[2].id, userId: bob.id },
    { shiftId: shifts[2].id, userId: carol.id },
    { shiftId: shifts[3].id, userId: carol.id },
    { shiftId: shifts[4].id, userId: james.id },
    { shiftId: shifts[5].id, userId: bob.id },
    { shiftId: shifts[5].id, userId: carol.id },
    { shiftId: shifts[6].id, userId: bob.id },
    { shiftId: shifts[8].id, userId: carol.id },
    { shiftId: shifts[9].id, userId: linda.id },
    { shiftId: shifts[10].id, userId: carol.id },
    { shiftId: shifts[11].id, userId: sarah.id },
    { shiftId: shifts[11].id, userId: mike.id },
    { shiftId: shifts[12].id, userId: mike.id },
    { shiftId: shifts[12].id, userId: bob.id },
    { shiftId: shifts[13].id, userId: mike.id },
    { shiftId: shifts[14].id, userId: sarah.id },
  ] as any);
  console.log('Assignments created');

  await SwapRequest.bulkCreate([
    {
      type: SwapType.SWAP,
      status: SwapStatus.PENDING_ACCEPTANCE,
      requesterId: bob.id,
      requesteeId: carol.id,
      requesterShiftId: shifts[1].id,
      requesteeShiftId: shifts[8].id,
      reason: 'Family commitment on Tuesday',
    },

    {
      type: SwapType.DROP,
      status: SwapStatus.OPEN,
      requesterId: carol.id,
      requesterShiftId: shifts[7].id,
      reason: 'Going out of town',
      expiresAt: new Date('2026-03-13T17:00:00'),
    },
  ] as any);
  console.log('Swap requests created');

  console.log('\n🎉 Seed complete! Login credentials:\n');
  console.log('Admin:           admin@coastaleats.com   / password123');
  console.log('Manager Nairobi: alice@coastaleats.com   / password123');
  console.log('Manager CT:      david@coastaleats.com   / password123');
  console.log('Staff (Bob):     bob@coastaleats.com     / password123');
  console.log('Staff (Carol):   carol@coastaleats.com   / password123');
  console.log('Staff (James):   james@coastaleats.com   / password123');
  console.log('Staff (Sarah):   sarah@coastaleats.com   / password123');
  console.log('Staff (Mike):    mike@coastaleats.com    / password123');
  console.log('Staff (Linda):   linda@coastaleats.com   / password123');
  console.log('Staff (Tom):     tom@coastaleats.com     / password123');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});