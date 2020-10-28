import * as dotenv from 'dotenv';

dotenv.config();

export default {
  port: () => parseInt(process.env.PORT, 10),
  database: {
    url: () => process.env.MONGO_URL,
  },
  auth: {
    secret: () => process.env.SECRET,
  },
};
