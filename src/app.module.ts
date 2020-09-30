import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://backend-marketplace:wHWmBqlposg24Q0G@marketplace-staging.bubxc.gcp.mongodb.net/marketplace?retryWrites=true&w=majority',
      {
        useFindAndModify: true,
        useNewUrlParser: true,
      },
    ),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    UsersModule,
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
