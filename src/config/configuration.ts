export default {
  port: () => parseInt(process.env.PORT, 10),
  database: {
    url: () => process.env.MONGO_URL,
  },
  auth: {
    secret: () => process.env.SECRET,
    accessTokenExp: () => process.env.ACCESS_TOKEN_EXP,
    refreshTokenExp: () => process.env.REFRESH_TOKEN_EXP,
  },
  images: {
    bucket: () => process.env.IMAGES_BUCKET,
    cdn: () => process.env.IMAGES_CDN,
  },
  firebase: {
    projectId: () => process.env.FIREBASE_PROJECT_ID,
    privateKey: () => process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: () => process.env.FIREBASE_CLIENT_EMAIL,
  },
  sendgrid: {
    key: () => process.env.SENDGRID_API_KEY,
    sandbox: () => process.env.SANDBOX_MODE !== 'false',
  },
  menv: {
    apiUrl: () => process.env.MELHOR_ENVIO_API,
    token: () => process.env.MELHOR_ENVIO_TOKEN,
    appName: () => process.env.MELHOR_ENVIO_APP_NAME,
    contactMail: () => process.env.MELHOR_ENVIO_CONTACT_MAIL,
  },
  pagarme: {
    recipientId: () => process.env.CLOZEE_RECIPIENT_ID,
    token: () => process.env.PAGARME_API_TOKEN,
    postbackOrders: () => process.env.PAGARME_POSTBACK_ORDERS,
    postbackTransactions: () => process.env.PAGARME_POSTBACK_TRANSACTIONS,
  },
  redis: {
    url: () => process.env.REDIS_URL,
  },
  concurrency: {
    workers: () => process.env.WEB_CONCURRENCY,
  },
  cms: {
    url: () => process.env.CLOZEE_CMS_URL,
    identifier: () => process.env.CLOZEE_CMS_IDENTIFIER,
    password: () => process.env.CLOZEE_CMS_PASSWORD,
    cdn: () => process.env.CLOZEE_CMS_CDN,
  },
};
