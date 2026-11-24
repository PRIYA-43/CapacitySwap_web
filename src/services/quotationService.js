
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '../firebase/firebase';
import { getUserProfile } from './userService';

const QUOTATIONS_COLLECTION = 'quotations';
const RFQS_COLLECTION = 'rfqs';
const MACHINES_COLLECTION = 'machines';
const BOOKINGS_COLLECTION = 'bookings';
const TRACKING_COLLECTION = 'jobTracking';
const NOTIFICATIONS_COLLECTION = 'notifications';

async function getCurrentUser() {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) resolve(user);
        else reject(new Error('Please log in to manage quotations.'));
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

function normalizeStatus(status) {
  const value = String(status || 'submitted').toLowerCase();
  if (value === 'received') return 'submitted';
  if (value === 'not selected') return 'not_selected';
  return value;
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function normalizeQuotation(snapshot) {
  const data = snapshot.data();
  const deliveryDays = data.deliveryDays;

  return {
    id: snapshot.id,
    quotationId: data.quotationId || snapshot.id,
    ...data,
    rfqTitle: data.rfqTitle || data.requirementTitle || data.title || '',
    offeredPrice: data.offeredPrice ?? data.price ?? null,
    priceUnit: data.priceUnit || 'total',
    estimatedDelivery:
      data.estimatedDelivery ||
      data.deliveryTime ||
      (deliveryDays ? `${deliveryDays} days` : ''),
    deliveryDate: data.deliveryDate || '',
    materialDetails:
      data.materialDetails || data.manufacturingDetails || data.description || '',
    terms: data.additionalTerms || data.terms || '',
    validityDate: data.validityDate || data.validUntil || '',
    providerRemarks: data.providerRemarks || '',
    providerCompanyName: data.providerCompanyName || '',
    seekerCompanyName: data.seekerCompanyName || '',
    seekerCompanyId: data.seekerCompanyId || '',
    machineName: data.machineName || '',
    status: normalizeStatus(data.status),
  };
}

function sortNewest(items) {
  return items.sort((first, second) => {
    const firstTime = first.createdAt?.toMillis?.() || 0;
    const secondTime = second.createdAt?.toMillis?.() || 0;
    return secondTime - firstTime;
  });
}

function mapSnapshot(snapshot) {
  return sortNewest(snapshot.docs.map(normalizeQuotation));
}

async function enrichQuotations(quotations) {
  const missingRfqIds = [
    ...new Set(
      quotations
        .filter((quotation) => !quotation.rfqTitle || !quotation.seekerCompanyName)
        .map((quotation) => quotation.rfqId)
        .filter(Boolean)
    ),
  ];

  const rfqSnapshots = await Promise.all(
    missingRfqIds.map((rfqId) => getDoc(doc(db, RFQS_COLLECTION, rfqId)))
  );

  const rfqs = new Map(
    rfqSnapshots
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) => [snapshot.id, snapshot.data()])
  );

  return quotations.map((quotation) => {
    const rfq = rfqs.get(quotation.rfqId);

    return {
      ...quotation,
      rfqTitle: quotation.rfqTitle || rfq?.title || '',
      seekerCompanyName:
        quotation.seekerCompanyName || rfq?.seekerCompanyName || '',
    };
  });
}

function quotationQuery(field, uid) {
  return query(
    collection(db, QUOTATIONS_COLLECTION),
    where(field, '==', uid)
  );
}

function subscribeToQuotations(field, onData, onError) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in to view quotations.');
  }

  let version = 0;

  return onSnapshot(
    quotationQuery(field, user.uid),
    (snapshot) => {
      const currentVersion = ++version;

      enrichQuotations(mapSnapshot(snapshot))
        .then((items) => {
          if (currentVersion === version) onData(items);
        })
        .catch(onError);
    },
    onError
  );
}

/**
 * PROVIDER: CREATE / SEND QUOTATION
 */
export async function createQuotation(data) {
  const provider = await getCurrentUser();
  const providerProfile = await getUserProfile(provider.uid);

  if (!providerProfile.capabilities?.includes('provider')) {
    throw new Error('Your account is not authorized to submit quotations.');
  }

  if (!data.rfqId) {
    throw new Error('RFQ ID is required.');
  }

  const rfqRef = doc(db, RFQS_COLLECTION, data.rfqId);
  const rfqSnapshot = await getDoc(rfqRef);

  if (!rfqSnapshot.exists()) {
    throw new Error('This RFQ does not exist.');
  }

  const rfq = rfqSnapshot.data();

  if (rfq.providerUid !== provider.uid) {
    throw new Error('You are not authorized to quote this RFQ.');
  }

  if (rfq.status === 'rejected' || rfq.providerDecision === 'rejected') {
    throw new Error('This RFQ was rejected and cannot receive a quotation.');
  }

  if (rfq.status !== 'accepted') {
    throw new Error('Accept this RFQ before submitting a quotation.');
  }

  if (rfq.acceptedQuotationId) {
    throw new Error('A quotation has already been accepted for this RFQ.');
  }

  const offeredPrice = Number(data.offeredPrice);

  if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
    throw new Error('Enter a valid quotation price.');
  }

  const allowedPriceUnits = [
    'total',
    'per-piece',
    'per-batch',
    'per-hour',
    'other',
  ];

  if (!allowedPriceUnits.includes(data.priceUnit)) {
    throw new Error('Select a valid price type.');
  }

  if (
    data.priceUnit === 'other' &&
    !String(data.priceUnitDetails || '').trim()
  ) {
    throw new Error('Specify the other price unit.');
  }

  const deliveryDays = Number(data.deliveryDays);

  if (!Number.isInteger(deliveryDays) || deliveryDays <= 0) {
    throw new Error('Enter a valid delivery duration in days.');
  }

  const requiredFields = [
    ['priceUnit', 'Select a price unit.'],
    ['estimatedDelivery', 'Enter the estimated delivery time.'],
    ['deliveryDate', 'Select the delivery date.'],
    ['materialDetails', 'Enter the material and manufacturing details.'],
    ['validityDate', 'Select a quotation validity date.'],
  ];

  for (const [field, message] of requiredFields) {
    if (!String(data[field] || '').trim()) {
      throw new Error(message);
    }
  }

  for (const field of ['deliveryDate', 'validityDate']) {
    if (!isValidISODate(data[field])) {
      throw new Error(
        `Select a valid ${
          field === 'deliveryDate'
            ? 'delivery date'
            : 'quotation validity date'
        }.`
      );
    }
  }

  const machineSnapshot = rfq.machineId
    ? await getDoc(doc(db, MACHINES_COLLECTION, rfq.machineId))
    : null;

  const machine = machineSnapshot?.exists()
    ? machineSnapshot.data()
    : null;

  if (!machine || machine.ownerUid !== provider.uid) {
    throw new Error('The RFQ machine does not belong to your account.');
  }

  if (
    !providerProfile.companyId ||
    !providerProfile.companyName ||
    rfq.providerCompanyId !== providerProfile.companyId ||
    machine.companyId !== providerProfile.companyId
  ) {
    throw new Error('Your provider company profile does not match this RFQ.');
  }

  const legacyQuery = query(
    collection(db, QUOTATIONS_COLLECTION),
    where('rfqId', '==', data.rfqId),
    where('providerUid', '==', provider.uid)
  );

  const existingQuotes = await getDocs(legacyQuery);

  if (!existingQuotes.empty) {
    throw new Error('You have already submitted a quotation for this RFQ.');
  }

  const quotationRef = doc(
    db,
    QUOTATIONS_COLLECTION,
    `quote_${data.rfqId}_${provider.uid}`
  );

  const providerCompanyId = providerProfile.companyId;

  const quotation = {
    quotationId: quotationRef.id,
    rfqId: data.rfqId,

    rfqTitle: rfq.title || '',
    requirementTitle: rfq.title || '',

    seekerUid: rfq.seekerUid,
    seekerName: rfq.seekerName || '',
    seekerCompanyName: rfq.seekerCompanyName || '',
    seekerCompanyId: rfq.companyId || '',

    providerUid: provider.uid,
    providerName:
      providerProfile.fullName ||
      provider.displayName ||
      provider.email ||
      '',
    providerCompanyId,
    providerCompanyName: providerProfile.companyName || '',

    machineId: rfq.machineId || '',
    machineName: machine.name || '',
    machineCategory: machine.category || '',

    offeredPrice,
    price: offeredPrice,
    priceUnit: String(data.priceUnit).trim(),
    priceUnitDetails: String(data.priceUnitDetails || '').trim(),

    estimatedDelivery: `${deliveryDays} days`,
    deliveryDays,
    deliveryDate: String(data.deliveryDate).trim(),

    materialDetails: String(data.materialDetails).trim(),
    terms: String(data.terms || '').trim(),
    additionalTerms: String(data.terms || '').trim(),
    validityDate: String(data.validityDate).trim(),

    providerRemarks: String(data.providerRemarks || '').trim(),
    capacity: String(data.capacity || '').trim(),
    description: String(data.materialDetails).trim(),

    status: 'submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(quotationRef, quotation);

  return quotationRef.id;
}

export async function getProviderQuotations() {
  const user = await getCurrentUser();

  return enrichQuotations(
    mapSnapshot(await getDocs(quotationQuery('providerUid', user.uid)))
  );
}

export async function getSeekerQuotations() {
  const user = await getCurrentUser();

  return enrichQuotations(
    mapSnapshot(await getDocs(quotationQuery('seekerUid', user.uid)))
  );
}

export const getMyQuotations = getSeekerQuotations;

export function subscribeToProviderQuotations(onData, onError) {
  return subscribeToQuotations('providerUid', onData, onError);
}

export function subscribeToSeekerQuotations(onData, onError) {
  return subscribeToQuotations('seekerUid', onData, onError);
}

export async function getQuotationById(quotationId) {
  await getCurrentUser();

  if (!quotationId) {
    throw new Error('Quotation ID is required.');
  }

  const snapshot = await getDoc(
    doc(db, QUOTATIONS_COLLECTION, quotationId)
  );

  return snapshot.exists()
    ? (await enrichQuotations([normalizeQuotation(snapshot)]))[0]
    : null;
}

/**
 * SEEKER: ACCEPT QUOTATION
 *
 * Acceptance, booking creation, tracking creation, and notifications
 * are written atomically in one Firestore transaction.
 */
export async function acceptQuotation(quotationId) {
  const seeker = await getCurrentUser();

  if (!quotationId) {
    throw new Error('Quotation ID is required.');
  }

  const quotationRef = doc(db, QUOTATIONS_COLLECTION, quotationId);
  const quoteSnapshot = await getDoc(quotationRef);

  if (!quoteSnapshot.exists()) {
    throw new Error('This quotation does not exist.');
  }

  const quoteData = quoteSnapshot.data();

  if (quoteData.seekerUid !== seeker.uid) {
    throw new Error('You are not authorized to accept this quotation.');
  }

  const rfqRef = doc(db, RFQS_COLLECTION, quoteData.rfqId);

  const legacyQuotes = await getDocs(
    query(
      collection(db, QUOTATIONS_COLLECTION),
      where('seekerUid', '==', seeker.uid),
      where('rfqId', '==', quoteData.rfqId)
    )
  );

  const quotationRefs = new Map(
    legacyQuotes.docs.map((item) => [item.id, item.ref])
  );

  quotationRefs.set(quotationRef.id, quotationRef);

  const bookingId = `booking_${quotationRef.id}`;
  const trackingId = `tracking_${bookingId}`;

  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const trackingRef = doc(db, TRACKING_COLLECTION, trackingId);

  const providerNotificationRef = doc(
    db,
    NOTIFICATIONS_COLLECTION,
    `quotation_accepted_provider_${quotationRef.id}`
  );

  const seekerNotificationRef = doc(
    db,
    NOTIFICATIONS_COLLECTION,
    `booking_created_seeker_${bookingRef.id}`
  );

  return runTransaction(db, async (transaction) => {
    const rfqSnapshot = await transaction.get(rfqRef);

    if (!rfqSnapshot.exists()) {
      throw new Error('The RFQ for this quotation no longer exists.');
    }

    const rfq = rfqSnapshot.data();

    if (
      rfq.seekerUid !== seeker.uid ||
      quoteData.rfqId !== rfqSnapshot.id
    ) {
      throw new Error('You do not own the RFQ for this quotation.');
    }

    if (!['accepted', 'open', 'pending'].includes(rfq.status)) {
      throw new Error('This RFQ is no longer available for quotation decisions.');
    }

    if (rfq.providerDecision === 'rejected' || rfq.acceptedQuotationId) {
      throw new Error('This RFQ already has a final decision.');
    }

    for (const id of rfq.quotationIds || []) {
      quotationRefs.set(id, doc(db, QUOTATIONS_COLLECTION, id));
    }

    // All transaction reads are performed before writes.
    const quotationSnapshots = await Promise.all(
      [...quotationRefs.values()].map((reference) =>
        transaction.get(reference)
      )
    );

    const selected = quotationSnapshots.find(
      (item) => item.id === quotationRef.id
    );

    if (!selected?.exists() || selected.data().seekerUid !== seeker.uid) {
      throw new Error('This quotation is not addressed to your account.');
    }

    const selectedQuote = selected.data();

    if (
      !['submitted', 'Received'].includes(selectedQuote.status)
    ) {
      throw new Error('This quotation is no longer available to accept.');
    }

    if (
      selectedQuote.rfqId !== rfqSnapshot.id ||
      selectedQuote.providerUid !== rfq.providerUid
    ) {
      throw new Error('This quotation does not match the RFQ.');
    }

    if (
      quotationSnapshots.some(
        (item) =>
          item.exists() &&
          item.id !== quotationRef.id &&
          item.data().rfqId === rfqSnapshot.id &&
          item.data().status === 'accepted'
      )
    ) {
      throw new Error('Another quotation has already been accepted for this RFQ.');
    }

    // IMPORTANT FIX:
    // Do not transaction.get() the booking/tracking documents here.
    // Those reads were causing the reported permission-denied BatchGetDocuments.
    // The deterministic IDs and atomic transaction writes below prevent
    // a second acceptance from succeeding.

    const now = serverTimestamp();

    const booking = {
      bookingId: bookingRef.id,
      rfqId: selectedQuote.rfqId,
      rfqTitle: selectedQuote.rfqTitle || selectedQuote.requirementTitle || '',
      quotationId: quotationRef.id,

      seekerUid: selectedQuote.seekerUid,
      seekerName: selectedQuote.seekerName || '',
      seekerCompanyName: selectedQuote.seekerCompanyName || '',
      seekerCompanyId: selectedQuote.seekerCompanyId || '',

      providerUid: selectedQuote.providerUid,
      providerName: selectedQuote.providerName || '',
      providerCompanyName: selectedQuote.providerCompanyName || '',
      providerCompanyId: selectedQuote.providerCompanyId || '',

      machineId: selectedQuote.machineId || '',
      machineName: selectedQuote.machineName || '',
      machineCategory: selectedQuote.machineCategory || '',

      offeredPrice: Number(selectedQuote.offeredPrice ?? selectedQuote.price ?? 0),
      price: Number(selectedQuote.offeredPrice ?? selectedQuote.price ?? 0),
      priceUnit: selectedQuote.priceUnit || 'total',
      priceUnitDetails: selectedQuote.priceUnitDetails || '',

      deliveryDate: selectedQuote.deliveryDate || '',
      deliveryDays: Number(selectedQuote.deliveryDays || 0),
      estimatedDelivery: selectedQuote.estimatedDelivery || '',

      materialDetails: selectedQuote.materialDetails || '',
      terms: selectedQuote.additionalTerms || selectedQuote.terms || '',
      providerRemarks: selectedQuote.providerRemarks || '',
      capacity: selectedQuote.capacity || '',

      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    };

    const milestoneKeys = [
      'booking_confirmed',
      'requirements_confirmed',
      'preparation_started',
      'preparation_completed',
      'dispatched',
      'delivered',
      'job_started',
      'completed',
    ];

    const milestones = {};

    milestoneKeys.forEach((key, index) => {
      milestones[key] = {
        status: index === 0 ? 'completed' : 'pending',
          timestamp: index === 0 ? now : null,
          note: index === 0 ? 'Quotation accepted and booking created.' : '',
      };
    });

    const tracking = {
      trackingId: trackingRef.id,
      bookingId: bookingRef.id,
      quotationId: quotationRef.id,
      rfqId: selectedQuote.rfqId,

      seekerUid: selectedQuote.seekerUid,
      providerUid: selectedQuote.providerUid,

      machineId: selectedQuote.machineId || '',
      machineName: selectedQuote.machineName || '',

      milestones,
      currentStatus: 'booking_confirmed',
      completed: false,

      createdAt: now,
      updatedAt: now,
    };

    // Update RFQ.
    transaction.update(rfqRef, {
      status: 'accepted',
      acceptedQuotationId: quotationRef.id,
      updatedAt: now,
    });

    // Accept the selected quote and mark competitors as not selected.
    for (const item of quotationSnapshots) {
      if (!item.exists()) continue;

      const current = item.data();

      if (
        current.seekerUid !== seeker.uid ||
        current.rfqId !== rfqSnapshot.id ||
        !['submitted', 'Received'].includes(current.status)
      ) {
        continue;
      }

      transaction.update(item.ref, {
        status: item.id === quotationRef.id ? 'accepted' : 'not_selected',
        seekerDecision:
          item.id === quotationRef.id ? 'accepted' : 'not_selected',
        seekerDecisionAt: now,
        seekerDecisionBy: seeker.uid,
        rejectionReason: '',
        updatedAt: now,
      });
    }

    // Create the booking.
    transaction.set(bookingRef, booking);

    // Create the job tracking record.
    transaction.set(trackingRef, tracking);

    // Notify the provider that the quotation was accepted.
    transaction.set(providerNotificationRef, {
      recipientUid: selectedQuote.providerUid,
      type: 'quotation_accepted',
      title: 'Quotation accepted',
      message: `Your quotation for "${booking.rfqTitle}" has been accepted. Booking created.`,
      bookingId: bookingRef.id,
      rfqId: selectedQuote.rfqId,
      quotationId: quotationRef.id,
      trackingId: trackingRef.id,
      link: '/provider/jobs',
      read: false,
      createdAt: now,
    });

    // Notify the seeker that the booking was created.
    transaction.set(seekerNotificationRef, {
      recipientUid: selectedQuote.seekerUid,
      type: 'booking_created',
      title: 'Booking created',
      message: `Your booking for "${booking.rfqTitle}" has been created successfully.`,
      bookingId: bookingRef.id,
      rfqId: selectedQuote.rfqId,
      quotationId: quotationRef.id,
      trackingId: trackingRef.id,
      link: '/seeker/jobs',
      read: false,
      createdAt: now,
    });

    return {
      quotationId: quotationRef.id,
      bookingId: bookingRef.id,
      trackingId: trackingRef.id,
    };
  });
}

/**
 * SEEKER: REJECT QUOTATION
 */
export async function rejectQuotation(quotationId, reason = '') {
  const seeker = await getCurrentUser();

  if (!quotationId) {
    throw new Error('Quotation ID is required.');
  }

  const quotationRef = doc(db, QUOTATIONS_COLLECTION, quotationId);
  const initialSnapshot = await getDoc(quotationRef);

  if (!initialSnapshot.exists()) {
    throw new Error('This quotation does not exist.');
  }

  const initialData = initialSnapshot.data();

  if (initialData.seekerUid !== seeker.uid) {
    throw new Error('You are not authorized to reject this quotation.');
  }

  const rfqRef = doc(db, RFQS_COLLECTION, initialData.rfqId);

  await runTransaction(db, async (transaction) => {
    const [rfqSnapshot, quotationSnapshot] = await Promise.all([
      transaction.get(rfqRef),
      transaction.get(quotationRef),
    ]);

    if (!rfqSnapshot.exists() || !quotationSnapshot.exists()) {
      throw new Error('The RFQ or quotation no longer exists.');
    }

    const rfq = rfqSnapshot.data();
    const quotation = quotationSnapshot.data();

    if (
      rfq.seekerUid !== seeker.uid ||
      quotation.seekerUid !== seeker.uid ||
      quotation.rfqId !== rfqSnapshot.id
    ) {
      throw new Error('You do not own the RFQ for this quotation.');
    }

    if (!['accepted', 'open', 'pending'].includes(rfq.status)) {
      throw new Error('This RFQ is no longer available for quotation decisions.');
    }

    if (rfq.providerDecision === 'rejected' || rfq.acceptedQuotationId) {
      throw new Error('This RFQ already has a final decision.');
    }

    if (!['submitted', 'Received'].includes(quotation.status)) {
      throw new Error('This quotation is no longer available to reject.');
    }

    transaction.update(quotationRef, {
      status: 'rejected',
      seekerDecision: 'rejected',
      seekerDecisionAt: serverTimestamp(),
      seekerDecisionBy: seeker.uid,
      rejectionReason: String(reason || '').trim(),
      updatedAt: serverTimestamp(),
    });
  });
}
