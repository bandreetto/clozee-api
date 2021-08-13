import { ConflictException, InternalServerErrorException, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { randomBytes, scryptSync } from 'crypto';
import { User } from '../users/contracts';
import { UsersService } from '../users/users.service';
import { v4 } from 'uuid';
import { AuthService } from './auth.service';
import { SignUpInput } from './contracts/inputs';
import { JwtService } from '@nestjs/jwt';
import configuration from '../config/configuration';
import { AuthResponse, PreSignResponse, RefreshToken } from './contracts';
import { TOKEN_TYPES } from './contracts/enums';
import { AuthGuard } from '../common/guards';
import { CurrentToken, TokenTypes } from '../common/decorators';
import { EventEmitter2 } from 'eventemitter2';
import { createAccessToken, createPreSignToken, createRefreshToken } from './auth.logic';

const SCRYPT_KEYLEN = 64;
const SALT_LEN = 16;

@Resolver()
export class AuthResolver {
  logger = new Logger(AuthResolver.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Mutation(() => AuthResponse)
  async signUp(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    if (await this.usersService.existsWithUsername(input.username)) {
      throw new ConflictException({
        message: 'This username already exists.',
        metadata: {
          _id: input._id,
          username: input.username,
        },
      });
    }
    const avatarUrl = input.avatarId
      ? `https://${configuration.images.cdn()}/avatars/${input.avatarId}.jpg`
      : input.avatarUrl;
    let user: User;
    const session = await this.usersService.startTransaction();
    try {
      if (!input._id) {
        user = await this.usersService.create(
          {
            _id: v4(),
            username: input.username,
            avatar: avatarUrl || `https://${configuration.images.cdn()}/avatars/default.jpg`,
            ...(input.feedTags ? { feedTags: input.feedTags } : null),
          },
          session,
        );
      } else {
        user = await this.usersService.updateUser(
          input._id,
          {
            username: input.username,
            avatar: avatarUrl || `https://${configuration.images.cdn()}/avatars/default.jpg`,
            ...(input.feedTags ? { feedTags: input.feedTags } : null),
          },
          session,
        );
        if (!user)
          throw new NotFoundException(
            "Couldn't find a user with this id. Omit the id field or provide a valid id from a pre-signed user.",
          );
      }
      const salt = randomBytes(SALT_LEN);
      const passwordHash = scryptSync(input.password, salt, SCRYPT_KEYLEN).toString('base64');
      await this.authService.create(
        {
          _id: v4(),
          passwordHash,
          salt: salt.toString('base64'),
          user: user._id,
        },
        session,
      );
      const response = {
        me: user,
        token: createAccessToken(user, configuration.auth.accessTokenExp(), this.jwtService),
        refreshToken: createRefreshToken(user._id, configuration.auth.accessTokenExp(), this.jwtService),
      };
      await this.usersService.commitTransaction(session);
      return response;
    } catch (error) {
      this.usersService.abortTransaction(session);
      this.logger.error({
        message: 'An error occoured while trying to signup a new user.',
        error: error.toString(),
        metadata: {
          error,
          preSignId: input._id,
          username: input.username,
          feedTags: input.feedTags,
          avatarId: input.avatarId,
        },
      });
      throw new InternalServerErrorException('An error occoured while trying to signup a new user.');
    }
  }

  @Mutation(() => PreSignResponse)
  async preSign(): Promise<PreSignResponse> {
    const user = await this.usersService.create({
      _id: v4(),
    });
    await this.eventEmitter.emitAsync('user.preSigned', user._id);
    return {
      preSignToken: createPreSignToken(user._id, this.jwtService),
      userId: user._id,
    };
  }

  @Mutation(() => AuthResponse)
  async logIn(@Args('username') username: string, @Args('password') password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByUsername(username);

    if (!user) throw new NotFoundException('User not found.');

    const { salt, passwordHash } = await this.authService.findByUser(user._id);
    const loginPasswordHash = scryptSync(password, Buffer.from(salt, 'base64'), SCRYPT_KEYLEN).toString('base64');
    if (passwordHash !== loginPasswordHash) throw new NotFoundException('User not found.');

    return {
      me: user,
      token: createAccessToken(user, configuration.auth.accessTokenExp(), this.jwtService),
      refreshToken: createRefreshToken(user._id, configuration.auth.refreshTokenExp(), this.jwtService),
    };
  }

  @UseGuards(AuthGuard)
  @TokenTypes(TOKEN_TYPES.REFRESH)
  @Mutation(() => AuthResponse)
  async refreshToken(@CurrentToken() token: RefreshToken): Promise<AuthResponse> {
    const { sub } = token.payload;
    const user = await this.usersService.findById(sub);
    if (!user) throw new NotFoundException('User not found.');

    return {
      me: user,
      token: createAccessToken(user, configuration.auth.accessTokenExp(), this.jwtService),
      refreshToken: createRefreshToken(user._id, configuration.auth.refreshTokenExp(), this.jwtService),
    };
  }
}
