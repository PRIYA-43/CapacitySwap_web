import { useEffect, useState } from 'react';
import { getMachineReviews } from '../../services/machineReviewService';

function getDate(createdAt) {
  try {
    if (!createdAt) return 'Recently';

    const date = createdAt.toDate
      ? createdAt.toDate()
      : new Date(createdAt);

    if (Number.isNaN(date.getTime())) return 'Recently';

    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export default function MachineReviewList({ machineId, refreshKey = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getMachineReviews(machineId);

        if (!active) return;

        const sorted = [...data].sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.createdAt || 0).getTime();

          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        });

        setReviews(sorted);
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load machine reviews.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (machineId) {
      loadReviews();
    } else {
      setReviews([]);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [machineId, refreshKey]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
        reviews.length
      : 0;

  if (loading) {
    return <div style={styles.message}>Loading reviews...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Machine Reviews</h3>

      {error && <p style={styles.error}>{error}</p>}

      {reviews.length > 0 && (
        <div style={styles.summary}>
          <span style={styles.average}>
            {averageRating.toFixed(1)} ★
          </span>

          <span style={styles.summaryText}>
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {!error && reviews.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyStar}>☆</div>
          <p style={styles.emptyMessage}>No reviews yet.</p>
          <p style={styles.emptyMessage}>Be the first to share your experience with this machine.</p>
        </div>
      )}

      <div style={styles.reviewContainer}>
        {reviews.map((review) => (
          <div key={review.id} style={styles.reviewCard}>
            <div style={styles.reviewTop}>
              <div>
                <div style={styles.reviewerName}>
                  {review.reviewerName || 'User'}
                </div>

                <div style={styles.reviewStars}>
                  {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}
                  {'☆'.repeat(5 - Math.max(0, Math.min(5, Number(review.rating || 0))))}
                </div>
              </div>

              <span style={styles.date}>
                {getDate(review.createdAt)}
              </span>
            </div>

            <p style={styles.feedback}>
              {review.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '24px',
  },
  heading: {
    fontSize: '20px',
    color: '#1e293b',
    marginBottom: '16px',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px',
  },
  average: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#b77900',
  },
  summaryText: {
    fontSize: '14px',
    color: '#64748b',
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    background: '#f8fafc',
    borderRadius: '10px',
    color: '#64748b',
  },
  emptyMessage: {
    color: '#475569',
  },
  emptyStar: {
    fontSize: '36px',
    color: '#f5b301',
  },
  reviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  reviewCard: {
    padding: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    background: '#ffffff',
  },
  reviewTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  reviewerName: {
    fontWeight: '600',
    color: '#334155',
  },
  reviewStars: {
    color: '#f5b301',
    marginTop: '5px',
    fontSize: '16px',
    letterSpacing: '2px',
  },
  date: {
    color: '#64748b',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  feedback: {
    marginTop: '12px',
    color: '#475569',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  message: {
    padding: '16px',
    color: '#64748b',
  },
  error: {
    color: '#dc2626',
    padding: '10px',
    background: '#fef2f2',
    borderRadius: '6px',
  },
};