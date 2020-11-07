import { UseGuards } from '@nestjs/common';
import { Args, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { AuthGuard } from 'src/common/guards';
import { CategoriesService } from './categories.service';
import { Category } from './contracts';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(AuthGuard)
  @Query(() => [Category], { description: 'Returns all categories' })
  categories(
    @Args('roots', { nullable: true }) root: boolean,
  ): Promise<Category[]> {
    if (root) return this.categoriesService.findRootCategories();
    return this.categoriesService.find();
  }

  @ResolveField()
  children(@Root() category: Category) {
    return this.categoriesService.find({ parent: category._id });
  }

  @ResolveField()
  parent(@Root() category: Category) {
    if (typeof category.parent !== 'string') return category.parent;
    return this.categoriesService.findById(category.parent);
  }

  @ResolveField()
  ancestrals(@Root() category: Category) {
    return this.categoriesService.findCategoryParents(category._id);
  }
}
