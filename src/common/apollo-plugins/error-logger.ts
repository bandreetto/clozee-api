import { Logger } from '@nestjs/common';

const logger = new Logger('GraphqlModule');

export const errorLoggerPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(context) {
        logger.error({
          message: 'Graphql Error',
          errors: context.errors,
          query: context.source,
        });
      },
    };
  },
};
