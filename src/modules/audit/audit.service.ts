import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AUDIT_ACTIONS } from '../../common/constants/audit-actions';

export interface CreateAuditLogDto {
  action: string;
  user_id?: string;
  client_id?: string;
  entity?: string;
  entity_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(dto: CreateAuditLogDto): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create(dto);
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log error but don't throw to avoid breaking auth flows
      this.logger.error('Failed to create audit log', error.stack);
    }
  }

  // Convenience methods for common actions
  async logUserLogin(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.createLog({
      action: AUDIT_ACTIONS.USER_LOGIN,
      user_id: userId,
      entity: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async logUserLogout(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.createLog({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      user_id: userId,
      entity: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async logUserRegistration(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.createLog({
      action: AUDIT_ACTIONS.USER_REGISTER,
      user_id: userId,
      entity: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async logClientLogin(clientId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.createLog({
      action: AUDIT_ACTIONS.CLIENT_LOGIN,
      client_id: clientId,
      entity: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }
}
