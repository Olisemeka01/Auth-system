import { Logger } from '@nestjs/common';
import dataSource from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

const logger = new Logger('DatabaseSeed');

async function runSeed() {
  await dataSource.initialize();
  logger.log('Database connection established');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create roles
    const roles = [
      {
        name: 'Super Admin',
        description: 'Full system access',
        is_default: false,
      },
      {
        name: 'Admin',
        description: 'Administrative access',
        is_default: false,
      },
      {
        name: 'Manager',
        description: 'Manager access',
        is_default: false,
      },
      {
        name: 'Employee',
        description: 'Employee access',
        is_default: true,
      },
      {
        name: 'Client',
        description: 'Client access',
        is_default: false,
      },
    ];

    const createdRoles: Role[] = [];
    for (const roleData of roles) {
      const role = queryRunner.manager.create(Role, roleData);
      const savedRole = await queryRunner.manager.save(role);
      createdRoles.push(savedRole);
    }
    logger.log(`Created ${createdRoles.length} roles`);

    // Create admin user with Super Admin role
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminUser = queryRunner.manager.create(User, {
      email: 'admin@auth.com',
      password_hash: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      phone: '+1234567890',
      is_active: true,
      is_verified: true,
    });
    adminUser.roles = [createdRoles[0]]; // Super Admin role
    await queryRunner.manager.save(adminUser);
    logger.log('Created admin user (admin@auth.com / 123456)');

    // Create test users for each role
    const testUsers = [
      {
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1234567891',
        roleIndex: 1, // Admin
      },
      {
        email: 'manager@test.com',
        first_name: 'Manager',
        last_name: 'User',
        phone: '+1234567892',
        roleIndex: 2, // Manager
      },
      {
        email: 'employee@test.com',
        first_name: 'Employee',
        last_name: 'User',
        phone: '+1234567893',
        roleIndex: 3, // Employee
      },
    ];

    for (const testData of testUsers) {
      const user = queryRunner.manager.create(User, {
        email: testData.email,
        password_hash: hashedPassword,
        first_name: testData.first_name,
        last_name: testData.last_name,
        phone: testData.phone,
        is_active: true,
        is_verified: true,
      });
      user.roles = [createdRoles[testData.roleIndex]];
      await queryRunner.manager.save(user);
    }
    logger.log('Created test users');

    // Commit transaction
    await queryRunner.commitTransaction();
    logger.log('Seed completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    logger.error(
      'Error during seed',
      error instanceof Error ? error.stack : String(error),
    );
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runSeed()
  .then(() => {
    logger.log('Seed process finished');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      'Seed process failed',
      error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
  });
