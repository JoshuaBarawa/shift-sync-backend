// jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });

      const user = await this.userModel.findOne({ where: { id: payload.sub, isActive: true } });
      if (!user) throw new UnauthorizedException('User not found');

      request.user = user; // attach user to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}