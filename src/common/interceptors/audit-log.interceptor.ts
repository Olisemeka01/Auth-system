import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { Request } from 'express';
import { CurrentUserData } from '../decorators/current-user.decorator';
import { AUDIT_ACTIONS } from '../constants/audit-actions';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

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
          const entity = this.extractEntityName(url);
          const entityId = this.extractEntityId(request.params);

          // Determine action: only log specific user/client actions
          const action = this.getSpecificAction(url, method);

          // Skip logging if no specific action is defined
          if (!action) {
            return;
          }

          const auditLog = this.auditLogRepository.create({
            user_id: user?.type === 'user' ? user.id : null,
            client_id: user?.type === 'client' ? user.id : null,
            action,
            entity,
            entity_id: entityId,
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

  private getSpecificAction(url: string, method: string): string | null {
    const segments = url.split('/').filter(Boolean);

    // Check if this is a user CRUD endpoint
    if (segments.includes('users') && method === 'POST') {
      return AUDIT_ACTIONS.USER_CREATED;
    }
    if (segments.includes('users') && method === 'PUT') {
      return AUDIT_ACTIONS.USER_UPDATED;
    }
    if (segments.includes('users') && method === 'DELETE') {
      return AUDIT_ACTIONS.USER_DELETED;
    }

    // Check if this is a client CRUD endpoint
    if (segments.includes('clients') && method === 'POST') {
      return AUDIT_ACTIONS.CLIENT_CREATED;
    }
    if (segments.includes('clients') && method === 'PUT') {
      return AUDIT_ACTIONS.CLIENT_UPDATED;
    }
    if (segments.includes('clients') && method === 'DELETE') {
      return AUDIT_ACTIONS.CLIENT_DELETED;
    }

    return null;
  }

  private extractEntityName(url: string): string {
    const segments = url.split('/').filter(Boolean);
    // Return the first segment after /api/ or the first segment if no /api/
    const apiIndex = segments.indexOf('api');
    if (apiIndex !== -1 && segments[apiIndex + 1]) {
      return segments[apiIndex + 1];
    }
    return segments[0] || 'unknown';
  }

  private extractEntityId(params: any): string | null {
    return params.id || null;
  }

  private extractChanges(body: any): Record<string, any> | null {
    if (!body || Object.keys(body).length === 0) {
      return null;
    }

    // Remove sensitive fields
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.email_verification_token;

    return sanitized;
  }
}
