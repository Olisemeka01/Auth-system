import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddRoleCodeColumn1736280000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the code column to roles table
    await queryRunner.query(`
      ALTER TABLE "roles"
      ADD COLUMN "code" varchar(50)
    `);

    // Update existing roles with their codes
    await queryRunner.query(`
      UPDATE "roles" SET "code" = 'SUPER_ADMIN' WHERE "name" = 'Super Admin'
    `);

    await queryRunner.query(`
      UPDATE "roles" SET "code" = 'ADMIN' WHERE "name" = 'Admin'
    `);

    await queryRunner.query(`
      UPDATE "roles" SET "code" = 'MANAGER' WHERE "name" = 'Manager'
    `);

    await queryRunner.query(`
      UPDATE "roles" SET "code" = 'EMPLOYEE' WHERE "name" = 'Employee'
    `);

    await queryRunner.query(`
      UPDATE "roles" SET "code" = 'CLIENT' WHERE "name" = 'Client'
    `);

    // Make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE "roles"
      ALTER COLUMN "code" SET NOT NULL
    `);

    // Add unique constraint
    await queryRunner.query(`
      ALTER TABLE "roles"
      ADD CONSTRAINT "UQ_roles_code" UNIQUE ("code")
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_roles_code" ON "roles" ("code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_roles_code"
    `);

    // Drop the unique constraint
    await queryRunner.query(`
      ALTER TABLE "roles"
      DROP CONSTRAINT IF EXISTS "UQ_roles_code"
    `);

    // Drop the column
    await queryRunner.query(`
      ALTER TABLE "roles"
      DROP COLUMN "code"
    `);
  }
}
