
import {
  doc,
  collection,
  writeBatch,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// Create user and company profiles during registration
export const createUserProfile = async (uid, profile) => {
  const batch = writeBatch(db);

  // Generate a company document ID
  const companyRef = doc(collection(db, "companies"));

  // User document uses Firebase Authentication UID
  const userRef = doc(db, "users", uid);

  // Save company details
  batch.set(companyRef, {
    companyName: profile.company,
    address: profile.address,
    businessType: profile.businessType,
    phone: profile.phone,
    ownerUid: uid,
    verificationStatus: "pending",
    createdAt: serverTimestamp()
  });

  // Save user details
  batch.set(userRef, {
    uid,
    fullName: profile.name,
    email: profile.email,
    phone: profile.phone,
    companyId: companyRef.id,
    capabilities: ["provider", "seeker"],
    defaultWorkspace: profile.role,
    status: "active",
    emailVerified: false,
    createdAt: serverTimestamp()
  });

  await batch.commit();

  return {
    userId: uid,
    companyId: companyRef.id
  };
};

// Retrieve user profile during login
export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("User profile not found.");
  }

  const userData = userSnapshot.data();

  const companyRef = doc(db, "companies", userData.companyId);
  const companySnapshot = await getDoc(companyRef);

  if (!companySnapshot.exists()) {
    throw new Error("Company profile not found.");
  }

  const companyData = companySnapshot.data();

  return {
    ...userData,
    companyName: companyData.companyName,
    companyAddress: companyData.address,
    businessType: companyData.businessType
  };
};
