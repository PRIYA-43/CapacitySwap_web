// src/services/bookingService.js

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const BOOKINGS_COLLECTION = 'bookings';

function newestFirst(items) {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

function subscribe(field, onData, onError) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in to view bookings.');
  }

  return onSnapshot(
    query(
      collection(db, BOOKINGS_COLLECTION),
      where(field, '==', user.uid)
    ),
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        bookingId: item.data().bookingId || item.id,
        ...item.data(),
      }));

      onData(newestFirst(items));
    },
    onError
  );
}

export function subscribeToSeekerBookings(onData, onError) {
  return subscribe('seekerUid', onData, onError);
}

export function subscribeToProviderBookings(onData, onError) {
  return subscribe('providerUid', onData, onError);
}