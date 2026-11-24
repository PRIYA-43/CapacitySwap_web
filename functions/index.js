const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Only this verified account is allowed to become an administrator.
const ADMIN_EMAIL = "priyadharshini689ram@gmail.com";

exports.grantAdminRole = onCall(async (request) => {
  // Ensure the caller is signed in.
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to perform this action."
    );
  }

  // Ensure the caller's email is verified.
  const email = request.auth.token.email;
  const emailVerified = request.auth.token.email_verified;

  if (!email || !emailVerified) {
    throw new HttpsError(
      "permission-denied",
      "A verified email account is required."
    );
  }

  // Allow only the designated admin email.
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new HttpsError(
      "permission-denied",
      "You are not authorized to become an administrator."
    );
  }

  // Assign the administrator custom claim securely on the server.
  await getAuth().setCustomUserClaims(request.auth.uid, {
    admin: true,
  });

  return {
    success: true,
    message: "Administrator role granted successfully.",
  };
});

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

exports.sendNotificationEmail = onDocumentCreated(
  {
    document: "notifications/{notificationId}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const apiKey = RESEND_API_KEY.value();
    if (!apiKey) {
      await event.data.ref.set(
        { emailStatus: "not_configured" },
        { merge: true }
      );
      return;
    }

    try {
      const user = await getAuth().getUser(notification.recipientUid);
      if (!user.email) {
        await event.data.ref.set(
          { emailStatus: "missing_recipient_email" },
          { merge: true }
        );
        return;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CapacitySwap <onboarding@resend.dev>",
          to: [user.email],
          subject: notification.title,
          text: notification.message,
        }),
      });

      await event.data.ref.set(
        {
          emailStatus: response.ok ? "sent" : "failed",
          emailSentAt: response.ok ? new Date() : null,
        },
        { merge: true }
      );
    } catch (error) {
      await event.data.ref.set(
        { emailStatus: "failed", emailError: String(error?.message || error) },
        { merge: true }
      );
    }
  }
);