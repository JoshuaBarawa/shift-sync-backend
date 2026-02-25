
// swaps.controller.ts
import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SwapsService } from './swaps.service';
import { CreateSwapDto } from './create-swap.dto';
import { RejectDto } from './reject.dto';
import { SwapStatus } from './swap-request.entity';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Swaps')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a swap or drop request' })
  create(@CurrentUser() user: User, @Body() dto: CreateSwapDto) {
    return this.swapsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all swap requests — filter by userId or status' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SwapStatus })
  findAll(
    @Query('userId') userId?: number,
    @Query('status') status?: SwapStatus,
  ) {
    return this.swapsService.findAll(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single swap request' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.swapsService.findOne(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Staff B accepts a swap request' })
  accept(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.swapsService.accept(id, user.id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Staff B declines a swap request' })
  decline(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() dto: RejectDto,
  ) {
    return this.swapsService.decline(id, user.id, dto);
  }

  @Post(':id/pickup')
  @ApiOperation({ summary: 'Staff B picks up an open drop request' })
  pickup(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.swapsService.pickup(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Staff A cancels their own request' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.swapsService.cancel(id, user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Manager approves a swap/drop — executes the reassignment' })
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.swapsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Manager rejects a swap/drop request' })
  managerReject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() dto: RejectDto,
  ) {
    return this.swapsService.managerReject(id, user.id, dto);
  }
}