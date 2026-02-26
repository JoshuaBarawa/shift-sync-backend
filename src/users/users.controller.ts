import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, Role } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user — Admin only' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: User) {
    if (user.role !== Role.ADMIN) {
      return { success: false, message: 'Only admins can create users' };
    }
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users — Manager/Admin only' })
  findAll(@CurrentUser() user: User) {
    if (user.role === Role.STAFF) {
      return { success: false, message: 'Only managers and admins can list all users' };
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user — staff can only get themselves' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role === Role.STAFF && user.id !== id) {
      return { success: false, message: 'You can only view your own profile' };
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user — staff can only update themselves' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === Role.STAFF && user.id !== id) {
      return { success: false, message: 'You can only update your own profile' };
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a user — Admin only' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    if (user.role !== Role.ADMIN) {
      return { success: false, message: 'Only admins can deactivate users' };
    }
    return this.usersService.remove(id);
  }
}