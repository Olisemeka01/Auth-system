import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { Request } from 'express';
import { CurrentUserData } from '../decorators/current-user.decorator';
import { AUDIT_ACTIONS } from '../constants/audit-actions';

/**
 * Configuration mapping routes to audit actions
 */
const AUDIT_ROUTE_MAP: Record<string, Record<string, string>> = {
  users: {
    POST: AUDIT_ACTIONS.USER_CREATED,
    PUT: AUDIT_ACTIONS.USER_UPDATED,
    DELETE: AUDIT_ACTIONS.USER_DELETED,
  },
  clients: {
    POST: AUDIT_ACTIONS.CLIENT_CREATED,
    PUT: AUDIT_ACTIONS.CLIENT_UPDATED,
    DELETE: AUDIT_ACTIONS.CLIENT_DELETED,
  },
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUserData;
    const method = request.method;
    const url = request.url;
    const ip = request.ip || request.socket.remoteAddress;
    const userAgent = request.get('user-agent') || '';

    // Skip audit logging for GET requests
    if (method === 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          const { entity, action } = this.getAuditInfo(url, method);

          // Skip logging if no specific action is defined
          if (!action) {
            return;
          }

          const auditLog = this.auditLogRepository.create({
            user_id: user?.type === 'user' ? user.id : null,
            client_id: user?.type === 'client' ? user.id : null,
            action,
            entity,
            entity_id: request.params?.id || null,
            changes: this.extractChanges(request.body),
            ip_address: ip,
            user_agent: userAgent,
          });

          await this.auditLogRepository.save(auditLog);
        } catch (error) {
          // Log error but don't break the request
          this.logger.error('Failed to create audit log', error.stack);
        }
      }),
    );
  }

  /**
   * Extract entity and action from URL and method using configuration map
   */
  private getAuditInfo(url: string, method: string): { entity: string; action: string | null } {
    const segments = url.split('/').filter(Boolean);
    const apiIndex = segments.indexOf('api');

    // Get the entity name (first segment after /api/)
    const entity = apiIndex !== -1 && segments[apiIndex + 1]
      ? segments[apiIndex + 1]
      : segments[0] || 'unknown';

    // Look up action in configuration map
    const action = AUDIT_ROUTE_MAP[entity]?.[method] || null;

    return { entity, action };
  }

  /**
   * Remove sensitive fields from request body
   */
  private extractChanges(body: any): Record<string, any> | null {
    if (!body || Object.keys(body).length === 0) {
      return null;
    }

    // Remove sensitive fields
    const { password, password_hash, email_verification_token, ...sanitized } = body;
    return sanitized;
  }
}
