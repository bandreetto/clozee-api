import { S3 } from 'aws-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

export const S3Client = new S3();
