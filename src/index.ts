import { ApolloServer } from "apollo-server-express";
import compression from "compression";
import cors from "cors";
import express from "express";
import depthLimit from "graphql-depth-limit";
import { createServer } from "http";
import { connect } from "mongoose";
import "reflect-metadata";
import { createSchema } from "./createSchema";

const startServer = async () => {
  const mongoose = await connect(
    "mongodb+srv://backend-marketplace:wHWmBqlposg24Q0G@marketplace-staging.bubxc.gcp.mongodb.net/marketplace?retryWrites=true&w=majority",
    { useNewUrlParser: true }
  );
  await mongoose.connection;

  console.log(`\n🍃 Mongo Connected`);

  const app = express();
  const schema = await createSchema();

  const server = new ApolloServer({
    schema,
    validationRules: [depthLimit(7)],
  });

  app.use("*", cors());
  app.use(compression());

  server.applyMiddleware({ app, path: "/graphql" });

  const httpServer = createServer(app);

  httpServer.listen({ port: 1212 }, (): void =>
    console.log(`\n🚀 GraphQL is now running on http://localhost:1212/graphql`)
  );
};

startServer().catch((e) => {
  console.error(e);
});
