import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Category } from 'src/categories/contracts';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category & Document>,
  ) {}

  async find(filters?: Partial<Category>): Promise<Category[]> {
    return this.categoryModel.find(filters).lean();
  }

  async findById(id: string): Promise<Category> {
    return this.categoryModel.findById(id).lean();
  }

  async findManyByIds(ids: string[]): Promise<Category[]> {
    return this.categoryModel.find({ _id: { $in: ids } }).lean();
  }

  async findRootCategories(): Promise<Category[]> {
    return this.categoryModel
      .find({
        parent: { $exists: false },
      })
      .lean();
  }

  async findCategoryParents(childCategoryId: string): Promise<Category[]> {
    const [parentCategories] = await this.categoryModel.aggregate([
      {
        $match: {
          _id: childCategoryId,
        },
      },
      {
        $graphLookup: {
          from: 'categories',
          connectFromField: 'parent',
          connectToField: '_id',
          startWith: '$parent',
          as: 'ancestrality',
        },
      },
    ]);
    return parentCategories.ancestrality;
  }
}
