
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { auth } from '../firebase/firebase';

// Google authentication provider
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Register using email and password
export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await sendEmailVerification(userCredential.user);

  return userCredential.user;
};

// Login using email and password
export const loginUser = async (email, password, remember = true) => {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  await userCredential.user.reload();

  return userCredential.user;
};

// Login using Google
export const loginWithGoogle = async (remember = true) => {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );

  const userCredential = await signInWithPopup(
    auth,
    googleProvider
  );

  return userCredential.user;
};

// Logout user
export const logoutUser = async () => {
  await signOut(auth);
};

// Send password reset email
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
