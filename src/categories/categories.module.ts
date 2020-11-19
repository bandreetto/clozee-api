import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesLoader } from './categories.dataloader';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './contracts';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
  ],
  providers: [CategoriesResolver, CategoriesService, CategoriesLoader],
  exports: [CategoriesService, CategoriesLoader],
})
export class CategoriesModule {}
