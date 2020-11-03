export default {
  port: () => parseInt(process.env.PORT, 10),
  database: {
    url: () => process.env.MONGO_URL,
  },
  auth: {
    secret: () => process.env.SECRET,
  },
  images: {
    bucket: () => process.env.IMAGES_BUCKET,
  },
};
