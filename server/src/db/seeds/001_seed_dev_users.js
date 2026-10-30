const { hashPassword, ROLES, BUREAUS } = require('../../utils/security');
const userRepository = require('../repositories/userRepository');
const config = require('../../config/env');

const DEV_SEED_USERS = [
  {
    id: 'usr-admin-01',
    username: 'admin_sys',
    email: 'admin.sys@samadhanX.aicte.gov.in',
    password: 'Password@123',
    full_name: 'Dr. Amitabh Verma',
    role: ROLES.ADMIN,
    primary_bureau: null,
    region: 'ALL',
    is_active: true
  },
  {
    id: 'usr-rb-01',
    username: 'officer_rb',
    email: 'rajesh.rb@samadhanX.aicte.gov.in',
    password: 'Password@123',
    full_name: 'Rajesh Kumar (RB Officer)',
    role: ROLES.BUREAU_OFFICER,
    primary_bureau: BUREAUS.REGULATION_BUREAU,
    region: 'ALL',
    is_active: true
  },
  {
    id: 'usr-pgrc-01',
    username: 'officer_pgrc',
    email: 'sunita.pgrc@samadhanX.aicte.gov.in',
    password: 'Password@123',
    full_name: 'Sunita Sharma (PGRC Officer)',
    role: ROLES.BUREAU_OFFICER,
    primary_bureau: BUREAUS.PGRC,
    region: 'ALL',
    is_active: true
  },
  {
    id: 'usr-reg-01',
    username: 'officer_regional',
    email: 'vikram.north@samadhanX.aicte.gov.in',
    password: 'Password@123',
    full_name: 'Vikram Joshi (Regional Officer)',
    role: ROLES.REGIONAL_OFFICER,
    primary_bureau: BUREAUS.REGIONAL_OFFICE,
    region: 'NORTHERN',
    is_active: true
  },
  {
    id: 'usr-senior-01',
    username: 'official_senior',
    email: 'director.general@samadhanX.aicte.gov.in',
    password: 'Password@123',
    full_name: 'Prof. Ramesh Chandra (Senior Official)',
    role: ROLES.SENIOR_OFFICIAL,
    primary_bureau: null,
    region: 'ALL',
    is_active: true
  },
  {
    id: 'usr-disabled-01',
    username: 'officer_disabled',
    email: 'inactive.user@samadhanX.aicte.gov.in',
    password: 'Password@123',
    full_name: 'Inactive Former Officer',
    role: ROLES.BUREAU_OFFICER,
    primary_bureau: BUREAUS.PGRC,
    region: 'WESTERN',
    is_active: false
  }
];

async function seedDevelopmentUsers() {
  // CRITICAL SECURITY SAFEGUARD: Never run dev seed in production
  if (config.env === 'production') {
    console.warn('[Security Warning] Seed script bypassed: Never execute dev seeds in production!');
    return false;
  }

  for (const seed of DEV_SEED_USERS) {
    const existing = await userRepository.findByUsername(seed.username);
    if (!existing) {
      const password_hash = await hashPassword(seed.password);
      await userRepository.create({
        id: seed.id,
        username: seed.username,
        email: seed.email,
        password_hash,
        full_name: seed.full_name,
        role: seed.role,
        primary_bureau: seed.primary_bureau,
        region: seed.region,
        is_active: seed.is_active
      });
    }
  }

  return true;
}

module.exports = {
  DEV_SEED_USERS,
  seedDevelopmentUsers
};
