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
  firebase: {
    projectId: () => process.env.FIREBASE_PROJECT_ID,
    privateKey: () => process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: () => process.env.FIREBASE_CLIENT_EMAIL,
  },
};
