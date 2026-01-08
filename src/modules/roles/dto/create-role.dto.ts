import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER', description: 'Role name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 'Manager role with elevated permissions', description: 'Role description', required: false })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(255, { message: 'Description cannot exceed 255 characters' })
  description?: string;

  @ApiProperty({ example: ['permission-id-1', 'permission-id-2'], description: 'Array of permission IDs', required: false })
  @IsOptional()
  @IsArray({ message: 'Permissions must be an array' })
  @IsString({ each: true, message: 'Each permission ID must be a string' })
  permissions?: string[];

  @ApiProperty({ example: false, description: 'Is this a default role?', required: false })
  @IsOptional()
  is_default?: boolean;
}
