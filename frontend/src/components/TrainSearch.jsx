import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { extractErrorMessage } from '../services/api';
import './TrainSearch.css';

const TrainSearch = () => {
  const [source, setSource] = useState('New Delhi');
  const [destination, setDestination] = useState('Howrah Junction');
  const [date, setDate] = useState('2025-08-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [liveUpdates, setLiveUpdates] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    socketRef.current = io(baseURL);

    socketRef.current.on('seat_update', (data) => {
      setResults(prevResults => {
        if (!prevResults) return prevResults;
        
        const newTrains = prevResults.trains.map(train => {
          if (train.id === data.trainId) {
            const newAvailability = train.availability.map(avail => {
              if (avail.class === data.travelClass) {
                return { ...avail, availableSeats: data.availableSeats };
              }
              return avail;
            });
            return { ...train, availability: newAvailability };
          }
          return train;
        });
        
        return { ...prevResults, trains: newTrains };
      });
      
      setLiveUpdates(prev => {
        const msg = `Seat update - Train ${data.trainId} ${data.travelClass}: ${data.availableSeats} seats remaining`;
        return [msg, ...prev].slice(0, 3);
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (results && socketRef.current) {
      results.trains.forEach(train => {
        if (train.availability) {
          train.availability.forEach(avail => {
            socketRef.current.emit('join_train_room', {
              trainId: train.id,
              journeyDate: results.date,
              travelClass: avail.class
            });
          });
        }
      });
    }
  }, [results]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    setBookingMessage('');
    setBookingError('');

    try {
      const response = await api.get('/trains/search', {
        params: { source, destination, date }
      });
      setResults(response.data.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (trainId, journeyDate, travelClass) => {
    setBookingLoading(true);
    setBookingMessage('');
    setBookingError('');

    try {
      const response = await api.post('/reservation/reserve', 
        { trainId, journeyDate, travelClass },
        {
          headers: {
            'Idempotency-Key': crypto.randomUUID()
          }
        }
      );
      
      // Success or waitlist
      setBookingMessage(response.data.message || 'Reservation successful!');
    } catch (err) {
      setBookingError(extractErrorMessage(err));
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="train-search-container">
      <div className="search-form-card">
        <h2>Search Trains</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label>Source Station</label>
            <input 
              type="text" 
              value={source} 
              onChange={(e) => setSource(e.target.value)} 
              placeholder="e.g. New Delhi"
              required 
            />
          </div>
          <div className="form-group">
            <label>Destination Station</label>
            <input 
              type="text" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              placeholder="e.g. Howrah Junction"
              required 
            />
          </div>
          <div className="form-group">
            <label>Journey Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <div className="error-message mt-1">{error}</div>}
      </div>

      {bookingMessage && <div className="success-banner mt-2">{bookingMessage}</div>}
      {bookingError && <div className="error-message mt-2">{bookingError}</div>}

      {liveUpdates.length > 0 && (
        <div className="live-updates-panel mt-2">
          <h4>Live Updates</h4>
          <ul>
            {liveUpdates.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {results && (
        <div className="search-results">
          <h3>Results: {results.source.name} to {results.destination.name}</h3>
          
          {results.trains.length === 0 ? (
            <p>No trains found for this route and date.</p>
          ) : (
            results.trains.map((train) => (
              <div key={train.id} className="train-card">
                <div className="train-header">
                  <h4>{train.trainNumber} - {train.trainName}</h4>
                </div>
                <div className="availability-list">
                  {train.availability && train.availability.map((avail, idx) => (
                    <div key={idx} className="class-card">
                      <div className="class-info">
                        <span className="class-name">{avail.class}</span>
                        <span className="seats-avail">
                          Available: <strong>{avail.availableSeats}</strong> / {avail.totalSeats}
                        </span>
                      </div>
                      <button 
                        className="book-btn"
                        onClick={() => handleBook(train.id, results.date, avail.class)}
                        disabled={bookingLoading || avail.totalSeats === 0}
                      >
                        {bookingLoading ? 'Booking...' : 'Book'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TrainSearch;
