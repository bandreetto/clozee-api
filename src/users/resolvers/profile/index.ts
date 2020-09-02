import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
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

  @Mutation((returns) => String)
  //   @Authorized()
  addPost(@Arg("url") photoUrl: string, @Ctx("user") user: User): string {
    return "adicionado";
  }
}
