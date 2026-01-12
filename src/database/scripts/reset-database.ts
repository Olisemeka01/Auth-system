import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';

dotenv.config();

const logger = new Logger('DatabaseReset');

async function resetDatabase() {
  logger.log('🔄 Starting database reset...');

  try {
    // Step 1: Drop all tables (CASCADE to handle foreign keys)
    logger.log('📋 Step 1: Dropping all tables...');
    const dataSource = new DataSource(dataSourceOptions);
    await dataSource.initialize();
    await dataSource.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    await dataSource.destroy();
    logger.log('✅ Tables dropped successfully');

    // Step 2: Run migrations
    logger.log('📋 Step 2: Running migrations...');
    execSync('pnpm run migration:run', { stdio: 'inherit' });
    logger.log('✅ Migrations completed successfully');

    // Step 3: Run seed
    logger.log('📋 Step 3: Seeding database...');
    execSync('pnpm run seed', { stdio: 'inherit' });
    logger.log('✅ Database seeded successfully');

    logger.log('✨ Database reset completed successfully!');
  } catch (error) {
    logger.error(
      '❌ Database reset failed',
      error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
  }
}

resetDatabase();
