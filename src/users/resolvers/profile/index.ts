import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { User } from "./types";

@Resolver(User)
export class UserResolver {
  constructor() {}

  @Query((returns) => User)
  async user(): Promise<User> {
    return {
      id: "1",
      name: "Daniel",
      selling_products: ["teste"],
    };
  }

  @Mutation((returns) => String)
  //   @Authorized()
  addPost(@Arg("url") photoUrl: string, @Ctx("user") user: User): string {
    return "adicionado";
  }
}
