import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { RegisterClientBody } from './register.body';

@Injectable()
export class OAuth2Service {
  constructor(
    @InjectRepository(Client) private clientRepository: Repository<Client>,
    private jwtService: JwtService
  ) {}

  async register(registerClientBody: RegisterClientBody) {

  }

  async authorize(appId: string, redirectUri: string) {
    const client = await this.clientRepository.findOne({where: {appId}});
    if (client?.redirectUri !== redirectUri) {
      throw new BadRequestException('Invalid client or redirect URI.');
    }

    const payload = {
      appId,
      appSecret: client.appSecret
    };

    // A short life time token will be expired in 10mn
    const authorizationCode = await this.jwtService.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '10m' });

    const redirectUrl = `${redirectUri}?code=${authorizationCode}`;
    return { redirectUrl };
  }

  async login(authorizationCode: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(authorizationCode, { secret: process.env.JWT_ACCESS_SECRET });

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          {
            sub: decoded.appId,
            appI: decoded.appId,
            scope: ['read']
          },
          {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '30m',
          },
        ),
        this.jwtService.signAsync(
          {
            sub: decoded.appId,
            appI: decoded.appId,
            scope: ['read']
          },
          {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '7d',
          },
        ),
      ]);

      return { accessToken, refreshToken };

    } catch (error) {
      throw new UnauthorizedException('Authorization code verification failed.');
    }
  }
}
