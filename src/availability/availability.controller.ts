// availability.controller.ts
import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './create-availability.dto';
import { CreateAvailabilityExceptionDto } from './create-availability-exception.dto';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // --- Recurring Availability ---

  @Post('users/:userId')
  @ApiOperation({ summary: 'Set recurring weekly availability for a user' })
  setAvailability(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.setAvailability(userId, dto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get all recurring availability for a user' })
  getUserAvailability(@Param('userId', ParseIntPipe) userId: number) {
    return this.availabilityService.getUserAvailability(userId);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Delete a recurring availability record' })
  deleteAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.availabilityService.deleteAvailability(id, userId);
  }

  // --- Exceptions ---

  @Post('users/:userId/exceptions')
  @ApiOperation({ summary: 'Add a one-off availability exception for a user' })
  addException(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateAvailabilityExceptionDto,
  ) {
    return this.availabilityService.addException(userId, dto);
  }

  @Get('users/:userId/exceptions')
  @ApiOperation({ summary: 'Get all exceptions for a user' })
  getUserExceptions(@Param('userId', ParseIntPipe) userId: number) {
    return this.availabilityService.getUserExceptions(userId);
  }

  @Delete('exceptions/:id/users/:userId')
  @ApiOperation({ summary: 'Delete an exception' })
  deleteException(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.availabilityService.deleteException(id, userId);
  }
}