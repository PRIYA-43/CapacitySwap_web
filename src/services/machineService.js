
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { getUserProfile } from './userService';

const MACHINES_COLLECTION = 'machines';

export function isMachineAvailable(machine) {
  return machine?.availabilityStatus === undefined ||
    machine.availabilityStatus === 'available';
}

export function getMachineAvailabilityStatus(machine) {
  return isMachineAvailable(machine) ? 'available' : 'unavailable';
}

async function getCurrentUser() {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) resolve(user);
        else reject(new Error('Please log in to manage machines.'));
      },
      reject
    );
  });
}

// Fetch machines belonging to the logged-in provider.
export async function getMyMachines() {
  const user = await getCurrentUser();

  const machinesQuery = query(
    collection(db, MACHINES_COLLECTION),
    where('ownerUid', '==', user.uid)
  );

  const snapshot = await getDocs(machinesQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })).sort((a, b) => {
    const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
    const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
    return dateB - dateA;
  });
}

export function subscribeToMyMachines(onData, onError) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please log in to view your machines.');
  }

  return onSnapshot(
    query(collection(db, MACHINES_COLLECTION), where('ownerUid', '==', user.uid)),
    (snapshot) => {
      const machines = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })).sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      });
      onData(machines);
    },
    onError
  );
}

// Fetch all machines for the seeker marketplace.
export async function getMarketplaceMachines() {
  const snapshot = await getDocs(
    collection(db, MACHINES_COLLECTION)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })).sort((a, b) => {
    const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
    const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
    return dateB - dateA;
  });
}

// Create machine.
export async function createMachine(machineData) {
  const user = await getCurrentUser();
  const profile = await getUserProfile(user.uid);
  const companyId = profile.companyId;
  const providerName = profile.fullName || user.displayName || user.email || '';

  if (!companyId || !profile.companyName || !providerName) {
    throw new Error('Complete your provider profile before listing a machine.');
  }

  const newMachine = {
    ownerUid: user.uid,
    companyId,
    providerName,
    providerCompanyName: profile.companyName,
    reviewStatus: 'Pending Review',
    availabilityStatus: 'available',
    availabilityUpdatedAt: serverTimestamp(),
    availabilityUpdatedBy: user.uid,
    name: machineData.name.trim(),
    category: machineData.category,
    manufacturer: machineData.manufacturer.trim(),
    model: machineData.model.trim(),
    description: machineData.description || '',
    materials: machineData.materials || [],
    location: machineData.location.trim(),
    hours: Number(machineData.hours),
    rate: Number(machineData.rate),
    availability: machineData.availability || 'Available',
    schedule: machineData.schedule || [],
    image: machineData.image || '',
    images: machineData.images || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const result = await addDoc(
    collection(db, MACHINES_COLLECTION),
    newMachine
  );

  return result.id;
}

// Update machine.
export async function updateMachine(machineId, machineData) {
  const user = await getCurrentUser();
  const profile = await getUserProfile(user.uid);
  const machineRef = doc(db, MACHINES_COLLECTION, machineId);
  const providerName = profile.fullName || user.displayName || user.email || '';

  if (!profile.companyId || !profile.companyName || !providerName) {
    throw new Error('Complete your provider profile before updating a machine.');
  }

  const snapshot = await getDoc(machineRef);

  if (!snapshot.exists() || snapshot.data().ownerUid !== user.uid) {
    throw new Error('Machine not found or permission denied.');
  }

  await updateDoc(machineRef, {
    providerName,
    providerCompanyName: profile.companyName,
    name: machineData.name.trim(),
    category: machineData.category,
    manufacturer: machineData.manufacturer.trim(),
    model: machineData.model.trim(),
    description: machineData.description || '',
    materials: machineData.materials || [],
    location: machineData.location.trim(),
    hours: Number(machineData.hours),
    rate: Number(machineData.rate),
    availability: machineData.availability || 'Available',
    schedule: machineData.schedule || [],
    image: machineData.image || '',
    images: machineData.images || [],
    updatedAt: serverTimestamp(),
  });

  return machineId;
}

export async function updateMachineAvailability(machineId, status) {
  if (!['available', 'unavailable'].includes(status)) {
    throw new Error('Select a valid machine availability status.');
  }

  const user = await getCurrentUser();
  const profile = await getUserProfile(user.uid);
  if (!profile.capabilities?.includes('provider')) {
    throw new Error('Your account is not authorized to manage machine availability.');
  }
  if (!machineId) {
    throw new Error('Machine ID is required.');
  }

  const machineRef = doc(db, MACHINES_COLLECTION, machineId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(machineRef);
    if (!snapshot.exists() || snapshot.data().ownerUid !== user.uid) {
      throw new Error('Machine not found or permission denied.');
    }

    transaction.update(machineRef, {
      availabilityStatus: status,
      availabilityUpdatedAt: serverTimestamp(),
      availabilityUpdatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  });

  return status;
}

// Delete machine.
export async function deleteMachine(machineId) {
  const user = await getCurrentUser();
  const machineRef = doc(db, MACHINES_COLLECTION, machineId);

  const snapshot = await getDoc(machineRef);

  if (!snapshot.exists() || snapshot.data().ownerUid !== user.uid) {
    throw new Error('Machine not found or permission denied.');
  }

  await deleteDoc(machineRef);
}
// Fetch one machine by its ID.
export async function getMachineById(machineId) {
  const machineRef = doc(db, MACHINES_COLLECTION, machineId);
  const snapshot = await getDoc(machineRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export function subscribeToMachine(machineId, onData, onError) {
  if (!machineId) {
    throw new Error('Machine ID is required.');
  }

  return onSnapshot(
    doc(db, MACHINES_COLLECTION, machineId),
    (snapshot) => {
      onData(snapshot.exists()
        ? { id: snapshot.id, ...snapshot.data() }
        : null);
    },
    onError
  );
}

// Subscribe to live marketplace changes.
export function subscribeToMarketplaceMachines(onData, onError) {
  const machinesQuery = query(collection(db, MACHINES_COLLECTION));

  return onSnapshot(
    machinesQuery,
    (snapshot) => {
      const machines = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })).sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      });

      onData(machines);
    },
    onError
  );
}