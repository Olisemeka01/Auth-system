import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../modules/clients/entities/api-key.entity';
import { Client } from '../../modules/clients/entities/client.entity';
import * as crypto from 'crypto';
import { API_KEY_HEADER } from '../../modules/auth/constants';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers[API_KEY_HEADER];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Hash the provided API key to compare with stored hash
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const apiKeyRecord = await this.apiKeyRepository.findOne({
      where: { key_hash: apiKeyHash, is_active: true },
      relations: ['client'],
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if API key is expired
    if (apiKeyRecord.expires_at && apiKeyRecord.expires_at < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    const client = apiKeyRecord.client;

    if (!client || !client.is_active) {
      throw new UnauthorizedException('Client is not active');
    }

    // Update last used timestamp
    apiKeyRecord.last_used_at = new Date();
    await this.apiKeyRepository.save(apiKeyRecord);

    // Log successful client authentication
    const ip = request.ip || (request as any).socket?.remoteAddress;
    const userAgent = request.get('user-agent') || '';
    await this.auditService.logClientLogin(client.id, ip, userAgent);

    // Attach client to request
    request.user = {
      id: client.id,
      email: client.email,
      type: 'client',
      roles: [{ name: 'CLIENT' }],
      is_active: client.is_active,
      is_verified: client.is_email_verified === 'VERIFIED',
      api_key_id: apiKeyRecord.id,
    };

    return true;
  }
}