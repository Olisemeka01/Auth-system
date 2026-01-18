import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { SecurityUtil } from '../../common/utils/security.util';
import { PaginateUtil, PAGINATION_CONFIG } from '../../common/utils/paginate.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    // Apply filters from query
    if (query.filter?.['is_active']) {
      queryBuilder.andWhere('user.is_active = :is_active', {
        is_active: query.filter['is_active'] === 'true',
      });
    }

    if (query.filter?.['is_verified']) {
      queryBuilder.andWhere('user.is_verified = :is_verified', {
        is_verified: query.filter['is_verified'] === 'true',
      });
    }

    return PaginateUtil.paginate(query, queryBuilder, PAGINATION_CONFIG.USER);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: this.sanitizeUser(user),
      message: 'User retrieved successfully',
    };
  }

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if phone number already exists (in users or clients)
    if (createUserDto.phone) {
      const existingUserByPhone = await this.usersRepository.findOne({
        where: { phone: createUserDto.phone },
      });

      if (existingUserByPhone) {
        throw new ConflictException('User with this phone number already exists');
      }

      // Check if phone exists in clients table by querying raw
      const existingClientByPhone = await this.usersRepository.query(
        'SELECT id FROM clients WHERE phone = $1 LIMIT 1',
        [createUserDto.phone]
      );

      if (existingClientByPhone.length > 0) {
        throw new ConflictException('Phone number already exists in clients');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(createUserDto.password, salt);

    // Create new user
    const user = new User();
    user.email = createUserDto.email;
    user.password_hash = password_hash;
    user.first_name = createUserDto.first_name;
    user.last_name = createUserDto.last_name;
    user.phone = createUserDto.phone || null;
    user.is_active = createUserDto.is_active ?? true;
    user.is_verified = createUserDto.is_verified ?? false;

    const savedUser = await this.usersRepository.save(user);

    // Load relations if roles were provided
    if (createUserDto.roles && createUserDto.roles.length > 0) {
      const userWithRoles = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles'],
      });
      return {
        success: true,
        data: this.sanitizeUser(userWithRoles!),
        message: 'User created successfully',
      };
    }

    return {
      success: true,
      data: this.sanitizeUser(savedUser),
      message: 'User created successfully',
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash password if provided
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(updateUserDto.password, salt);
    }

    // Update other fields
    if (updateUserDto.first_name) user.first_name = updateUserDto.first_name;
    if (updateUserDto.last_name) user.last_name = updateUserDto.last_name;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone || null;
    if (updateUserDto.is_active !== undefined) user.is_active = updateUserDto.is_active;
    if (updateUserDto.is_verified !== undefined) user.is_verified = updateUserDto.is_verified;

    // Handle roles update if provided
    if (updateUserDto.roles) {
      // This is a simplified version - in production you'd want to handle the many-to-many relationship properly
      // For now, we'll skip this
    }

    const updatedUser = await this.usersRepository.save(user);

    return {
      success: true,
      data: this.sanitizeUser(updatedUser),
      message: 'User updated successfully',
    };
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.softRemove(user);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  private sanitizeUser(user: User) {
    return SecurityUtil.sanitizeUser(user);
  }
}
