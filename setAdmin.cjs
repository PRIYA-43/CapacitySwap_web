
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./capacityswift-firebase-adminsdk-fbsvc-8ff55163ca.json");

initializeApp({
  credential: cert(serviceAccount),
});

// Keep your existing Admin user's UID here
const ADMIN_UID = "wy5NRc9c3TY1CGgsw8oIRb11MVo1";

async function makeAdmin() {
  try {
    await getAuth().setCustomUserClaims(ADMIN_UID, {
      admin: true,
    });

    console.log("Admin role successfully assigned!");
    console.log("Admin UID:", ADMIN_UID);
  } catch (error) {
    console.error("Failed to assign admin role:", error);
  } finally {
    process.exit();
  }
}

makeAdmin();
