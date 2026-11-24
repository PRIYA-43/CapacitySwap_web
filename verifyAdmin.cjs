const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./capacityswift-firebase-adminsdk-fbsvc-8ff55163ca.json");

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

// Your NEW admin account UID
const ADMIN_UID = "wy5NRc9c3TY1CGgsw8oIRb11MVo1";

async function verifyAdmin() {
  try {
    const auth = getAuth();

    // Verify the admin account's email
    await auth.updateUser(ADMIN_UID, {
      emailVerified: true,
    });

    // Assign admin permission
    await auth.setCustomUserClaims(ADMIN_UID, {
      admin: true,
    });

    // Confirm changes
    const user = await auth.getUser(ADMIN_UID);

    console.log("✅ Admin setup successful!");
    console.log("Email:", user.email);
    console.log("Email verified:", user.emailVerified);
    console.log("Admin claim:", user.customClaims);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyAdmin();