import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { UsersService } from 'src/users/users.service';
import { LikesService } from '../likes/likes.service';
import { PostsService } from '../posts/posts.service';
import { admin } from '../common/firebase-admin';

@Injectable()
export class NotificationTasks {
  logger = new Logger(NotificationTasks.name);

  constructor(
    private readonly likesService: LikesService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Cron('* * */2 * * *')
  async sendLikePushNotifications() {
    try {
      this.logger.log('Sending like pushes to post owners');
      const twoHoursAgo = dayjs().subtract(2, 'hours').toDate();
      const last2hoursLikes = await this.likesService.findLikesAfter(twoHoursAgo);
      const [posts, likers] = await Promise.all([
        this.postsService.findManyByIds(last2hoursLikes.map(l => l.post as string)),
        this.usersService.findManyByIds(last2hoursLikes.map(l => l.user as string)),
      ]);
      const postOwners = await this.usersService.findManyByIds(posts.map(p => p.user as string));
      const fcmNotifications = postOwners
        .filter(postOwner => postOwner.deviceToken)
        .map(postOwner => {
          const post = posts.find(p => p.user === postOwner._id);
          const likes = last2hoursLikes.filter(l => l.post === post._id);
          const [oneOfTheLikers, ...otherLikers] = likers.filter(liker => likes.some(like => like.user === liker._id));
          let body: string;
          if (otherLikers.length === 0) body = `@${oneOfTheLikers.username} curtiu seu post`;
          if (otherLikers.length === 1)
            body = `@${oneOfTheLikers.username} e ${otherLikers[1].username} curtiram seu post`;
          else body = `@${oneOfTheLikers.username} e outras ${otherLikers.length} pessoas curtiram seu post`;
          return {
            token: postOwner.deviceToken,
            notification: {
              title: 'Uauuuuuu 🤩',
              body,
            },
          };
        });
      if (!fcmNotifications.length) return this.logger.log('No likes found. Skipping fcm request.');
      await admin.messaging().sendAll(fcmNotifications);
    } catch (error) {
      this.logger.error({
        message: 'An error occoured while sending like push notifications.',
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
