// shifts.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './create-shift.dto';
import { AssignStaffDto } from './assign-staff.dto';

@ApiTags('Shifts')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift' })
  create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shifts, optionally filter by location' })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  findAll(@Query('locationId') locationId?: number) {
    return this.shiftsService.findAll(locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shift with assignments' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift (draft only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateShiftDto>) {
    return this.shiftsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a shift' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.remove(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish shift — visible to staff' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.publish(id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish shift — back to draft' })
  unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.unpublish(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a staff member to a shift' })
  assignStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignStaffDto) {
    return this.shiftsService.assignStaff(id, dto);
  }

  @Delete(':id/assign/:userId')
  @ApiOperation({ summary: 'Remove a staff member from a shift' })
  unassignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.shiftsService.unassignStaff(id, userId);
  }

  @Get(':id/qualified-staff')
  @ApiOperation({ summary: 'Find all qualified available staff for a shift — use when finding coverage' })
  findQualifiedStaff(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findQualifiedStaff(id);
  }
}