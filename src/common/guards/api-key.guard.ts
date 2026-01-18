import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../modules/clients/entities/api-key.entity';
import * as crypto from 'crypto';
import { API_KEY_HEADER } from '../../modules/auth/constants';

/**
 * API Key authentication guard
 * Validates API keys and attaches client to request
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
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

    // Attach client to request
    request.user = {
      id: client.id,
      email: client.email,
      type: 'client',
      roles: ['CLIENT'],
      is_active: client.is_active,
      is_verified: client.is_email_verified === 'VERIFIED',
      api_key_id: apiKeyRecord.id,
    };

    return true;
  }
}