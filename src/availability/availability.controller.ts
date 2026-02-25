
import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dtos/create-availability.dto';
import { CreateAvailabilityExceptionDto } from './dtos/create-availability-exception.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, Role } from '../users/entities/user.entity';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // --- Recurring availability ---

  @Post('users/:userId')
  @ApiOperation({ summary: 'Set availability — staff set their own, managers can set for anyone' })
  setAvailability(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== userId) {
      return { success: false, message: 'You can only set your own availability' };
    }
    return this.availabilityService.setAvailability(userId, dto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get availability — staff see their own, managers see anyone' })
  getUserAvailability(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== userId) {
      return { success: false, message: 'You can only view your own availability' };
    }
    return this.availabilityService.getUserAvailability(userId);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Delete an availability record' })
  deleteAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== userId) {
      return { success: false, message: 'You can only delete your own availability' };
    }
    return this.availabilityService.deleteAvailability(id, userId);
  }

  // --- Exceptions ---

  @Post('users/:userId/exceptions')
  @ApiOperation({ summary: 'Add a one-off exception — staff set their own, managers can set for anyone' })
  addException(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateAvailabilityExceptionDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== userId) {
      return { success: false, message: 'You can only add exceptions for yourself' };
    }
    return this.availabilityService.addException(userId, dto);
  }

  @Get('users/:userId/exceptions')
  @ApiOperation({ summary: 'Get all exceptions for a user' })
  getUserExceptions(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== userId) {
      return { success: false, message: 'You can only view your own exceptions' };
    }
    return this.availabilityService.getUserExceptions(userId);
  }

  @Delete('exceptions/:id/users/:userId')
  @ApiOperation({ summary: 'Delete an exception' })
  deleteException(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== userId) {
      return { success: false, message: 'You can only delete your own exceptions' };
    }
    return this.availabilityService.deleteException(id, userId);
  }
}