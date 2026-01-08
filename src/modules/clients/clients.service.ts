import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Client, EmailVerificationStatus } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async findAll() {
    const clients = await this.clientsRepository.find({
      relations: ['api_keys'],
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: clients.map((client) => this.sanitizeClient(client)),
      message: 'Clients retrieved successfully',
    };
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

  async findByEmail(email: string) {
    const client = await this.clientsRepository.findOne({
      where: { email },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async create(createClientDto: CreateClientDto) {
    // Check if client already exists
    const existingClient = await this.clientsRepository.findOne({
      where: { email: createClientDto.email },
    });

    if (existingClient) {
      throw new ConflictException('Client with this email already exists');
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
    if (updateClientDto.first_name) client.first_name = updateClientDto.first_name;
    if (updateClientDto.last_name) client.last_name = updateClientDto.last_name;
    if (updateClientDto.phone !== undefined) client.phone = updateClientDto.phone || null;
    if (updateClientDto.address !== undefined) client.address = updateClientDto.address || null;
    if (updateClientDto.is_active !== undefined) client.is_active = updateClientDto.is_active;

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

  private sanitizeClient(client: Client) {
    const sanitized: any = { ...client };
    delete sanitized.password_hash;
    delete sanitized.email_verification_token;
    delete sanitized.email_verification_token_expires_at;
    return sanitized;
  }
}
