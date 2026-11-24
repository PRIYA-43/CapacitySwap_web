import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export function subscribeToNotifications(onData, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please log in to view notifications.');
  return onSnapshot(
    query(collection(db, 'notifications'), where('recipientUid', '==', user.uid)),
    (snapshot) => onData([...snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }))].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))),
    onError
  );
}

export async function markNotificationRead(notificationId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please log in to update notifications.');
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}
