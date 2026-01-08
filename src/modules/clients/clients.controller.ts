import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Roles, CurrentUser } from '../../common/decorators';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CreateClientDto, UpdateClientDto } from './dto';
import { Role } from '../auth/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get all clients' })
  async findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new client' })
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.clientsService.create(createClientDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get client profile' })
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return this.clientsService.findOne(user.id);
  }

  @Get('verify-api-key')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Verify API key (use x-api-key header)' })
  async verifyApiKey(@CurrentUser() user: CurrentUserData) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        type: user.type,
      },
      message: 'API key is valid',
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update client' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete client (Super Admin only)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.clientsService.remove(id);
  }
}
