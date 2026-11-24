
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '../firebase/firebase';

const REVIEWS_COLLECTION = 'machineReviews';
const BOOKINGS_COLLECTION = 'bookings';
const TRACKING_COLLECTION = 'jobTracking';

// Keep one review document per user, machine and booking.
function getReviewId(machineId, userId, bookingId) {
  return `${machineId}_${userId}_${bookingId}`;
}

function isCompletedTracking(tracking) {
  return (
    tracking?.completed === true ||
    String(tracking?.currentStatus || '').toLowerCase() === 'completed'
  );
}

// --------------------------------------------------
// CHECK WHETHER A BOOKING IS ELIGIBLE FOR REVIEW
// --------------------------------------------------

async function validateCompletedBooking(machineId, bookingId, user) {
  if (!user) {
    throw new Error('Please log in to continue.');
  }

  if (!machineId || !bookingId) {
    throw new Error('Machine ID and booking ID are required.');
  }

  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnapshot = await getDoc(bookingRef);

  if (!bookingSnapshot.exists()) {
    throw new Error('Booking not found.');
  }

  const booking = bookingSnapshot.data();

  if (booking.seekerUid !== user.uid) {
    throw new Error('You can only review your own bookings.');
  }

  if (booking.machineId !== machineId) {
    throw new Error('This booking does not belong to this machine.');
  }

  // Your existing tracking creation rule uses:
  // tracking_<bookingId>
  const trackingRef = doc(
    db,
    TRACKING_COLLECTION,
    `tracking_${bookingId}`
  );

  const trackingSnapshot = await getDoc(trackingRef);

  if (!trackingSnapshot.exists()) {
    throw new Error('Job tracking information was not found.');
  }

  const tracking = trackingSnapshot.data();

  if (tracking.seekerUid !== user.uid) {
    throw new Error('You are not the seeker for this booking.');
  }

  if (!isCompletedTracking(tracking)) {
    throw new Error(
      'You can review this machine only after job completion.'
    );
  }

  return {
    booking,
    tracking,
  };
}

// --------------------------------------------------
// SUBMIT OR UPDATE MACHINE REVIEW
// --------------------------------------------------

export async function submitMachineReview({
  machineId,
  machineName = '',
  providerUid = '',
  providerCompanyId = '',
  bookingId,
  rating,
  feedback = '',
}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in to submit a review.');
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new Error('Rating must be between 1 and 5 stars.');
  }

  const reviewText = String(feedback || '').trim();

  if (!reviewText) {
    throw new Error('Please enter your feedback.');
  }

  if (reviewText.length > 1000) {
    throw new Error('Feedback cannot exceed 1000 characters.');
  }

  // Verify ownership, exact machine and completed job.
  const { booking } = await validateCompletedBooking(
    machineId,
    bookingId,
    user
  );

  const reviewId = getReviewId(
    machineId,
    user.uid,
    bookingId
  );

  const reviewRef = doc(
    db,
    REVIEWS_COLLECTION,
    reviewId
  );

  const existingReview = await getDoc(reviewRef);

  // Preserve original creation timestamp when editing.
  const reviewData = {
    reviewId,
    machineId,
    machineName: machineName || booking.machineName || '',
    providerUid: providerUid || booking.providerUid || '',
    providerCompanyId:
      providerCompanyId || booking.providerCompanyId || '',
    bookingId,

    reviewerUid: user.uid,
    reviewerName:
      user.displayName || user.email || 'User',
    reviewerRole: 'Seeker',

    rating: numericRating,
    feedback: reviewText,

    createdAt: existingReview.exists()
      ? existingReview.data().createdAt
      : serverTimestamp(),

    updatedAt: serverTimestamp(),
  };

  await setDoc(reviewRef, reviewData);

  return reviewId;
}

// --------------------------------------------------
// GET REVIEWS FOR A MACHINE
// Published reviews can be displayed to all visitors.
// --------------------------------------------------

export async function getMachineReviews(machineId) {
  if (!machineId) return [];

  const reviewQuery = query(
    collection(db, REVIEWS_COLLECTION),
    where('machineId', '==', machineId)
  );

  const snapshot = await getDocs(reviewQuery);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
}

// --------------------------------------------------
// GET CURRENT USER'S REVIEW FOR A MACHINE AND BOOKING
// --------------------------------------------------

export async function getMyMachineReview(machineId, bookingId) {
  const user = auth.currentUser;

  if (!user || !machineId || !bookingId) {
    return null;
  }

  const reviewId = getReviewId(
    machineId,
    user.uid,
    bookingId
  );

  const reviewSnapshot = await getDoc(
    doc(db, REVIEWS_COLLECTION, reviewId)
  );

  if (!reviewSnapshot.exists()) {
    return null;
  }

  return {
    id: reviewSnapshot.id,
    ...reviewSnapshot.data(),
  };
}

// --------------------------------------------------
// GET COMPLETED BOOKINGS ELIGIBLE FOR REVIEW
// --------------------------------------------------

export async function getEligibleBookingsForMachine(machineId) {
  const user = auth.currentUser;

  if (!user || !machineId) {
    return [];
  }

  // Only retrieve tracking records belonging to this seeker.
  const trackingQuery = query(
    collection(db, TRACKING_COLLECTION),
    where('seekerUid', '==', user.uid)
  );

  const trackingSnapshot = await getDocs(trackingQuery);

  const eligibleBookings = [];

  for (const trackingDocument of trackingSnapshot.docs) {
    const tracking = trackingDocument.data();

    if (!isCompletedTracking(tracking)) {
      continue;
    }

    if (!tracking.bookingId) {
      continue;
    }

    if (tracking.seekerUid !== user.uid) {
      continue;
    }

    const bookingRef = doc(
      db,
      BOOKINGS_COLLECTION,
      tracking.bookingId
    );

    const bookingSnapshot = await getDoc(bookingRef);

    if (!bookingSnapshot.exists()) {
      continue;
    }

    const booking = bookingSnapshot.data();

    // Exact machine and exact seeker verification.
    if (
      booking.seekerUid !== user.uid ||
      booking.machineId !== machineId
    ) {
      continue;
    }

    const reviewId = getReviewId(
      machineId,
      user.uid,
      tracking.bookingId
    );

    const reviewSnapshot = await getDoc(
      doc(db, REVIEWS_COLLECTION, reviewId)
    );

    eligibleBookings.push({
      id: tracking.bookingId,
      bookingId: tracking.bookingId,
      machineId: booking.machineId,
      machineName: booking.machineName || '',
      completed: true,
      hasReviewed: reviewSnapshot.exists(),
      existingReview: reviewSnapshot.exists()
        ? {
            id: reviewSnapshot.id,
            ...reviewSnapshot.data(),
          }
        : null,
    });
  }

  return eligibleBookings;
}

// --------------------------------------------------
// CHECK WHETHER THE CURRENT USER CAN REVIEW A MACHINE
// --------------------------------------------------

export async function canReviewMachine(machineId) {
  const user = auth.currentUser;

  if (!user || !machineId) {
    return {
      canReview: false,
      eligibleBookings: [],
    };
  }

  const eligibleBookings =
    await getEligibleBookingsForMachine(machineId);

  return {
    canReview: eligibleBookings.length > 0,
    eligibleBookings,
  };
}

// --------------------------------------------------
// CALCULATE MACHINE RATING
// --------------------------------------------------

export function calculateMachineRating(reviews = []) {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalRating = 0;
  let validReviewCount = 0;

  reviews.forEach((review) => {
    const rating = Number(review.rating);

    if (
      Number.isInteger(rating) &&
      rating >= 1 &&
      rating <= 5
    ) {
      totalRating += rating;
      distribution[rating] += 1;
      validReviewCount += 1;
    }
  });

  return {
    averageRating:
      validReviewCount > 0
        ? Number(
            (totalRating / validReviewCount).toFixed(1)
          )
        : 0,

    totalReviews: validReviewCount,
    distribution,
  };
}

// --------------------------------------------------
// GET RATING SUMMARIES FOR ALL MACHINES
// --------------------------------------------------

export async function getMachineRatingSummaries() {
  const snapshot = await getDocs(
    collection(db, REVIEWS_COLLECTION)
  );

  const reviewsByMachine = {};

  snapshot.docs.forEach((item) => {
    const review = item.data();

    if (!review.machineId) {
      return;
    }

    if (!reviewsByMachine[review.machineId]) {
      reviewsByMachine[review.machineId] = [];
    }

    reviewsByMachine[review.machineId].push(review);
  });

  const summaries = {};

  Object.entries(reviewsByMachine).forEach(
    ([machineId, reviews]) => {
      summaries[machineId] =
        calculateMachineRating(reviews);
    }
  );

  return summaries;
}
