import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SecurityUtil } from '../../common/utils/security.util';
import {
  PaginateUtil,
  PAGINATION_CONFIG,
} from '../../common/utils/paginate.util';
import { Client, EmailVerificationStatus } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { ClientLoginDto } from '../auth/dto/client-login.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<Client>> {
    const queryBuilder = this.clientsRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.api_keys', 'api_keys');

    return PaginateUtil.paginate(query, queryBuilder, PAGINATION_CONFIG.CLIENT);
  }

  async findOne(id: string) {
    const client = await this.clientsRepository.findOne({
      where: { id },
      relations: ['api_keys'],
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return {
      success: true,
      data: this.sanitizeClient(client),
      message: 'Client retrieved successfully',
    };
  }

  async create(createClientDto: CreateClientDto) {
    // Check if client already exists
    const existingClient = await this.clientsRepository.findOne({
      where: { email: createClientDto.email },
    });

    if (existingClient) {
      throw new ConflictException('Client with this email already exists');
    }

    // Check if phone number already exists (in clients or users)
    if (createClientDto.phone) {
      const existingClientByPhone = await this.clientsRepository.findOne({
        where: { phone: createClientDto.phone },
      });

      if (existingClientByPhone) {
        throw new ConflictException(
          'Client with this phone number already exists',
        );
      }

      // Check if phone exists in users table by querying raw
      const existingUserByPhone = await this.clientsRepository.query(
        'SELECT id FROM users WHERE phone = $1 LIMIT 1',
        [createClientDto.phone],
      );

      if (existingUserByPhone.length > 0) {
        throw new ConflictException('Phone number already exists in users');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(createClientDto.password, salt);

    // Create new client
    const client = this.clientsRepository.create({
      ...createClientDto,
      password_hash,
      is_active: createClientDto.is_active ?? true,
      is_email_verified: EmailVerificationStatus.NOT_VERIFIED,
    });

    const savedClient = await this.clientsRepository.save(client);

    return {
      success: true,
      data: this.sanitizeClient(savedClient),
      message: 'Client created successfully',
    };
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Hash password if provided
    if (updateClientDto.password) {
      const salt = await bcrypt.genSalt(10);
      client.password_hash = await bcrypt.hash(updateClientDto.password, salt);
    }

    // Update other fields
    if (updateClientDto.first_name)
      client.first_name = updateClientDto.first_name;
    if (updateClientDto.last_name) client.last_name = updateClientDto.last_name;
    if (updateClientDto.phone !== undefined)
      client.phone = updateClientDto.phone || null;
    if (updateClientDto.address !== undefined)
      client.address = updateClientDto.address || null;
    if (updateClientDto.is_active !== undefined)
      client.is_active = updateClientDto.is_active;

    const updatedClient = await this.clientsRepository.save(client);

    return {
      success: true,
      data: this.sanitizeClient(updatedClient),
      message: 'Client updated successfully',
    };
  }

  async remove(id: string) {
    const client = await this.clientsRepository.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.clientsRepository.softRemove(client);

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  }

  async verifyEmail(clientId: string, token: string) {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const isVerified = client.verifyEmail(token);

    if (!isVerified) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      };
    }

    await this.clientsRepository.save(client);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async regenerateVerificationToken(clientId: string) {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const token = client.generateEmailVerificationToken();
    await this.clientsRepository.save(client);

    return {
      success: true,
      data: { token },
      message: 'Verification token regenerated successfully',
    };
  }

  async login(
    clientLoginDto: ClientLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const { identifier, password } = clientLoginDto;

    // Check if identifier is email or phone number
    const isEmail = identifier.includes('@');
    const whereCondition = isEmail
      ? { email: identifier }
      : { phone: identifier };

    const client = await this.clientsRepository.findOne({
      where: whereCondition,
    });

    if (!client) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      client.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!client.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const tokens = await this.generateTokens(client);

    // Log successful login
    await this.auditService.logClientLogin(
      client.id,
      ipAddress || '',
      userAgent || '',
    );

    return {
      success: true,
      data: {
        client: {
          id: client.id,
          email: client.email,
          first_name: client.first_name,
          last_name: client.last_name,
          phone: client.phone,
          is_email_verified: client.is_email_verified === 'VERIFIED',
        },
        ...tokens,
      },
      message: 'Login successful',
    };
  }

  private async generateTokens(client: any) {
    const payload = {
      sub: client.id,
      email: client.email,
      type: 'client',
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: '1h',
    };
  }

  async generateApiKey(clientId: string, name: string) {
    const key = randomBytes(32).toString('hex');
    const keyHash = createHash('sha256').update(key).digest('hex');
    const lastFour = key.slice(-4);

    const apiKey = this.apiKeyRepository.create({
      client_id: clientId,
      key_hash: keyHash,
      name,
      last_four: lastFour,
      is_active: true,
    });

    const savedApiKey = await this.apiKeyRepository.save(apiKey);

    return {
      success: true,
      data: {
        id: savedApiKey.id,
        key: key, // Return plain key only once!
        name: savedApiKey.name,
        last_four: savedApiKey.last_four,
        is_active: savedApiKey.is_active,
        expires_at: savedApiKey.expires_at,
        created_at: savedApiKey.created_at,
      },
      message:
        'API key generated successfully. Save this key securely as it will not be shown again.',
    };
  }

  private sanitizeClient(client: Client) {
    return SecurityUtil.sanitizeClient(client);
  }
}
