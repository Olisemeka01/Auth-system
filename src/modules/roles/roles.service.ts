import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findAll() {
    const roles = await this.rolesRepository.find({
      order: { created_at: 'ASC' },
    });

    return {
      success: true,
      data: roles,
      message: 'Roles retrieved successfully',
    };
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      success: true,
      data: role,
      message: 'Role retrieved successfully',
    };
  }

  async create(createRoleDto: CreateRoleDto) {
    // Check if role already exists
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Create new role
    const role = this.rolesRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      is_default: createRoleDto.is_default ?? false,
    });

    const savedRole = await this.rolesRepository.save(role);

    return {
      success: true,
      data: savedRole,
      message: 'Role created successfully',
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Update fields
    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }
    if (updateRoleDto.is_default !== undefined) {
      role.is_default = updateRoleDto.is_default;
    }

    const updatedRole = await this.rolesRepository.save(role);

    return {
      success: true,
      data: updatedRole,
      message: 'Role updated successfully',
    };
  }

  async remove(id: string) {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is assigned to any users
    if (role.users && role.users.length > 0) {
      throw new ConflictException(
        'Cannot delete role that is assigned to users',
      );
    }

    await this.rolesRepository.remove(role);

    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}
