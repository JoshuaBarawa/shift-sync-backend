import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SwapsService } from './swaps.service';
import { CreateSwapDto } from './dtos/create-swap.dto';
import { RejectDto } from './dtos/reject.dto';
import { SwapStatus } from './entities/swap-request.entity';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, Role } from '../users/entities/user.entity';

@ApiTags('Swaps')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) {}

  // --- Staff actions ---

  @Post()
  @ApiOperation({ summary: 'Create a swap or drop request — Staff only' })
  create(@CurrentUser() user: User, @Body() dto: CreateSwapDto) {
    if (user.role === Role.MANAGER || user.role === Role.ADMIN) {
      return { success: false, message: 'Only staff can create swap requests' };
    }
    return this.swapsService.create(user.id, dto);
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

  // --- Manager/Admin actions ---

  @Post(':id/approve')
  @ApiOperation({ summary: 'Manager approves a swap/drop — Manager/Admin only' })
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can approve swaps' };
    }
    return this.swapsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Manager rejects a swap/drop — Manager/Admin only' })
  managerReject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() dto: RejectDto,
  ) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can reject swaps' };
    }
    return this.swapsService.managerReject(id, user.id, dto);
  }

  // --- Anyone logged in ---

  @Get()
  @ApiOperation({ summary: 'Get swap requests — staff see their own, managers see all' })
  @ApiQuery({ name: 'status', required: false, enum: SwapStatus })
  findAll(@CurrentUser() user: User, @Query('status') status?: SwapStatus) {
    // staff only see their own requests, managers/admins see everything
    const userId = user.role === Role.STAFF ? user.id : undefined;
    return this.swapsService.findAll(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single swap request' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.swapsService.findOne(id);
  }
}