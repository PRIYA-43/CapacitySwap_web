// src/services/trackingService.js

import {
  doc,
  onSnapshot,
  query,
  collection,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '../firebase/firebase';

const TRACKING_COLLECTION = 'jobTracking';
const NOTIFICATIONS_COLLECTION = 'notifications';

const MILESTONE_OPTIONS = [
  ['booking_confirmed', 'Booking confirmed'],
  ['requirements_confirmed', 'Requirements/details confirmed'],
  ['preparation_started', 'Preparation started'],
  ['preparation_completed', 'Machine preparation completed'],
  ['dispatched', 'Machine dispatched'],
  ['delivered', 'Machine delivered'],
  ['job_started', 'Job started'],
  ['completed', 'Job completed'],
];

function newestFirst(items) {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

export function subscribeToTracking(field, onData, onError) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in to view job tracking.');
  }

  return onSnapshot(
    query(
      collection(db, TRACKING_COLLECTION),
      where(field, '==', user.uid)
    ),
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        trackingId: item.data().trackingId || item.id,
        ...item.data(),
      }));

      onData(newestFirst(items));
    },
    onError
  );
}

export function subscribeToSeekerTracking(onData, onError) {
  return subscribeToTracking('seekerUid', onData, onError);
}

export function subscribeToProviderTracking(onData, onError) {
  return subscribeToTracking('providerUid', onData, onError);
}

export async function updateTrackingMilestone(
  trackingId,
  milestoneKey,
  note = ''
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in to update job tracking.');
  }

  if (!MILESTONE_OPTIONS.some(([key]) => key === milestoneKey)) {
    throw new Error('Select a valid job milestone.');
  }

  const trackingRef = doc(db, TRACKING_COLLECTION, trackingId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(trackingRef);

    if (!snapshot.exists()) {
      throw new Error('The job tracking record no longer exists.');
    }

    const tracking = snapshot.data();

    if (tracking.providerUid !== user.uid) {
      throw new Error('Only the assigned provider can update this job.');
    }

    if (
      tracking.completed === true ||
      tracking.currentStatus === 'completed'
    ) {
      throw new Error('Completed jobs cannot be changed.');
    }

    const milestones = tracking.milestones || {};

    if (milestones[milestoneKey]?.status === 'completed') {
      throw new Error('This milestone is already completed.');
    }

    const keys = MILESTONE_OPTIONS.map(([key]) => key);
    const targetIndex = keys.indexOf(milestoneKey);

    for (let index = 0; index < targetIndex; index += 1) {
      if (milestones[keys[index]]?.status !== 'completed') {
        throw new Error('Complete the previous milestone first.');
      }
    }

    const milestoneLabel =
      MILESTONE_OPTIONS.find(([key]) => key === milestoneKey)?.[1] ||
      'Job progress updated';

    const nextMilestones = {
      ...milestones,
      [milestoneKey]: {
        status: 'completed',
        timestamp: serverTimestamp(),
        note: String(note || '').trim(),
      },
    };

    transaction.update(trackingRef, {
      milestones: nextMilestones,
      currentStatus: milestoneKey,
      completed: milestoneKey === 'completed',
      updatedAt: serverTimestamp(),
    });

    // Notification for the seeker.
    const seekerNotificationRef = doc(
      db,
      NOTIFICATIONS_COLLECTION,
      `tracking_${trackingId}_${milestoneKey}_${tracking.seekerUid}`
    );

    transaction.set(seekerNotificationRef, {
      recipientUid: tracking.seekerUid,
      type:
        milestoneKey === 'completed'
          ? 'job_completed'
          : milestoneKey === 'dispatched'
            ? 'machine_dispatched'
            : milestoneKey === 'delivered'
              ? 'machine_delivered'
              : milestoneKey === 'job_started'
                ? 'job_started'
                : 'job_tracking_updated',
      title: milestoneLabel,
      message:
        String(note || '').trim() ||
        `The provider updated: ${milestoneLabel.toLowerCase()}.`,
      bookingId: tracking.bookingId,
      rfqId: tracking.rfqId,
      quotationId: tracking.quotationId,
      trackingId,
      link: '/seeker/jobs',
      read: false,
      createdAt: serverTimestamp(),
    });

    // When the job is completed, also notify the provider.
    if (milestoneKey === 'completed') {
      const providerNotificationRef = doc(
        db,
        NOTIFICATIONS_COLLECTION,
        `tracking_${trackingId}_${milestoneKey}_${tracking.providerUid}`
      );

      transaction.set(providerNotificationRef, {
        recipientUid: tracking.providerUid,
        type: 'job_completed',
        title: 'Job completed',
        message: 'The job milestone was marked completed.',
        bookingId: tracking.bookingId,
        rfqId: tracking.rfqId,
        quotationId: tracking.quotationId,
        trackingId,
        link: '/provider/jobs',
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  });
}

export function getTrackingMilestoneOptions() {
  return MILESTONE_OPTIONS;
}