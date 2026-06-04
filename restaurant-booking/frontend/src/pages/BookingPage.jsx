import { useState } from 'react';
import { Armchair, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Minus, Plus, UsersRound } from 'lucide-react';
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

const timeSlots = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const updateDraft = (current, patch) => {
  const next = { ...current, ...patch };
  saveBookingDraft(next);
  return next;
};

const dateTextFromISO = (value) => {
  if (!value) return '';
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
};

const isoFromDateText = (value) => {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = new Date().getFullYear();
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const monthStartISO = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
};

const shiftMonth = (value, amount) => {
  const date = new Date(`${value}T00:00:00`);
  date.setMonth(date.getMonth() + amount, 1);
  return monthStartISO(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
};

const monthLabel = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

const calendarCells = (monthISO) => {
  const date = new Date(`${monthISO}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay }, (_, index) => ({ key: `blank-${index}`, blank: true }));
  const days = Array.from({ length: lastDate }, (_, index) => {
    const day = index + 1;
    return {
      key: `${year}-${month}-${day}`,
      label: day,
      iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  });
  return [...blanks, ...days];
};

export function BookingPage() {
  const [draft, setDraft] = useState(getBookingDraft);
  const [dateText, setDateText] = useState(() => dateTextFromISO(getBookingDraft().reservation_date));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStartISO(getBookingDraft().reservation_date));
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

  const changeDateText = (value) => {
    setDateText(value);
    const parsed = isoFromDateText(value);
    if (parsed) {
      setCalendarMonth(monthStartISO(parsed));
      changeDraft({ reservation_date: parsed, table_id: null });
    }
  };

  const selectDate = (value) => {
    setDateText(dateTextFromISO(value));
    setCalendarMonth(monthStartISO(value));
    setCalendarOpen(false);
    changeDraft({ reservation_date: value, table_id: null });
  };

  const changeGuests = (amount) => {
    changeDraft({ guest_count: Math.min(30, Math.max(1, Number(draft.guest_count || 1) + amount)), table_id: null });
  };

  const findTables = async (event) => {
    event.preventDefault();
    const parsedDate = isoFromDateText(dateText);
    if (!parsedDate) {
      setError('Enter the date as DD/MM or choose it from the calendar.');
      setSearched(false);
      return;
    }
    if (parsedDate < todayISO()) {
      setError('Please choose today or a future date.');
      setSearched(false);
      return;
    }
    if (parsedDate !== draft.reservation_date) {
      changeDraft({ reservation_date: parsedDate, table_id: null });
    }
    setLoading(true);
    setError('');
    setSearched(true);
    changeDraft({ table_id: null });
    try {
      const { data } = await api.get('/api/tables/availability', {
        params: {
          date: parsedDate,
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

          <div className="booking-plan-grid">
            <div className="booking-control-card booking-calendar-card">
              <div className="booking-control-label">
                <CalendarDays size={17} />
                <span>Date</span>
              </div>
              <button className="booking-date-display" type="button" onClick={() => setCalendarOpen((value) => !value)}>
                <strong>{dateText}</strong>
                <small>{displayDate(draft.reservation_date)}</small>
              </button>
              <input
                className="booking-inline-date"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM"
                value={dateText}
                onChange={(event) => changeDateText(event.target.value)}
                maxLength="5"
                aria-label="Reservation date as DD/MM"
                required
              />
              {calendarOpen && (
                <div className="booking-calendar-popover">
                  <div className="booking-calendar-head">
                    <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth((value) => shiftMonth(value, -1))}>
                      <ChevronLeft size={16} />
                    </button>
                    <strong>{monthLabel(calendarMonth)}</strong>
                    <button type="button" aria-label="Next month" onClick={() => setCalendarMonth((value) => shiftMonth(value, 1))}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="booking-calendar-week">
                    {weekDays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="booking-calendar-days">
                    {calendarCells(calendarMonth).map((cell) =>
                      cell.blank ? (
                        <span key={cell.key} />
                      ) : (
                        <button
                          className={cell.iso === draft.reservation_date ? 'selected' : ''}
                          disabled={cell.iso < todayISO()}
                          key={cell.key}
                          type="button"
                          onClick={() => selectDate(cell.iso)}
                        >
                          {cell.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="booking-control-card booking-time-card">
              <div className="booking-control-label">
                <Clock3 size={17} />
                <span>Arrival time</span>
              </div>
              <div className="booking-time-slots">
                {timeSlots.map((slot) => (
                  <button
                    className={draft.start_time === slot ? 'selected' : ''}
                    key={slot}
                    type="button"
                    onClick={() => changeDraft({ start_time: slot, table_id: null })}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-control-card booking-guests-card">
              <div className="booking-control-label">
                <UsersRound size={17} />
                <span>Guests</span>
              </div>
              <div className="booking-guest-stepper">
                <button type="button" aria-label="Reduce guests" onClick={() => changeGuests(-1)}>
                  <Minus size={16} />
                </button>
                <strong>{draft.guest_count}</strong>
                <button type="button" aria-label="Add guests" onClick={() => changeGuests(1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="booking-control-card booking-area-card">
              <div className="booking-control-label">
                <MapPin size={17} />
                <span>Dining area</span>
              </div>
              <div className="booking-area-options">
                {areas.map((area) => (
                  <button
                    className={draft.area === area.value ? 'selected' : ''}
                    key={area.value || 'any'}
                    type="button"
                    onClick={() => changeDraft({ area: area.value, table_id: null })}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
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
