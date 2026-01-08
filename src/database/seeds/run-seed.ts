import dataSource from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  await dataSource.initialize();
  console.log('Database connection established');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create permissions
    const permissions = [
      {
        name: 'users.create',
        description: 'Create users',
        resource: 'users',
        action: 'create',
      },
      {
        name: 'users.read',
        description: 'Read users',
        resource: 'users',
        action: 'read',
      },
      {
        name: 'users.update',
        description: 'Update users',
        resource: 'users',
        action: 'update',
      },
      {
        name: 'users.delete',
        description: 'Delete users',
        resource: 'users',
        action: 'delete',
      },
      {
        name: 'clients.create',
        description: 'Create clients',
        resource: 'clients',
        action: 'create',
      },
      {
        name: 'clients.read',
        description: 'Read clients',
        resource: 'clients',
        action: 'read',
      },
      {
        name: 'clients.update',
        description: 'Update clients',
        resource: 'clients',
        action: 'update',
      },
      {
        name: 'clients.delete',
        description: 'Delete clients',
        resource: 'clients',
        action: 'delete',
      },
      {
        name: 'roles.create',
        description: 'Create roles',
        resource: 'roles',
        action: 'create',
      },
      {
        name: 'roles.read',
        description: 'Read roles',
        resource: 'roles',
        action: 'read',
      },
      {
        name: 'roles.update',
        description: 'Update roles',
        resource: 'roles',
        action: 'update',
      },
      {
        name: 'roles.delete',
        description: 'Delete roles',
        resource: 'roles',
        action: 'delete',
      },
      {
        name: 'permissions.create',
        description: 'Create permissions',
        resource: 'permissions',
        action: 'create',
      },
      {
        name: 'permissions.read',
        description: 'Read permissions',
        resource: 'permissions',
        action: 'read',
      },
      {
        name: 'permissions.update',
        description: 'Update permissions',
        resource: 'permissions',
        action: 'update',
      },
      {
        name: 'permissions.delete',
        description: 'Delete permissions',
        resource: 'permissions',
        action: 'delete',
      },
      {
        name: 'api_keys.create',
        description: 'Create API keys',
        resource: 'api_keys',
        action: 'create',
      },
      {
        name: 'api_keys.read',
        description: 'Read API keys',
        resource: 'api_keys',
        action: 'read',
      },
      {
        name: 'api_keys.update',
        description: 'Update API keys',
        resource: 'api_keys',
        action: 'update',
      },
      {
        name: 'api_keys.delete',
        description: 'Delete API keys',
        resource: 'api_keys',
        action: 'delete',
      },
      {
        name: 'audit_logs.read',
        description: 'Read audit logs',
        resource: 'audit_logs',
        action: 'read',
      },
    ];

    const createdPermissions: Permission[] = [];
    for (const perm of permissions) {
      const permission = queryRunner.manager.create(Permission, perm);
      const savedPermission = await queryRunner.manager.save(permission);
      createdPermissions.push(savedPermission);
    }
    console.log(`Created ${createdPermissions.length} permissions`);

    // Create Super Admin role
    const superAdminRole = queryRunner.manager.create(Role, {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      is_default: false,
    });
    superAdminRole.permissions = createdPermissions;
    const savedSuperAdminRole = await queryRunner.manager.save(superAdminRole);
    console.log('Created Super Admin role');

    // Create Manager role
    const managerPermissions = createdPermissions.filter(
      (p) =>
        p.name.includes('read') ||
        p.name.includes('clients.create') ||
        p.name.includes('clients.update') ||
        p.name.includes('api_keys.create') ||
        p.name.includes('api_keys.update'),
    );
    const managerRole = queryRunner.manager.create(Role, {
      name: 'Manager',
      description: 'Manager role with limited permissions',
      is_default: false,
    });
    managerRole.permissions = managerPermissions;
    await queryRunner.manager.save(managerRole);
    console.log('Created Manager role');

    // Create Staff role
    const staffPermissions = createdPermissions.filter(
      (p) =>
        p.name.includes('read') &&
        (p.name.includes('clients') || p.name.includes('api_keys')),
    );
    const staffRole = queryRunner.manager.create(Role, {
      name: 'Staff',
      description: 'Staff role with read-only access',
      is_default: true,
    });
    staffRole.permissions = staffPermissions;
    await queryRunner.manager.save(staffRole);
    console.log('Created Staff role');

    // Create admin user
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
    adminUser.roles = [savedSuperAdminRole];
    await queryRunner.manager.save(adminUser);
    console.log('Created admin user (admin@auth.com / 12345)');

    // Commit transaction
    await queryRunner.commitTransaction();
    console.log('Seed completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error during seed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runSeed()
  .then(() => {
    console.log('Seed process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  });
