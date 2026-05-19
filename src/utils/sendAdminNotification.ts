import * as admin from "firebase-admin";
import { messaging } from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
let firebaseInitialized = false;

if (firebaseServiceAccount) {
  try {
    const firebaseConfig = JSON.parse(
      Buffer.from(firebaseServiceAccount, "base64").toString("utf8"),
    );
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
    firebaseInitialized = true;
  } catch (e) {
    console.warn("[Firebase] Failed to initialize — push notifications disabled:", e);
  }
} else {
  console.warn("[Firebase] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled in local dev");
}

export const sendAdminNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: {},
) => {
  if (!firebaseInitialized) return;

  const message: messaging.Message = {
    notification: {
      title: title,
      body: body,
    },
    token: fcmToken,
    data,
    android: {
      notification: {
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  admin
    .messaging()
    .send(message)
    .then((response: string) => {
      console.log("Notification sent successfully:", response);
    })
    .catch((error: Error) => {
      console.log("Error sending notification:", error);
    });
};
