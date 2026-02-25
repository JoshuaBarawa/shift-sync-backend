// locations.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { CertifyUserDto } from './dtos/certify-user.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, Role } from '../users/entities/user.entity';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a location — Admin only' })
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: User) {
    if (user.role !== Role.ADMIN) {
      return { success: false, message: 'Only admins can create locations' };
    }
    return this.locationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations — any logged in user' })
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location with its certified staff' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a location — Admin only' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateLocationDto>,
    @CurrentUser() user: User,
  ) {
    if (user.role !== Role.ADMIN) {
      return { success: false, message: 'Only admins can update locations' };
    }
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a location — Admin only' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role !== Role.ADMIN) {
      return { success: false, message: 'Only admins can deactivate locations' };
    }
    return this.locationsService.remove(id);
  }

  @Post(':id/certify')
  @ApiOperation({ summary: 'Certify a staff member at this location — Manager/Admin only' })
  certifyUser(
    @Param('id', ParseIntPipe) locationId: number,
    @Body() dto: CertifyUserDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can certify staff' };
    }
    return this.locationsService.certifyUser(locationId, dto.userId);
  }

  @Delete(':id/certify/:userId')
  @ApiOperation({ summary: 'Remove a staff certification — Manager/Admin only' })
  decertifyUser(
    @Param('id', ParseIntPipe) locationId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can remove certifications' };
    }
    return this.locationsService.decertifyUser(locationId, userId);
  }

  @Get(':id/staff')
  @ApiOperation({ summary: 'Get all certified staff at this location' })
  getCertifiedUsers(@Param('id', ParseIntPipe) locationId: number) {
    return this.locationsService.getCertifiedUsers(locationId);
  }
}