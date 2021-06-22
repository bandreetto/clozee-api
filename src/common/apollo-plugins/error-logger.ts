import { Logger } from '@nestjs/common';

const logger = new Logger('GraphqlModule');

export const errorLoggerPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(context) {
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
