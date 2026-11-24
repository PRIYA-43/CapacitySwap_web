import { auth, db } from "../firebase/firebase";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

// One review per booking.
// The booking ID is used as the review document ID.
function getReviewId(bookingId) {
  return bookingId;
}

// Submit a machine review only after the associated booking is completed.
export async function submitMachineReview({
  bookingId,
  machineId,
  machineName = "",
  rating,
  feedback = "",
  reviewerName = "",
  reviewerRole = "seeker",
}) {
  const currentUser = auth.currentUser;

  // 1. Authentication check
  if (!currentUser) {
    throw new Error("You must be logged in to leave a review.");
  }

  // 2. Required values
  if (!bookingId) {
    throw new Error("Booking ID is required to submit a review.");
  }

  if (!machineId) {
    throw new Error("Machine ID is required.");
  }

  // 3. Validate rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }

  // 4. Validate feedback
  const reviewText = String(feedback).trim();

  if (reviewText.length > 2000) {
    throw new Error("Feedback cannot exceed 2000 characters.");
  }

  const reviewId = getReviewId(bookingId);

  const bookingRef = doc(db, "bookings", bookingId);

  // Tracking ID format must match your existing tracking structure.
  const trackingRef = doc(
    db,
    "jobTracking",
    `tracking_${bookingId}`
  );

  const reviewRef = doc(db, "machineReviews", reviewId);

  // 5. Validate everything before creating the review.
  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);

    if (!bookingSnapshot.exists()) {
      throw new Error("Booking not found.");
    }

    const booking = bookingSnapshot.data();

    // 6. Only the seeker who owns the booking may review.
    if (booking.seekerUid !== currentUser.uid) {
      throw new Error(
        "You are not authorized to review this booking."
      );
    }

    // 7. Verify the machine matches the booking.
    if (booking.machineId !== machineId) {
      throw new Error(
        "This review does not match the machine in your booking."
      );
    }

    // 8. Get the tracking record.
    const trackingSnapshot = await transaction.get(trackingRef);

    if (!trackingSnapshot.exists()) {
      throw new Error(
        "Job tracking information was not found for this booking."
      );
    }

    const tracking = trackingSnapshot.data();

    // 9. The job must be completed.
    if (tracking.completed !== true) {
      throw new Error(
        "You can review this machine only after the booking is completed."
      );
    }

    // 10. Validate tracking machine if the field exists.
    if (
      tracking.machineId &&
      tracking.machineId !== machineId
    ) {
      throw new Error(
        "The tracking record does not match this machine."
      );
    }

    // 11. Check if this booking already has a review.
    const existingReviewSnapshot = await transaction.get(reviewRef);

    if (existingReviewSnapshot.exists()) {
      throw new Error(
        "You have already submitted a review for this booking."
      );
    }

    // 12. Create exactly one review for this booking.
    const reviewData = {
      reviewId,
      bookingId,
      machineId,
      machineName:
        machineName || booking.machineName || tracking.machineName || "",
      reviewerUid: currentUser.uid,
      reviewerName:
        reviewerName || currentUser.displayName || "",
      reviewerRole,
      rating,
      feedback: reviewText,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(reviewRef, reviewData);
  });

  return reviewId;
}

// Listen to reviews for a particular machine in real time.
export function subscribeToMachineReviews(
  machineId,
  callback,
  onError
) {
  if (!machineId) {
    throw new Error("Machine ID is required to load reviews.");
  }

  const reviewsQuery = query(
    collection(db, "machineReviews"),
    where("machineId", "==", machineId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    reviewsQuery,
    (snapshot) => {
      const reviews = snapshot.docs.map((reviewDoc) => ({
        ...reviewDoc.data(),
        reviewId: reviewDoc.id,
      }));

      callback(reviews);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error("Failed to load machine reviews:", error);
      }
    }
  );
}

// Calculate average rating and number of reviews.
export function calculateMachineRating(reviews = []) {
  const validReviews = reviews.filter(
    (review) =>
      Number.isInteger(review.rating) &&
      review.rating >= 1 &&
      review.rating <= 5
  );

  const totalReviews = validReviews.length;

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  }

  const totalRating = validReviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  return {
    averageRating: Number(
      (totalRating / totalReviews).toFixed(1)
    ),
    totalReviews,
  };
}

// Get the current user's review for a specific booking.
export async function getMyMachineReview(bookingId) {
  const currentUser = auth.currentUser;

  if (!currentUser || !bookingId) {
    return null;
  }

  const reviewRef = doc(
    db,
    "machineReviews",
    getReviewId(bookingId)
  );

  const reviewSnapshot = await getDoc(reviewRef);

  if (!reviewSnapshot.exists()) {
    return null;
  }

  const review = reviewSnapshot.data();

  // Return only the review belonging to the current user.
  if (review.reviewerUid !== currentUser.uid) {
    return null;
  }

  return review;
}