import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { AccessToken } from 'src/auth/contracts';

@ObjectType()
export class PageInfo {
  @Field({ description: 'The first cursor of this page.', nullable: true })
  startCursor: string;
  @Field({ description: 'The last cursor of this page.', nullable: true })
  endCursor: string;
  @Field({
    description:
      'A boolean indicating if there are more edges after this page.',
  })
  hasNextPage: boolean;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

@ArgsType()
export class PaginationArgs {
  @Field({
    description: 'The first N elements to return after the cursor.',
  })
  first: number;
  @Field({
    description: 'Only return edges after this cursor.',
    nullable: true,
  })
  after?: string;
}

export interface TokenUser {
  _id: string;
  username?: string;
}

export interface AuthorizedConnectionContext {
  connection: {
    context: {
      token: AccessToken;
    };
  };
}

export interface TransactionableService<SessionType> {
  startTransaction(): Promise<SessionType>;

  commitTransaction(session: SessionType): Promise<void>;

  abortTransaction(session: SessionType): Promise<void>;
}

@ObjectType()
export class UploadImageResponse {
  @Field({
    description: 'The id of the image. Used later to reference this image.',
  })
  imageId: string;

  @Field({ description: 'The signed url to allow the upload of the image.' })
  signedUrl: string;
}
