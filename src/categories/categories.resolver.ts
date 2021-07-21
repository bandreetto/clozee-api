import { UseGuards } from '@nestjs/common';
import { Args, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { ascend } from 'ramda';
import { AuthGuard } from '../common/guards';
import { CategoriesLoader } from './categories.dataloader';
import { isOthersCategory } from './categories.logic';
import { CategoriesService } from './categories.service';
import { Category } from './contracts';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categoriesLoader: CategoriesLoader,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => [Category], { description: 'Returns all categories' })
  categories(@Args('roots', { nullable: true }) root: boolean): Promise<Category[]> {
    if (root) return this.categoriesService.findRootCategories();
    return this.categoriesService.find();
  }

  @ResolveField()
  async children(@Root() category: Category) {
    const categories = await this.categoriesLoader.byParent.load(category._id);
    const othersCat = categories.find(isOthersCategory);
    const sortedCategories = categories.sort(ascend(cat => cat.name));

    if (!othersCat) {
      return sortedCategories;
    }

    return [...sortedCategories.filter(cat => !isOthersCategory(cat)), othersCat];
  }

  @ResolveField()
  parent(@Root() category: Category) {
    if (typeof category.parent !== 'string') return category.parent;
    return this.categoriesLoader.load(category.parent);
  }

  @ResolveField()
  ancestrals(@Root() category: Category) {
    return this.categoriesService.findCategoryParents(category._id);
  }
}
