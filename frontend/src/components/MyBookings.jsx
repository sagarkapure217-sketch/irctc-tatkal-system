import { useState, useEffect, useCallback } from 'react';
import api, { extractErrorMessage } from '../services/api';
import './MyBookings.css';

const CountdownTimer = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const expiresAt = new Date(createdAt).getTime() + 60000;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const expiresAt = new Date(createdAt).getTime() + 60000;
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  if (timeLeft === 0) {
    return <span className="waiting-text">Waiting for backend update...</span>;
  }
  return <span className="timer-text">Expires in: {timeLeft}s</span>;
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const fetchBookings = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/bookings/my');
      setBookings(response.data.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh logic: if any booking is PENDING_PAYMENT and time is up, poll backend every 3s
  // because the backend worker runs every 5s to expire it.
  useEffect(() => {
    const hasExpiredPending = bookings.some(b => 
      b.status === 'PENDING_PAYMENT' && (Date.now() - new Date(b.createdAt).getTime()) >= 60000
    );

    if (hasExpiredPending) {
      const interval = setInterval(() => {
        fetchBookings(false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [bookings, fetchBookings]);

  const handlePayment = async (bookingId) => {
    setPaymentLoadingId(bookingId);
    setPaymentMessage('');
    setPaymentError('');

    try {
      const response = await api.post('/payments/success', { bookingId });
      setPaymentMessage(response.data.message || 'Payment successful!');
      fetchBookings(false); // Refresh immediately after successful payment
    } catch (err) {
      setPaymentError(extractErrorMessage(err));
    } finally {
      setPaymentLoadingId(null);
    }
  };

  if (loading) {
    return <div className="bookings-container"><p>Loading bookings...</p></div>;
  }

  return (
    <div className="bookings-container">
      <h2>My Bookings</h2>
      
      {error && <div className="error-message mb-2">{error}</div>}
      {paymentMessage && <div className="success-banner mb-2">{paymentMessage}</div>}
      {paymentError && <div className="error-message mb-2">{paymentError}</div>}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings yet.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.bookingId} className="booking-card">
              <div className="booking-header">
                <div className="booking-title">
                  <h4>{booking.trainNumber} - {booking.trainName}</h4>
                  <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="booking-id">ID: {booking.bookingId}</div>
              </div>
              
              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Route:</span>
                  <span>{booking.sourceStation} &rarr; {booking.destinationStation}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span>{booking.journeyDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Class:</span>
                  <span>{booking.travelClass}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created At:</span>
                  <span>{new Date(booking.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {booking.status === 'PENDING_PAYMENT' && (
                <div className="payment-section">
                  <CountdownTimer createdAt={booking.createdAt} />
                  <button 
                    className="payment-btn"
                    onClick={() => handlePayment(booking.bookingId)}
                    disabled={paymentLoadingId !== null}
                  >
                    {paymentLoadingId === booking.bookingId ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
