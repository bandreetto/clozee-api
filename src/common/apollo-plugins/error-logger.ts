import { Logger } from '@nestjs/common';
import { GraphQLRequestContext } from 'apollo-server-core';

const logger = new Logger('GraphqlModule');

export const errorLoggerPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(context: GraphQLRequestContext) {
        if (context.errors[0].message === 'Unauthorized' || context.errors[0].message === 'Forbidden resource') return;

        if (
          context.errors[0].message === 'This username already exists.' ||
          context.errors[0].message === 'User not found.'
        ) {
          return logger.warn({
            message: 'Graphql Warning',
            warnings: context.errors,
            query: context.source,
          });
        }
        logger.error({
          message: 'Graphql Error',
          errors: context.errors,
          query: context.source,
        });
      },
    };
  },
};
