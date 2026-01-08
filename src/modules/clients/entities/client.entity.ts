import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiKey } from './api-key.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

export enum EmailVerificationStatus {
  VERIFIED = 'VERIFIED',
  NOT_VERIFIED = 'NOT_VERIFIED',
}

@Entity('clients')
@Index(['email'])
@Index(['is_active'])
@Index(['is_email_verified'])
@Index(['id'])
@Index(['email', 'is_active'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    name: 'is_email_verified',
    type: 'enum',
    enum: EmailVerificationStatus,
    default: EmailVerificationStatus.NOT_VERIFIED,
  })
  is_email_verified: EmailVerificationStatus;

  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Exclude()
  email_verification_token: string | null;

  @Column({
    name: 'email_verification_token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  @Exclude()
  email_verification_token_expires_at: Date | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verified_at: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations
  @OneToMany(() => ApiKey, (apiKey) => apiKey.client)
  api_keys: ApiKey[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.client)
  audit_logs: AuditLog[];

  // Method to generate 6-digit OTP for email verification
  generateEmailVerificationToken(): string {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set token and expiration (15 minutes from now)
    this.email_verification_token = otp;
    this.email_verification_token_expires_at = new Date(Date.now() + 15 * 60 * 1000);

    return otp;
  }

  // Method to verify email with OTP
  verifyEmail(token: string): boolean {
    if (!this.email_verification_token || !this.email_verification_token_expires_at) {
      return false;
    }

    // Check if token is expired
    if (new Date() > this.email_verification_token_expires_at) {
      return false;
    }

    // Check if token matches
    if (this.email_verification_token !== token) {
      return false;
    }

    // Mark as verified
    this.is_email_verified = EmailVerificationStatus.VERIFIED;
    this.verified_at = new Date();
    this.email_verification_token = null;
    this.email_verification_token_expires_at = null;

    return true;
  }

  // Method to check if verification token is expired
  isVerificationTokenExpired(): boolean {
    if (!this.email_verification_token_expires_at) {
      return true;
    }
    return new Date() > this.email_verification_token_expires_at;
  }

  // Password hashing hook
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Only hash if password_hash is set and has been modified
    if (this.password_hash) {
      const bcrypt = require('bcrypt');
      // Check if the password is already hashed (bcrypt hashes start with $2b$ or $2a$)
      const isAlreadyHashed = this.password_hash.startsWith('$2');
      if (!isAlreadyHashed) {
        const salt = await bcrypt.genSalt(10);
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
      }
    }
  }
}
