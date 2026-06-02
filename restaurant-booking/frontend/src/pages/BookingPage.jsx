import { useState } from 'react';
import { Armchair, CalendarDays, Clock3, MapPin, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContextValue';
import { getBookingDraft, saveBookingDraft } from '../lib/bookingDraft';
import { api, getErrorMessage } from '../lib/api';
import { displayDate, todayISO } from '../lib/format';

const areas = [
  { value: '', label: 'Any area' },
  { value: 'INDOOR', label: 'Indoor dining room' },
  { value: 'OUTDOOR', label: 'Outdoor garden' },
  { value: 'VIP', label: 'Private VIP room' },
];

const updateDraft = (current, patch) => {
  const next = { ...current, ...patch };
  saveBookingDraft(next);
  return next;
};

export function BookingPage() {
  const [draft, setDraft] = useState(getBookingDraft);
  const [tables, setTables] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const selectedTable = tables.find((table) => Number(table.id) === Number(draft.table_id));

  const changeDraft = (patch) => {
    setDraft((current) => updateDraft(current, patch));
  };

  const findTables = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);
    changeDraft({ table_id: null });
    try {
      const { data } = await api.get('/api/tables/availability', {
        params: {
          date: draft.reservation_date,
          start_time: draft.start_time,
          guest_count: draft.guest_count,
          area: draft.area || undefined,
        },
      });
      setTables(data);
    } catch (err) {
      setTables([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async () => {
    if (!selectedTable) {
      setError('Please select an available table before continuing.');
      return;
    }

    saveBookingDraft(draft);
    if (!isAuthenticated) {
      navigate('/login?returnTo=/booking/tables');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      setError('Please sign in with a customer account to create a reservation.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/reservations', {
        table_id: selectedTable.id,
        reservation_date: draft.reservation_date,
        start_time: draft.start_time,
        guest_count: Number(draft.guest_count),
        special_notes: draft.special_notes.trim() || undefined,
      });
      navigate(`/booking/pre-order/${data.id}`);
    } catch (err) {
      if (err.response?.status === 409) {
        changeDraft({ table_id: null });
        setTables((current) => current.filter((table) => Number(table.id) !== Number(selectedTable.id)));
        setError('This table was just reserved by another guest. Please choose another available table.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="booking-page noise" id="main-content">
      <section className="booking-intro">
        <p className="eyebrow gold">Reservations</p>
        <h1>Choose your table</h1>
        <p>Select an evening, find an available table and confirm your dining room reservation.</p>
      </section>

      <section className="booking-shell">
        <form className="booking-search-panel" onSubmit={findTables}>
          <div className="booking-section-heading">
            <div>
              <p className="eyebrow leaf">Step 01</p>
              <h2>Plan the evening</h2>
            </div>
            <span>2-hour seating</span>
          </div>

          <div className="booking-search-grid">
            <label>
              <span>Date</span>
              <div className="booking-input-wrap">
                <CalendarDays size={17} />
                <input
                  type="date"
                  min={todayISO()}
                  value={draft.reservation_date}
                  onChange={(event) => changeDraft({ reservation_date: event.target.value, table_id: null })}
                  required
                />
              </div>
            </label>
            <label>
              <span>Arrival time</span>
              <div className="booking-input-wrap">
                <Clock3 size={17} />
                <input
                  type="time"
                  value={draft.start_time}
                  onChange={(event) => changeDraft({ start_time: event.target.value, table_id: null })}
                  required
                />
              </div>
            </label>
            <label>
              <span>Guests</span>
              <div className="booking-input-wrap">
                <UsersRound size={17} />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={draft.guest_count}
                  onChange={(event) => changeDraft({ guest_count: Number(event.target.value), table_id: null })}
                  required
                />
              </div>
            </label>
            <label>
              <span>Dining area</span>
              <div className="booking-input-wrap">
                <MapPin size={17} />
                <select value={draft.area} onChange={(event) => changeDraft({ area: event.target.value, table_id: null })}>
                  {areas.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <button className="gold-button" type="submit" disabled={loading}>
            {loading ? 'Finding tables...' : 'Find available tables'}
          </button>
        </form>

        <div className="booking-results">
          <div className="booking-section-heading">
            <div>
              <p className="eyebrow leaf">Step 02</p>
              <h2>Available tables</h2>
            </div>
            {searched && <span>{tables.length} available</span>}
          </div>

          {error && <p className="inline-error">{error}</p>}

          {loading ? (
            <div className="booking-table-grid">
              {[1, 2, 3, 4].map((item) => (
                <div className="booking-table-card skeleton" key={item} />
              ))}
            </div>
          ) : searched && tables.length ? (
            <div className="booking-table-grid">
              {tables.map((table) => (
                <button
                  className={`booking-table-card ${Number(table.id) === Number(draft.table_id) ? 'selected' : ''}`}
                  key={table.id}
                  type="button"
                  onClick={() => changeDraft({ table_id: table.id })}
                >
                  <Armchair size={22} />
                  <strong>{table.table_number}</strong>
                  <span>{table.capacity} seats</span>
                  <small>{table.area}</small>
                </button>
              ))}
            </div>
          ) : searched ? (
            <div className="booking-empty">
              <strong>No table matches this search.</strong>
              <p>Try another arrival time, dining area or guest count.</p>
            </div>
          ) : (
            <div className="booking-empty">
              <strong>Your table search starts here.</strong>
              <p>Choose the reservation details above to see the available dining room tables.</p>
            </div>
          )}
        </div>

        <aside className="booking-summary">
          <p className="eyebrow gold">Reservation summary</p>
          <h2>{selectedTable ? selectedTable.table_number : 'Select a table'}</h2>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{displayDate(draft.reservation_date)}</dd>
            </div>
            <div>
              <dt>Arrival</dt>
              <dd>{draft.start_time}</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd>{draft.guest_count}</dd>
            </div>
            <div>
              <dt>Area</dt>
              <dd>{selectedTable?.area || draft.area || 'Any area'}</dd>
            </div>
          </dl>
          <label className="booking-note">
            <span>Special notes</span>
            <textarea
              maxLength="500"
              placeholder="Dietary notes or a special occasion..."
              value={draft.special_notes}
              onChange={(event) => changeDraft({ special_notes: event.target.value })}
            />
          </label>
          {!isAuthenticated && (
            <p className="booking-login-note">
              Already have a profile? <Link to="/login?returnTo=/booking/tables">Sign in</Link>
            </p>
          )}
          <button className="gold-button full" type="button" disabled={!selectedTable || submitting} onClick={createReservation}>
            {submitting ? 'Confirming...' : isAuthenticated ? 'Confirm reservation' : 'Sign in to reserve'}
          </button>
        </aside>
      </section>
    </main>
  );
}
