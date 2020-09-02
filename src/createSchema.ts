import { buildSchema } from "type-graphql";
import { UserResolver } from "./users/resolvers/profile/index";

export const createSchema = async () =>
  await buildSchema({
    resolvers: [UserResolver],
  });
