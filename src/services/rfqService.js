
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { isMachineAvailable } from './machineService';
import { getUserProfile } from './userService';

const RFQS_COLLECTION = 'rfqs';
const MACHINES_COLLECTION = 'machines';

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Wait until Firebase authentication is ready.
async function getCurrentUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();

        if (user) {
          resolve(user);
        } else {
          reject(new Error('Please log in to submit an RFQ.'));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

// Sort records newest first.
function sortNewest(items) {
  return items.sort((first, second) => {
    const firstTime =
      first.createdAt?.toMillis?.() || 0;

    const secondTime =
      second.createdAt?.toMillis?.() || 0;

    return secondTime - firstTime;
  });
}

// =====================================
// CREATE RFQ
// =====================================

export async function createRFQ(rfqData) {
  const seeker = await getCurrentUser();

  if (!rfqData.machineId) {
    throw new Error('Please select a machine.');
  }

  // Retrieve the selected machine from Firestore.
  const machineRef = doc(
    db,
    MACHINES_COLLECTION,
    rfqData.machineId
  );

  const machineSnapshot = await getDoc(machineRef);

  if (!machineSnapshot.exists()) {
    throw new Error('The selected machine does not exist.');
  }

  const machine = machineSnapshot.data();

  if (!machine.ownerUid) {
    throw new Error(
      'The selected machine does not have a valid provider.'
    );
  }
  if (!isMachineAvailable(machine)) {
    throw new Error('This machine is currently unavailable for new enquiries.');
  }

  // Retrieve the seeker's profile.
  const seekerProfile = await getUserProfile(seeker.uid);

  if (!seekerProfile.capabilities?.includes('seeker')) {
    throw new Error('Your account is not authorized to submit RFQs.');
  }
  if (machine.ownerUid === seeker.uid) {
    throw new Error('You cannot submit an enquiry for your own machine.');
  }
  if (!seekerProfile.companyId || !seekerProfile.companyName) {
    throw new Error('Complete your company profile before submitting an RFQ.');
  }
  if (!machine.companyId || !machine.providerName || !machine.providerCompanyName) {
    throw new Error(
      'This machine listing is missing provider details. Ask its owner to edit the listing before submitting an RFQ.'
    );
  }

  // Validate quantity.
  const quantity = Number(rfqData.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Enter a valid quantity greater than zero.');
  }

  // Validate optional budget.
  const budget =
    rfqData.budget === '' || rfqData.budget == null
      ? null
      : Number(rfqData.budget);

  if (
    budget !== null &&
    (!Number.isFinite(budget) || budget < 0)
  ) {
    throw new Error('Enter a valid budget.');
  }

  // Prepare the RFQ document.
  const newRFQ = {
    title: String(rfqData.title || '').trim(),

    machineId: rfqData.machineId,
    machineName: machine.name || '',
    machineCategory: machine.category || '',

    materialType: String(
      rfqData.materialType || ''
    ).trim(),

    quantity,
    quantityUnit: rfqData.quantityUnit || 'pieces',

    completionDate:
      rfqData.requiredCompletionDate || '',

    location: String(
      rfqData.manufacturingLocation || ''
    ).trim(),

    budget,

    description: String(
      rfqData.jobDescription || ''
    ).trim(),

    // Seeker information.
    seekerUid: seeker.uid,
    seekerName:
      seekerProfile.fullName ||
      seeker.displayName ||
      seeker.email ||
      '',

    companyId: seekerProfile.companyId,
    seekerCompanyName: seekerProfile.companyName,

    // Provider information from the selected machine.
    providerUid: machine.ownerUid,
    providerName: machine.providerName || '',
    providerCompanyId: machine.companyId || '',
    providerCompanyName: machine.providerCompanyName || '',

    // Attachments are not implemented yet.
    attachments: [],

    // New RFQs wait for the provider's decision.
    status: 'pending',

    // Firestore timestamps.
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Basic required-field validation.
  if (!newRFQ.title) {
    throw new Error('Enter an RFQ title.');
  }

  if (!newRFQ.materialType) {
    throw new Error('Enter the material type.');
  }

  if (!newRFQ.location) {
    throw new Error('Enter the manufacturing location.');
  }

  if (!newRFQ.description) {
    throw new Error('Enter the job description.');
  }

  if (!newRFQ.completionDate) {
    throw new Error('Select a completion date.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newRFQ.completionDate)) {
    throw new Error('Select a valid completion date.');
  }
  const completionDate = new Date(`${newRFQ.completionDate}T00:00:00.000Z`);
  if (
    Number.isNaN(completionDate.getTime()) ||
    completionDate.toISOString().slice(0, 10) !== newRFQ.completionDate
  ) {
    throw new Error('Select a valid completion date.');
  }
  if (newRFQ.completionDate < localDateString()) {
    throw new Error('Choose today or a future completion date.');
  }

  // Save the RFQ in Firestore.
  const rfqCollection = collection(
    db,
    RFQS_COLLECTION
  );

  const result = await addDoc(
    rfqCollection,
    newRFQ
  );

  console.log('RFQ successfully saved:', result.id);

  return result.id;
}

export async function decideRFQ(rfqId, decision, reason = '') {
  if (!['accepted', 'rejected'].includes(decision)) {
    throw new Error('Select a valid RFQ decision.');
  }
  if (!rfqId) {
    throw new Error('RFQ ID is required.');
  }

  const provider = await getCurrentUser();
  const profile = await getUserProfile(provider.uid);
  if (!profile.capabilities?.includes('provider')) {
    throw new Error('Your account is not authorized to decide RFQs.');
  }

  const rfqRef = doc(db, RFQS_COLLECTION, rfqId);
  const rfqSnapshot = await getDoc(rfqRef);
  if (!rfqSnapshot.exists()) {
    throw new Error('This RFQ does not exist.');
  }
  const rfq = rfqSnapshot.data();
  if (rfq.providerUid !== provider.uid) {
    throw new Error('You are not authorized to decide this RFQ.');
  }
  if (!['open', 'pending'].includes(rfq.status)) {
    throw new Error('This RFQ already has a provider decision.');
  }
  if (!rfq.machineId) {
    throw new Error('This RFQ does not reference a machine.');
  }

  const existingQuotations = await getDocs(query(
    collection(db, 'quotations'),
    where('rfqId', '==', rfqId),
    where('providerUid', '==', provider.uid)
  ));
  if (
    !existingQuotations.empty ||
    (Array.isArray(rfq.quotationIds) && rfq.quotationIds.length > 0)
  ) {
    throw new Error('This RFQ already has a quotation and cannot be changed.');
  }

  const machineRef = doc(db, MACHINES_COLLECTION, rfq.machineId);
  const remark = String(reason || '').trim();
  await runDecisionTransaction(rfqRef, machineRef, provider.uid, decision, remark);
}

async function runDecisionTransaction(rfqRef, machineRef, providerUid, decision, reason) {
  await runTransaction(db, async (transaction) => {
    const [rfqSnapshot, machineSnapshot] = await Promise.all([
      transaction.get(rfqRef),
      transaction.get(machineRef),
    ]);
    if (!rfqSnapshot.exists()) {
      throw new Error('This RFQ no longer exists.');
    }
    if (!machineSnapshot.exists() || machineSnapshot.data().ownerUid !== providerUid) {
      throw new Error('You do not own the machine assigned to this RFQ.');
    }

    const rfq = rfqSnapshot.data();
    if (rfq.providerUid !== providerUid) {
      throw new Error('You are not authorized to decide this RFQ.');
    }
    if (!['open', 'pending'].includes(rfq.status)) {
      throw new Error('This RFQ already has a provider decision.');
    }
    if (Array.isArray(rfq.quotationIds) && rfq.quotationIds.length) {
      throw new Error('This RFQ already has a quotation and cannot be changed.');
    }

    transaction.update(rfqRef, {
      status: decision,
      providerDecision: decision,
      providerDecisionAt: serverTimestamp(),
      providerDecisionBy: providerUid,
      providerRemarks: reason,
      rejectionReason: decision === 'rejected' ? reason : '',
      updatedAt: serverTimestamp(),
    });
    transaction.set(
      doc(db, 'notifications', `rfq_${decision}_${rfqRef.id}_${rfq.seekerUid}`),
      {
        recipientUid: rfq.seekerUid,
        type: decision === 'accepted' ? 'rfq_accepted' : 'rfq_rejected',
        title: decision === 'accepted' ? 'RFQ accepted by provider' : 'RFQ rejected by provider',
        message: decision === 'accepted'
          ? `Your RFQ ${rfq.title || rfqRef.id} was accepted.`
          : `Your RFQ ${rfq.title || rfqRef.id} was rejected${reason ? `: ${reason}` : '.'}`,
        rfqId: rfqRef.id,
        link: '/seeker/rfqs',
        read: false,
        createdAt: serverTimestamp(),
      }
    );
  });
}

// =====================================
// GET SEEKER'S RFQs
// =====================================

export async function getMyRFQs() {
  const seeker = await getCurrentUser();

  const rfqQuery = query(
    collection(db, RFQS_COLLECTION),
    where('seekerUid', '==', seeker.uid)
  );

  const snapshot = await getDocs(rfqQuery);

  const rfqs = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return sortNewest(rfqs);
}

// =====================================
// GET PROVIDER'S RECEIVED RFQs
// =====================================

export async function getProviderRFQs() {
  const provider = await getCurrentUser();

  const rfqQuery = query(
    collection(db, RFQS_COLLECTION),
    where('providerUid', '==', provider.uid)
  );

  const snapshot = await getDocs(rfqQuery);

  const rfqs = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return sortNewest(rfqs);
}

// =====================================
// GET SINGLE RFQ
// =====================================

export async function getRFQById(rfqId) {
  await getCurrentUser();

  if (!rfqId) {
    throw new Error('RFQ ID is required.');
  }

  const rfqRef = doc(
    db,
    RFQS_COLLECTION,
    rfqId
  );

  const snapshot = await getDoc(rfqRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

function subscribeToRFQs(field, onData, onError) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please log in to view RFQs.');
  }

  return onSnapshot(
    query(collection(db, RFQS_COLLECTION), where(field, '==', user.uid)),
    (snapshot) => onData(sortNewest(snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })))),
    onError
  );
}

export function subscribeToSeekerRFQs(onData, onError) {
  return subscribeToRFQs('seekerUid', onData, onError);
}

export function subscribeToProviderRFQs(onData, onError) {
  return subscribeToRFQs('providerUid', onData, onError);
}
