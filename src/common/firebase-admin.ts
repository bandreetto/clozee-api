import { credential, initializeApp } from 'firebase-admin';
import configuration from '../config/configuration';

export const admin = initializeApp({
  credential: credential.cert({
    projectId: configuration.firebase.projectId(),
    privateKey: configuration.firebase.privateKey(),
    clientEmail: configuration.firebase.clientEmail(),
  }),
});
