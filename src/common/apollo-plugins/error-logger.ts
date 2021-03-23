import { Logger } from '@nestjs/common';

const logger = new Logger('GraphqlModule');

export const errorLoggerPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(context) {
        if (
          context.error[0].message === 'Unauthorized' ||
          context.error[0].message === 'Forbidden resource'
        )
          return;
        logger.error({
          message: 'Graphql Error',
          errors: context.errors,
          query: context.source,
        });
      },
    };
  },
};
