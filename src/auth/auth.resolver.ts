import { HttpException, HttpStatus } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { randomBytes, scryptSync } from 'crypto';
import { User } from 'src/users/contracts/domain';
import { UsersService } from 'src/users/users.service';
import { v4 } from 'uuid';
import { AuthService } from './auth.service';
import { SignUpInput } from './contracts/dto/inputs';
import { JwtService } from '@nestjs/jwt';
import { AuthResponse } from './contracts/domain';

const SCRYPT_KEYLEN = 64;
const SALT_LEN = 16;
const ACCESS_TOKEN_EXP = '10 min';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Mutation(() => User)
  async signUp(@Args('input') input: SignUpInput): Promise<User> {
    if (await this.usersService.existsWithUsername(input.username)) {
      throw new HttpException(
        'This username already exists.',
        HttpStatus.CONFLICT,
      );
    }

    const createdUser = await this.usersService.create({
      _id: v4(),
      username: input.username,
      avatar: input.avatarUrl || 'https://picsum.photos/64/64',
    });
    const salt = randomBytes(SALT_LEN);
    const passwordHash = scryptSync(
      input.password,
      salt,
      SCRYPT_KEYLEN,
    ).toString('base64');
    await this.authService.create({
      _id: v4(),
      passwordHash,
      salt: salt.toString('base64'),
      user: createdUser._id,
    });
    return createdUser;
  }

  @Mutation(() => AuthResponse)
  async logIn(
    @Args('username') username: string,
    @Args('password') password: string,
  ): Promise<AuthResponse> {
    const user = await this.usersService.findByUsername(username);

    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    const { salt, passwordHash } = await this.authService.findByUser(user._id);
    const loginPasswordHash = scryptSync(
      password,
      Buffer.from(salt, 'base64'),
      SCRYPT_KEYLEN,
    ).toString('base64');
    if (passwordHash !== loginPasswordHash)
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    const token = this.jwtService.sign(
      { username: user.username },
      {
        header: {
          typ: 'access',
        },
        expiresIn: ACCESS_TOKEN_EXP,
        subject: user._id,
      },
    );
    const refreshToken = this.jwtService.sign(
      {},
      {
        header: { typ: 'refresh' },
        subject: user._id,
      },
    );

    return {
      token,
      refreshToken,
    };
  }
}
