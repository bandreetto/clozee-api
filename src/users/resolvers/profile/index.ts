import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { User, UserModel } from "./types";

@Resolver(User)
export class UserResolver {
  constructor() {}

  @Query((returns) => User)
  async user(): Promise<User> {
    const user: User = await UserModel.findOne({});
    return {
      id: user.id,
      name: user.name,
      sellingProducts: user.sellingProducts,
    };
  }

  @Mutation((returns) => User)
  //   @Authorized()
  async addPost(@Arg("url") photoUrl: string): Promise<User> {
    const updatedUser = await UserModel.update({
      $push: { sellingProducts: photoUrl },
    });

    return await UserModel.findOne({});
  }
}
