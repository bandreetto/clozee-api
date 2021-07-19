import faker from 'faker';
import { Model, Document } from 'mongoose';
import { CategoriesService } from '../../src/categories/categories.service';
import { Category } from '../../src/categories/contracts';

export interface GivenCategories {
  oneCategoryRegistered: () => Promise<Category>;
}

export function givenCategoriesFactory(categoriesService: CategoriesService): GivenCategories {
  function oneCategoryRegisteredFactory(categoryModel: Model<Category & Document>) {
    return async (): Promise<Category> => {
      const grandFatherCategory: Category = {
        _id: faker.datatype.uuid(),
        name: faker.commerce.productAdjective(),
      };
      const fatherCategory: Category = {
        _id: faker.datatype.uuid(),
        name: faker.commerce.productAdjective(),
        parent: grandFatherCategory._id,
      };
      const category: Category = {
        _id: faker.datatype.uuid(),
        name: faker.commerce.productAdjective(),
        parent: fatherCategory._id,
      };

      const categories = await categoryModel.insertMany([category, fatherCategory, grandFatherCategory]);
      const createdCategory = categories.map(c => c.toObject()).find(c => c._id === category._id);
      return createdCategory;
    };
  }

  const categoryModel = (categoriesService as any).categoryModel;
  return {
    oneCategoryRegistered: oneCategoryRegisteredFactory(categoryModel),
  };
}
