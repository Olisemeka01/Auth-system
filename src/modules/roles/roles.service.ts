import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async findAll() {
    const roles = await this.rolesRepository.find({
      relations: ['permissions'],
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
      relations: ['permissions', 'users'],
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

    // Handle permissions if provided
    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const permissions = await this.permissionsRepository.findByIds(
        createRoleDto.permissions,
      );
      role.permissions = permissions;
    }

    const savedRole = await this.rolesRepository.save(role);

    // Reload with relations
    const roleWithRelations = await this.rolesRepository.findOne({
      where: { id: savedRole.id },
      relations: ['permissions'],
    });

    return {
      success: true,
      data: roleWithRelations,
      message: 'Role created successfully',
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Handle permissions update if provided
    if (updateRoleDto.permissions) {
      const permissions = await this.permissionsRepository.findByIds(
        updateRoleDto.permissions,
      );
      role.permissions = permissions;
    }

    // Update other fields
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

  async assignPermissions(roleId: string, permissionIds: string[]) {
    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.permissionsRepository.findByIds(permissionIds);
    role.permissions = permissions;

    const updatedRole = await this.rolesRepository.save(role);

    return {
      success: true,
      data: updatedRole,
      message: 'Permissions assigned successfully',
    };
  }

  async removePermission(roleId: string, permissionId: string) {
    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.permissions = role.permissions.filter(
      (permission) => permission.id !== permissionId,
    );

    const updatedRole = await this.rolesRepository.save(role);

    return {
      success: true,
      data: updatedRole,
      message: 'Permission removed successfully',
    };
  }
}
