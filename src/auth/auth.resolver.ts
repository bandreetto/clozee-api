import { HttpException, HttpStatus } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { User } from 'src/users/contracts/domain';
import { UsersService } from 'src/users/users.service';
import { SignUpInput } from './contracts/dto/inputs';
import { v4 } from 'uuid';
import { scryptSync, randomBytes } from 'crypto';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
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
      avatar: input.avatartUrl || 'https://picsum.photos/64/64',
    });
    const salt = randomBytes(16);
    const passwordHash = scryptSync(input.password, salt, 64).toString(
      'base64',
    );
    await this.authService.create({
      _id: v4(),
      passwordHash,
      salt: salt.toString('base64'),
      user: createdUser._id,
    });
    return createdUser;
  }
}
