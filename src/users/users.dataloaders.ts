import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from 'src/common/reconciliators';
import { PaymentMethod, SavedPost, User } from './contracts';
import { UsersService } from './users.service';

@Injectable({ scope: Scope.REQUEST })
export class UsersLoader extends DataLoader<string, User> {
  constructor(private readonly usersService: UsersService) {
    super((ids: string[]) =>
      this.usersService
        .findManyByIds(ids)
        .then(users => reconciliateByKey('_id', ids, users)),
    );
  }

  savedPosts = new DataLoader<string, SavedPost[]>((userIds: string[]) =>
    this.usersService
      .findManySavedPosts(userIds)
      .then(savedPosts =>
        userIds.map(userId =>
          savedPosts.filter(savedPost => savedPost.user === userId),
        ),
      ),
  );

  paymentMethods = new DataLoader<string, PaymentMethod[]>(
    (userIds: string[]) =>
      this.usersService
        .findManyPaymentMethods(userIds)
        .then(paymentMethods =>
          userIds.map(userId =>
            paymentMethods.filter(
              paymentMethod => paymentMethod.user === userId,
            ),
          ),
        ),
  );
}
