import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1736280000000 implements MigrationInterface {
  name = 'InitialSchema1736280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
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

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) UNIQUE NOT NULL,
        "description" varchar(255),
        "is_default" boolean DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_roles_name" ON "roles" ("name")
    `);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) UNIQUE NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "phone" varchar(20),
        "is_active" boolean DEFAULT true,
        "is_verified" boolean DEFAULT false,
        "last_login_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email_is_active" ON "users" ("email", "is_active")
    `);

    // Create user_roles junction table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    // Create clients table
    await queryRunner.query(`
      CREATE TYPE "email_verification_status_enum" AS ENUM ('VERIFIED', 'NOT_VERIFIED')
    `);

    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(255) UNIQUE NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "phone" varchar(20),
        "address" text,
        "is_active" boolean DEFAULT true,
        "is_email_verified" "email_verification_status_enum" DEFAULT 'NOT_VERIFIED',
        "email_verification_token" varchar(255),
        "email_verification_token_expires_at" timestamp,
        "verified_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clients_email" ON "clients" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clients_is_active" ON "clients" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clients_is_email_verified" ON "clients" ("is_email_verified")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clients_id" ON "clients" ("id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clients_email_is_active" ON "clients" ("email", "is_active")
    `);

    // Create api_keys table
    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "client_id" uuid NOT NULL,
        "key_hash" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "last_four" varchar(4) NOT NULL,
        "is_active" boolean DEFAULT true,
        "expires_at" timestamp,
        "last_used_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "FK_api_keys_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_client_id" ON "api_keys" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_key_hash" ON "api_keys" ("key_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_is_active" ON "api_keys" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_expires_at" ON "api_keys" ("expires_at")
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "client_id" uuid,
        "action" varchar(100) NOT NULL,
        "entity" text NOT NULL,
        "entity_id" uuid,
        "changes" jsonb,
        "ip_address" varchar(50),
        "user_agent" varchar(500),
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_audit_logs_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_client_id" ON "audit_logs" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "email_verification_status_enum" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
  }
}