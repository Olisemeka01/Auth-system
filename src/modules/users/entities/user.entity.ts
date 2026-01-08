import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
@Index(['email', 'is_active'])
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations
  @ManyToMany(() => Role, (role) => role.users, {
    cascade: true,
    eager: false,
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  audit_logs: AuditLog[];

  // Virtual property for full name
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
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
