import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePermissionsSystem1736280000001 implements MigrationInterface {
  name = 'RemovePermissionsSystem1736280000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop role_permissions junction table first (due to foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);

    // Drop permissions table
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);

    // Note: roles and user_roles tables remain but will be simplified in application code
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate permissions table (for rollback if needed)
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) UNIQUE NOT NULL,
        "description" varchar(255),
        "resource" varchar(100) NOT NULL,
        "action" varchar(50) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_permissions_name" ON "permissions" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_permissions_resource" ON "permissions" ("resource")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_permissions_action" ON "permissions" ("action")
    `);

    // Recreate role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);
  }
}
