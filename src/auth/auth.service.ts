import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { HashService } from 'src/hash/hash.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private hashService: HashService,
  ) {}

  auth(user: User) {
    const payload = { sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async validatePassword(username: string, password: string) {
    const usrPswd = password;
    const user = await this.usersService.findByUsername(username);

    if (user) {
      const isValidHash = await this.hashService.verifyHash(
        usrPswd,
        user.password,
      );
      return isValidHash ? user : null;
    }
    return null;
  }
}
