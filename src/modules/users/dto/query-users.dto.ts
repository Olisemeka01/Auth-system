import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class QueryUsersDto {
  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;

  @ApiProperty({ required: false, description: 'Filter by verification status' })
  @IsOptional()
  @IsBoolean({ message: 'is_verified must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  is_verified?: boolean;

  @ApiProperty({ required: false, description: 'Search by email' })
  @IsOptional()
  @IsString({ message: 'email must be a string' })
  email?: string;

  @ApiProperty({ required: false, description: 'Page number', default: 1 })
  @IsOptional()
  @IsString({ message: 'page must be a string' })
  page?: string;

  @ApiProperty({ required: false, description: 'Items per page', default: 10 })
  @IsOptional()
  @IsString({ message: 'limit must be a string' })
  limit?: string;
}
