import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExploreCategory, ExploreCategorySchema } from './contracts';
import { ExploreResolver } from './explore.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ExploreCategory.name,
        schema: ExploreCategorySchema,
      },
    ]),
  ],
  providers: [ExploreResolver],
})
export class ExploreModule {}
