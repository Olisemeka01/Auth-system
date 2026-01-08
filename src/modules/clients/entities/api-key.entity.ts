import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Client } from './client.entity';

@Entity('api_keys')
@Index(['client_id'])
@Index(['key_hash'])
@Index(['is_active'])
@Index(['expires_at'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Column({ name: 'key_hash', type: 'varchar', length: 255 })
  @Exclude()
  key_hash: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'last_four', type: 'varchar', length: 4 })
  last_four: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  is_active: boolean;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: true,
  })
  expires_at: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations
  @ManyToOne(() => Client, (client) => client.api_keys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
