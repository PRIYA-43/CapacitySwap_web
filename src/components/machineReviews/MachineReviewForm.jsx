
import { useEffect, useState } from 'react';
import {
  submitMachineReview,
  getEligibleBookingsForMachine,
} from '../../services/machineReviewService';

export default function MachineReviewForm({
  machineId,
  machineName,
  providerUid,
  providerCompanyId,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  useEffect(() => {
    let active = true;

    const checkEligibility = async () => {
      setCheckingEligibility(true);
      setEligibleBookings([]);
      setBookingId('');
      setError('');

      if (!machineId) {
        setCheckingEligibility(false);
        return;
      }

      try {
        const items = await getEligibleBookingsForMachine(machineId);

        if (!active) return;

        setEligibleBookings(items || []);
        setBookingId(items?.[0]?.id || '');
      } catch (err) {
        console.error('Machine review eligibility error:', err);

        if (active) {
          setEligibleBookings([]);
        }
      } finally {
        if (active) {
          setCheckingEligibility(false);
        }
      }
    };

    checkEligibility();

    return () => {
      active = false;
    };
  }, [machineId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!machineId) {
      setError('Machine information is missing.');
      return;
    }

    if (!bookingId || !eligibleBookings.some(
      (booking) => booking.id === bookingId
    )) {
      setError('No eligible completed booking found.');
      return;
    }

    if (!feedback.trim()) {
      setError('Please write your feedback before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      await submitMachineReview({
        machineId,
        machineName,
        providerUid,
        providerCompanyId,
        bookingId,
        rating,
        feedback: feedback.trim(),
      });

      setFeedback('');
      setRating(5);

      setSuccess('Your feedback has been submitted successfully.');

      if (onReviewSubmitted) {
        await onReviewSubmitted();
      }
    } catch (err) {
      console.error('Machine review submission failed:', err);
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // Do not display anything while checking eligibility.
  if (checkingEligibility) {
    return null;
  }

  // IMPORTANT:
  // Hide the complete rating component if the seeker
  // has no completed booking for this particular machine.
  if (eligibleBookings.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        Rate This Machine
      </h3>

      <form onSubmit={handleSubmit}>

        {eligibleBookings.length > 1 && (
          <div style={styles.field}>
            <label style={styles.label}>
              Completed Booking
            </label>

            <select
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              disabled={submitting}
              style={styles.textarea}
            >
              {eligibleBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.bookingId || booking.id}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={styles.ratingContainer}>
          <p style={styles.label}>
            Your Rating
          </p>

          <div style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={submitting}
                aria-label={`Rate ${star} out of 5 stars`}
                style={{
                  ...styles.starButton,
                  color: star <= rating ? '#f5b301' : '#cbd5e1',
                }}
              >
                ★
              </button>
            ))}
          </div>

          <p style={styles.ratingText}>
            {rating} out of 5 stars
          </p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Your Feedback
          </label>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience with this machine..."
            rows={4}
            disabled={submitting}
            maxLength={1000}
            style={styles.textarea}
          />

          <small style={styles.counter}>
            {feedback.length}/1000 characters
          </small>
        </div>

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        {success && (
          <p style={styles.success}>
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !bookingId}
          style={{
            ...styles.submitButton,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting
            ? 'Submitting...'
            : 'Submit Rating & Feedback'}
        </button>

      </form>
    </div>
  );
}

const styles = {
  container: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    background: '#ffffff',
    marginTop: '20px',
  },

  heading: {
    margin: '0 0 20px',
    fontSize: '20px',
    color: '#1e293b',
  },

  ratingContainer: {
    marginBottom: '20px',
  },

  stars: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },

  starButton: {
    fontSize: '32px',
    background: 'transparent',
    border: 'none',
    padding: '0 2px',
    cursor: 'pointer',
  },

  ratingText: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '5px',
  },

  field: {
    marginBottom: '16px',
  },

  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#334155',
  },

  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px',
  },

  counter: {
    display: 'block',
    textAlign: 'right',
    color: '#64748b',
    marginTop: '5px',
  },

  error: {
    color: '#dc2626',
    background: '#fef2f2',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
  },

  success: {
    color: '#15803d',
    background: '#f0fdf4',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
  },

  submitButton: {
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 18px',
    fontWeight: '600',
    width: '100%',
  },
};
