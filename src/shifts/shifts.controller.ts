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

  @Post()
  @ApiOperation({ summary: 'Create a shift — Manager/Admin only' })
  create(@Body() dto: CreateShiftDto, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can create shifts' };
    return this.shiftsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shifts — optionally filter by location' })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  findAll(@Query('locationId') locationId?: number) {
    return this.shiftsService.findAll(locationId);
  }

  @Get('hours/weekly')
  @ApiOperation({ summary: 'Get weekly hours for a staff member — overtime dashboard' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiQuery({ name: 'weekStartDate', required: true, type: String, description: 'Monday e.g. 2026-03-02' })
  getWeeklyHours(@Query('userId') userId: number, @Query('weekStartDate') weekStartDate: string) {
    return this.shiftsService.getWeeklyHours(userId, weekStartDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shift with assignments' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findOne(id);
  }

  @Get(':id/qualified-staff')
  @ApiOperation({ summary: 'Find qualified available staff for a shift — coverage finder' })
  findQualifiedStaff(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findQualifiedStaff(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift — Manager/Admin only' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateShiftDto>, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can edit shifts' };
    return this.shiftsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a shift — Manager/Admin only' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can cancel shifts' };
    return this.shiftsService.remove(id, user.id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a shift — Manager/Admin only' })
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can publish shifts' };
    return this.shiftsService.publish(id, user.id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a shift — Manager/Admin only' })
  unpublish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can unpublish shifts' };
    return this.shiftsService.unpublish(id, user.id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign staff to a shift — Manager/Admin only' })
  assignStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignStaffDto, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can assign staff' };
    return this.shiftsService.assignStaff(id, dto, user.id);
  }

  @Delete(':id/assign/:userId')
  @ApiOperation({ summary: 'Unassign staff from a shift — Manager/Admin only' })
  unassignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF) return { success: false, message: 'Only managers and admins can unassign staff' };
    return this.shiftsService.unassignStaff(id, userId, user.id);
  }
}