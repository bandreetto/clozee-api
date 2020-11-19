import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from 'src/common/reconciliators';
import { CategoriesService } from './categories.service';
import { Category } from './contracts';

@Injectable({ scope: Scope.REQUEST })
export class CategoriesLoader extends DataLoader<string, Category> {
  constructor(private readonly categoriesService: CategoriesService) {
    super((ids: string[]) =>
      this.categoriesService
        .findManyByIds(ids)
        .then(categories => reconciliateByKey('_id', ids, categories)),
    );
  }

  /**
   * Load categories by parent id
   */
  byParent = new DataLoader<string, Category[]>((parentIds: string[]) =>
    this.categoriesService
      .findByParents(parentIds)
      .then(categories =>
        parentIds.map(parentId =>
          categories.filter(category => category.parent === parentId),
        ),
      ),
  );
}
