import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Owner } from 'src/modules/owners/owner.entity';
import { CreateOwnerDto } from 'src/modules/owners/create-owner.dto';
import { TokenPayload } from 'src/types/token.payload';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Owner) private ownersRepository: Repository<Owner>,
    private jwtService: JwtService,
  ) {}

  async signIn(user_name: string, password: string, ip: string, userAgent: string) {
    const user: Owner = await this.ownersRepository.findOne({where: { user_name }});

    if (!user) {
      throw new NotFoundException('Account does not exist. Please create an account or try again with a different username.');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials. Please check your username and password and try again.');
    }

    const payload: TokenPayload = { 
      sub: user.id,
      user_name,
      scope: 'read'
    };

    const accessToken = await this.jwtService.signAsync(payload, {secret: 'kolap'});

    await this.ownersRepository.update({id: user.id}, {access_token: accessToken, ip, user_agent: userAgent});

    return {access_token: accessToken};
  }

  async register(createOwnerDto: CreateOwnerDto) {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(createOwnerDto.password, saltOrRounds);
    createOwnerDto.password = hash;
    const owner: CreateOwnerDto = await this.ownersRepository.save(createOwnerDto);
    return owner;
  }
}