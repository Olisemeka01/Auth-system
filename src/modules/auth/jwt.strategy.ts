import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { JWT_SECRET } from './constants';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'user' | 'client';
  roles?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const { sub, type } = payload;

    if (type === 'client') {
      const client = await this.clientRepository.findOne({
        where: { id: sub },
      });

      if (!client || !client.is_active) {
        throw new UnauthorizedException('Client not found or inactive');
      }

      return {
        id: client.id,
        email: client.email,
        type: 'client',
        is_active: client.is_active,
        is_verified: client.is_email_verified === 'VERIFIED',
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: sub },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      type: 'user',
      is_active: user.is_active,
      is_verified: user.is_verified,
    };
  }
}