// shifts.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dtos/create-shift.dto';
import { AssignStaffDto } from './dtos/assign-staff.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, Role } from '../users/entities/user.entity';

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  // --- Manager/Admin only ---

  @Post()
  @ApiOperation({ summary: 'Create a shift — Manager/Admin only' })
  create(@Body() dto: CreateShiftDto, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can create shifts' };
    }
    return this.shiftsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift — Manager/Admin only' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateShiftDto>,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can edit shifts' };
    }
    return this.shiftsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a shift — Manager/Admin only' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can cancel shifts' };
    }
    return this.shiftsService.remove(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a shift — Manager/Admin only' })
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can publish shifts' };
    }
    return this.shiftsService.publish(id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a shift — Manager/Admin only' })
  unpublish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can unpublish shifts' };
    }
    return this.shiftsService.unpublish(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign staff to a shift — Manager/Admin only' })
  assignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignStaffDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can assign staff' };
    }
    return this.shiftsService.assignStaff(id, dto);
  }

  @Delete(':id/assign/:userId')
  @ApiOperation({ summary: 'Unassign staff from a shift — Manager/Admin only' })
  unassignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can unassign staff' };
    }
    return this.shiftsService.unassignStaff(id, userId);
  }

  // --- Any logged in user ---

  @Get()
  @ApiOperation({ summary: 'Get all shifts — any logged in user' })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  findAll(@Query('locationId') locationId?: number) {
    return this.shiftsService.findAll(locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shift — any logged in user' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findOne(id);
  }

  @Get(':id/qualified-staff')
  @ApiOperation({ summary: 'Find qualified available staff for a shift' })
  findQualifiedStaff(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findQualifiedStaff(id);
  }
}