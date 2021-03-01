import {
  ConflictException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { randomBytes, scryptSync } from 'crypto';
import { User } from 'src/users/contracts';
import { UsersService } from 'src/users/users.service';
import { v4 } from 'uuid';
import { AuthService } from './auth.service';
import { SignUpInput } from './contracts/inputs';
import { JwtService } from '@nestjs/jwt';
import configuration from 'src/config/configuration';
import { AuthResponse, PreSignResponse, RefreshToken } from './contracts';
import { TOKEN_TYPES } from './contracts/enums';
import { AuthGuard } from 'src/common/guards';
import { CurrentToken, TokenTypes } from 'src/common/decorators';

const SCRYPT_KEYLEN = 64;
const SALT_LEN = 16;
const ACCESS_TOKEN_EXP = '10 min';
const REFRESH_TOKEN_EXP = '180 days';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  createAccessToken = (user: User) =>
    this.jwtService.sign(
      { username: user.username },
      {
        header: {
          typ: TOKEN_TYPES.ACCESS,
        },
        expiresIn: ACCESS_TOKEN_EXP,
        subject: user._id,
      },
    );

  createRefreshToken = (userId: string) =>
    this.jwtService.sign(
      {},
      {
        header: { typ: TOKEN_TYPES.REFRESH },
        expiresIn: REFRESH_TOKEN_EXP,
        subject: userId,
      },
    );

  createPreSignToken = (userId: string) =>
    this.jwtService.sign(
      {},
      { header: { typ: TOKEN_TYPES.PRE_SIGN }, subject: userId },
    );

  @Mutation(() => AuthResponse)
  async signUp(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    if (await this.usersService.existsWithUsername(input.username)) {
      throw new ConflictException('This username already exists.');
    }
    let user: User;
    if (!input._id) {
      user = await this.usersService.create({
        _id: v4(),
        username: input.username,
        avatar:
          input.avatarUrl ||
          `https://${configuration.images.bucket()}.s3.amazonaws.com/avatars/default.png`,
        ...(input.feedTags ? { feedTags: input.feedTags } : null),
      });
    } else {
      user = await this.usersService.updateUser(input._id, {
        username: input.username,
        avatar:
          input.avatarUrl ||
          `https://${configuration.images.bucket()}.s3.amazonaws.com/avatars/default.png`,
        ...(input.feedTags ? { feedTags: input.feedTags } : null),
      });
      if (!user)
        throw new NotFoundException(
          "Couldn't find a user with this id. Omit the id field or provide a valid id from a pre-signed user.",
        );
    }
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
      user: user._id,
    });
    return {
      me: user,
      token: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(user._id),
    };
  }

  @Mutation(() => PreSignResponse)
  async preSign(): Promise<PreSignResponse> {
    const user = await this.usersService.create({
      _id: v4(),
    });
    return {
      preSignToken: this.createPreSignToken(user._id),
      userId: user._id,
    };
  }

  @Mutation(() => AuthResponse)
  async logIn(
    @Args('username') username: string,
    @Args('password') password: string,
  ): Promise<AuthResponse> {
    const user = await this.usersService.findByUsername(username);

    if (!user) throw new NotFoundException('User not found.');

    const { salt, passwordHash } = await this.authService.findByUser(user._id);
    const loginPasswordHash = scryptSync(
      password,
      Buffer.from(salt, 'base64'),
      SCRYPT_KEYLEN,
    ).toString('base64');
    if (passwordHash !== loginPasswordHash)
      throw new NotFoundException('User not found.');

    return {
      me: user,
      token: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(user._id),
    };
  }

  @UseGuards(AuthGuard)
  @TokenTypes(TOKEN_TYPES.REFRESH)
  @Mutation(() => AuthResponse)
  async refreshToken(
    @CurrentToken() token: RefreshToken,
  ): Promise<AuthResponse> {
    const { sub } = token.payload;
    const user = await this.usersService.findById(sub);
    if (!user) throw new NotFoundException('User not found.');

    return {
      me: user,
      token: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(user._id),
    };
  }
}
