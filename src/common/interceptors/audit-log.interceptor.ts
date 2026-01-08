import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { Request } from 'express';
import { CurrentUserData } from '../decorators/current-user.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
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

          const auditLog = this.auditLogRepository.create({
            user_id: user?.type === 'user' ? user.id : null,
            client_id: user?.type === 'client' ? user.id : null,
            action: `${method.toLowerCase()}_${entity}`,
            entity,
            entity_id: entityId,
            changes: this.extractChanges(request.body),
            ip_address: ip,
            user_agent: userAgent,
          });

          await this.auditLogRepository.save(auditLog);
        } catch (error) {
          // Log error but don't break the request
          console.error('Failed to create audit log:', error);
        }
      }),
    );
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