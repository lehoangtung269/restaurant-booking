import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  Search,
  StickyNote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { useAuth } from '../contexts/authContextValue';
import { api, getErrorMessage } from '../lib/api';
import { displayDate, todayISO } from '../lib/format';

const FLOW_TABS = [
  { key: 'all', label: 'Tat ca' },
  { key: 'waiting', label: 'Cho khach' },
  { key: 'serving', label: 'Dang phuc vu' },
  { key: 'done', label: 'Hoan tat' },
  { key: 'cancelled', label: 'Da huy' },
];

const STATUS_TEXT = {
  waiting: 'Cho khach',
  serving: 'Dang phuc vu',
  done: 'Hoan tat',
  cancelled: 'Da huy',
  no_show: 'No-show',
  available: 'Ban trong',
  maintenance: 'Bao tri',
};

const MONTHS = [
  'Thang 1',
  'Thang 2',
  'Thang 3',
  'Thang 4',
  'Thang 5',
  'Thang 6',
  'Thang 7',
  'Thang 8',
  'Thang 9',
  'Thang 10',
  'Thang 11',
  'Thang 12',
];

const mapReservationStatus = (status) => {
  if (status === 'CONFIRMED') return 'waiting';
  if (status === 'SEATED') return 'serving';
  if (status === 'COMPLETED') return 'done';
  if (status === 'NO_SHOW') return 'no_show';
  if (status === 'CANCELLED') return 'cancelled';
  return 'waiting';
};

const normalizeTable = (table) => ({
  id: table.id,
  name: table.table_number || `T-${String(table.id).padStart(2, '0')}`,
  seats: table.capacity,
  area: table.area,
  status: table.status === 'MAINTENANCE' ? 'maintenance' : 'available',
});

const sortReservations = (items) => {
  const priority = { waiting: 0, serving: 1, done: 2, no_show: 3, cancelled: 4 };
  return [...items].sort(
    (a, b) =>
      (priority[a.uiStatus] ?? 9) - (priority[b.uiStatus] ?? 9) ||
      String(a.start_time).localeCompare(String(b.start_time)),
  );
};

const toMonthDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialCalendar = (selectedDate) => {
  const date = toMonthDate(selectedDate);
  return { month: date.getMonth(), year: date.getFullYear() };
};

function StaffCalendar({ selectedDate, bookingDates, onSelect }) {
  const [view, setView] = useState(() => initialCalendar(selectedDate));
  const days = useMemo(() => {
    const firstDay = new Date(view.year, view.month, 1);
    const mondayIndex = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(view.year, view.month, 1 - mondayIndex);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const iso = toISO(date);
      return {
        iso,
        number: date.getDate(),
        outside: date.getMonth() !== view.month,
        today: iso === todayISO(),
        selected: iso === selectedDate,
        hasBooking: bookingDates.has(iso),
      };
    });
  }, [bookingDates, selectedDate, view]);

  const moveMonth = (offset) => {
    const next = new Date(view.year, view.month + offset, 1);
    setView({ month: next.getMonth(), year: next.getFullYear() });
  };

  return (
    <div className="staff-calendar">
      <div className="staff-calendar-head">
        <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <strong>
          {MONTHS[view.month]} {view.year}
        </strong>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="staff-weekdays">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="staff-calendar-grid">
        {days.map((day) => (
          <button
            className={[
              'staff-calendar-day',
              day.outside ? 'outside' : '',
              day.today ? 'today' : '',
              day.selected ? 'selected' : '',
              day.hasBooking ? 'has-booking' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={day.iso}
            type="button"
            onClick={() => onSelect(day.iso)}
          >
            {day.number}
          </button>
        ))}
      </div>
      <div className="staff-calendar-footer">
        <span>Co don dat ban</span>
        <button type="button" onClick={() => onSelect(todayISO())}>
          Hom nay
        </button>
      </div>
    </div>
  );
}

function Modal({ title, description, children, onClose }) {
  return (
    <div className="staff-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="staff-modal">
        <div className="staff-modal-head">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StaffPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFlow, setActiveFlow] = useState('all');
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [preOrder, setPreOrder] = useState({ reservationId: null, data: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [manualStatus, setManualStatus] = useState('SEATED');

  const canUseStaff = isAuthenticated && ['STAFF', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    if (!canUseStaff) return;
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [tableRes, reservationRes] = await Promise.all([
          api.get('/api/tables'),
          api.get('/api/reservations', { params: { date: selectedDate } }),
        ]);
        const normalizedTables = tableRes.data.map(normalizeTable);
        const normalizedReservations = reservationRes.data.map((item) => ({
          ...item,
          uiStatus: mapReservationStatus(item.status),
        }));
        setTables(normalizedTables);
        setReservations(normalizedReservations);
        setSelectedTableId((current) => current || normalizedTables[0]?.id || null);
      } catch (err) {
        setMessage(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canUseStaff, selectedDate]);

  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const selectedReservation = selectedTable
    ? reservations.find((item) => Number(item.table_id) === Number(selectedTable.id))
    : null;

  useEffect(() => {
    if (!selectedReservation) return undefined;
    let ignore = false;
    api
      .get(`/api/pre-orders/${selectedReservation.id}`)
      .then(({ data }) => {
        if (!ignore) setPreOrder({ reservationId: selectedReservation.id, data });
      })
      .catch(() => {
        if (!ignore) setPreOrder({ reservationId: selectedReservation.id, data: null });
      });

    return () => {
      ignore = true;
    };
  }, [selectedReservation]);

  const activePreOrder = preOrder.reservationId === selectedReservation?.id ? preOrder.data : null;

  const visibleReservations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortReservations(reservations)
      .filter((item) => activeFlow === 'all' || item.uiStatus === activeFlow)
      .filter((item) => {
        if (!query) return true;
        return [
          item.user_name,
          item.user_phone,
          item.user_email,
          item.table_number,
          item.special_notes,
          item.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [activeFlow, reservations, search]);

  const stats = useMemo(() => {
    const waiting = reservations.filter((item) => item.uiStatus === 'waiting').length;
    const serving = reservations.filter((item) => item.uiStatus === 'serving').length;
    const done = reservations.filter((item) => item.uiStatus === 'done').length;
    const reservedTableIds = new Set(
      reservations.filter((item) => ['waiting', 'serving'].includes(item.uiStatus)).map((item) => Number(item.table_id)),
    );
    const available = tables.filter((table) => table.status === 'available' && !reservedTableIds.has(Number(table.id))).length;
    return { waiting, serving, done, available };
  }, [reservations, tables]);

  const bookingDates = useMemo(() => new Set(reservations.map((item) => item.reservation_date)), [reservations]);

  const tableState = (table) => {
    if (table.status === 'maintenance') return 'maintenance';
    const activeReservation = reservations.find(
      (item) => Number(item.table_id) === Number(table.id) && ['waiting', 'serving'].includes(item.uiStatus),
    );
    return activeReservation?.uiStatus || 'available';
  };

  const openStatusModal = (reservation, status) => {
    setManualStatus(status || (reservation.status === 'CONFIRMED' ? 'SEATED' : 'COMPLETED'));
    setModal({ type: 'status', reservation });
  };

  const saveStatus = async () => {
    if (!modal?.reservation) return;
    setMessage('');
    try {
      await api.patch(`/api/reservations/${modal.reservation.id}/status`, { status: manualStatus });
      const { data } = await api.get('/api/reservations', { params: { date: selectedDate } });
      setReservations(data.map((item) => ({ ...item, uiStatus: mapReservationStatus(item.status) })));
      setModal(null);
      setMessage('Da cap nhat trang thai');
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const openNoteModal = (reservation) => {
    setNoteDraft(reservation.special_notes || '');
    setModal({ type: 'note', reservation });
  };

  const saveNote = async () => {
    if (!modal?.reservation) return;
    setMessage('');
    try {
      const { data } = await api.patch(`/api/reservations/${modal.reservation.id}/note`, { note: noteDraft });
      setReservations((current) =>
        current.map((item) =>
          item.id === modal.reservation.id
            ? { ...item, special_notes: data.special_notes || noteDraft, uiStatus: mapReservationStatus(data.status || item.status) }
            : item,
        ),
      );
      setModal(null);
      setMessage('Da luu ghi chu');
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const toggleTableMaintenance = async (table) => {
    setMessage('');
    const status = table.status === 'maintenance' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.patch(`/api/tables/${table.id}/status`, { status });
      setTables((current) =>
        current.map((item) => (item.id === table.id ? { ...item, status: status === 'MAINTENANCE' ? 'maintenance' : 'available' } : item)),
      );
      setMessage(status === 'MAINTENANCE' ? 'Da chuyen ban sang bao tri' : 'Ban da hoat dong lai');
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const primaryAction = (reservation) => {
    if (reservation.status === 'CONFIRMED') return { label: 'Check-in', status: 'SEATED' };
    if (reservation.status === 'SEATED') return { label: 'Check-out', status: 'COMPLETED' };
    return null;
  };

  if (!isAuthenticated) {
    return (
      <main className="staff-page locked">
        <div className="staff-locked-panel">
          <p className="staff-eyebrow">Staff Console</p>
          <h1>Dang nhap de tiep tuc</h1>
          <p>Phan nhan vien can tai khoan STAFF hoac MANAGER.</p>
          <Link className="staff-primary-link" to="/staff/login">
            Staff login
          </Link>
        </div>
      </main>
    );
  }

  if (!canUseStaff) {
    return (
      <main className="staff-page locked">
        <div className="staff-locked-panel">
          <p className="staff-eyebrow">Staff Console</p>
          <h1>Khong co quyen truy cap</h1>
          <p>Tai khoan hien tai khong phai STAFF/MANAGER.</p>
          <Link className="staff-primary-link" to="/">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="staff-page">
      <Toast message={message} />
      <header className="staff-topbar">
        <div className="staff-brand">
          <div className="staff-brand-mark">M</div>
          <div>
            <strong>Maison Edem</strong>
            <span>Staff Console</span>
          </div>
        </div>
        <div className="staff-top-actions">
          <div className="staff-date-picker">
            <button className={calendarOpen ? 'active' : ''} type="button" onClick={() => setCalendarOpen((value) => !value)}>
              <CalendarDays size={16} />
              <span>
                <small>Xem ngay</small>
                {selectedDate}
              </span>
            </button>
            {calendarOpen && (
              <StaffCalendar
                bookingDates={bookingDates}
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
              />
            )}
          </div>
          <label className="staff-search">
            <Search size={15} />
            <input
              value={search}
              placeholder="Tim khach, lien he hoac ban..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button className="staff-logout" type="button" onClick={logout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>

      <section className="staff-status-grid">
        <div>
          <strong>{stats.waiting}</strong>
          <span>cho check-in</span>
        </div>
        <div>
          <strong>{stats.serving}</strong>
          <span>dang phuc vu</span>
        </div>
        <div>
          <strong>{stats.done}</strong>
          <span>hoan tat</span>
        </div>
        <div>
          <strong>{stats.available}</strong>
          <span>ban trong</span>
        </div>
      </section>

      <section className="staff-main-layout">
        <div className="staff-panel">
          <div className="staff-list-toolbar">
            <div>
              <strong>Don dat ban</strong>
              <span>{displayDate(selectedDate)}</span>
            </div>
            <div className="staff-flow-tabs">
              {FLOW_TABS.map((tab) => (
                <button
                  className={activeFlow === tab.key ? 'active' : ''}
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFlow(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="staff-flow-list">
            {loading ? (
              <div className="staff-empty">Dang tai du lieu...</div>
            ) : visibleReservations.length ? (
              visibleReservations.map((reservation) => {
                const action = primaryAction(reservation);
                return (
                  <article
                    className={Number(reservation.table_id) === Number(selectedTableId) ? 'staff-flow-item selected' : 'staff-flow-item'}
                    key={reservation.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTableId(reservation.table_id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedTableId(reservation.table_id);
                      }
                    }}
                  >
                    <div className="staff-time">{String(reservation.start_time).slice(0, 5)}</div>
                    <div className="staff-guest">
                      <strong>{reservation.user_name || 'Guest'}</strong>
                      <span>
                        {reservation.table_number} / {reservation.guest_count} khach / {reservation.user_phone || reservation.user_email || 'No contact'}
                      </span>
                      {reservation.special_notes && <em>{reservation.special_notes}</em>}
                    </div>
                    <div className="staff-action-zone" onClick={(event) => event.stopPropagation()}>
                      <span className={`staff-status ${reservation.uiStatus}`}>{STATUS_TEXT[reservation.uiStatus]}</span>
                      {action && (
                        <button type="button" onClick={() => openStatusModal(reservation, action.status)}>
                          {action.label}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="staff-empty">
                <strong>Chua co don dat ban</strong>
                <p>Ngay nay hien chua co khach dat ban hoac khong khop bo loc.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="staff-panel staff-detail">
          {!selectedTable ? (
            <div className="staff-empty">
              <strong>Chon mot ban</strong>
              <p>Thong tin khach va mon dat truoc se hien o day.</p>
            </div>
          ) : (
            <>
              <div className="staff-detail-head">
                <div>
                  <h2>{selectedTable.name}</h2>
                  <p>
                        {selectedTable.seats} ghe / {selectedTable.area}
                  </p>
                </div>
                <span className={`staff-status ${selectedReservation?.uiStatus || selectedTable.status}`}>
                  {STATUS_TEXT[selectedReservation?.uiStatus || selectedTable.status]}
                </span>
              </div>
              <div className="staff-detail-body">
                {selectedReservation ? (
                  <>
                    <div className="staff-detail-title">
                      <h3>{selectedReservation.user_name || 'Guest'}</h3>
                      <p>{selectedReservation.user_phone || selectedReservation.user_email}</p>
                    </div>
                    <div className="staff-info-box">
                      <div>
                        <span>Ngay</span>
                        <strong>{displayDate(selectedReservation.reservation_date)}</strong>
                      </div>
                      <div>
                        <span>Gio</span>
                        <strong>
                          {String(selectedReservation.start_time).slice(0, 5)} - {String(selectedReservation.end_time).slice(0, 5)}
                        </strong>
                      </div>
                      <div>
                        <span>So khach</span>
                        <strong>{selectedReservation.guest_count}</strong>
                      </div>
                      <div>
                        <span>Trang thai</span>
                        <strong>{selectedReservation.status}</strong>
                      </div>
                    </div>
                    <div className="staff-note-box">
                      <span>Mon khach dat truoc</span>
                      {activePreOrder?.items?.length ? (
                        activePreOrder.items.map((item) => (
                          <div className="staff-order-row" key={item.id}>
                            <strong>{item.item_name}</strong>
                            <small>
                              x{item.quantity} {item.notes ? `/ ${item.notes}` : ''}
                            </small>
                          </div>
                        ))
                      ) : (
                        <p>Khach chua dat mon truoc.</p>
                      )}
                    </div>
                    <div className="staff-note-box">
                      <span>Ghi chu khach</span>
                      <p>{selectedReservation.special_notes || 'Chua co ghi chu.'}</p>
                    </div>
                    {primaryAction(selectedReservation) && (
                      <button
                        className="staff-main-action"
                        type="button"
                        onClick={() => openStatusModal(selectedReservation, primaryAction(selectedReservation).status)}
                      >
                        {primaryAction(selectedReservation).label}
                      </button>
                    )}
                    <div className="staff-secondary-grid">
                      <button type="button" onClick={() => openNoteModal(selectedReservation)}>
                        <StickyNote size={15} />
                        Ghi chu
                      </button>
                      {primaryAction(selectedReservation) && (
                        <button type="button" onClick={() => openStatusModal(selectedReservation)}>
                          <ClipboardList size={15} />
                          Sua trang thai
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="staff-detail-title">
                      <h3>Chua co don</h3>
                      <p>{displayDate(selectedDate)}</p>
                    </div>
                    <div className="staff-info-box">
                      <div>
                        <span>Ban</span>
                        <strong>{selectedTable.name}</strong>
                      </div>
                      <div>
                        <span>So ghe</span>
                        <strong>{selectedTable.seats}</strong>
                      </div>
                      <div>
                        <span>Trang thai</span>
                        <strong>{STATUS_TEXT[selectedTable.status]}</strong>
                      </div>
                    </div>
                    <div className="staff-note-box">
                      <span>Thong tin</span>
                      <p>Khong co khach dat ban nay trong ngay dang xem.</p>
                    </div>
                    <button className="staff-main-action secondary" type="button" onClick={() => toggleTableMaintenance(selectedTable)}>
                      {selectedTable.status === 'maintenance' ? 'Mo lai ban' : 'Chuyen bao tri'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </aside>
      </section>

      <section className="staff-table-strip">
        <div className="staff-table-head">
          <strong>Tong quan ban</strong>
          <span>Bam vao ban de xem don va mon khach da chon</span>
        </div>
        <div className="staff-table-grid">
          {tables.map((table) => {
            const state = tableState(table);
            const booking = reservations.find((item) => Number(item.table_id) === Number(table.id));
            return (
              <button
                className={`staff-table-chip ${state} ${Number(table.id) === Number(selectedTableId) ? 'selected' : ''}`}
                key={table.id}
                type="button"
                onClick={() => setSelectedTableId(table.id)}
              >
                <strong>{table.name}</strong>
                <span>{STATUS_TEXT[state]}</span>
                <span>{booking ? `${String(booking.start_time).slice(0, 5)} / ${booking.user_name || 'Guest'}` : `${table.seats} ghe`}</span>
              </button>
            );
          })}
        </div>
      </section>

      {modal?.type === 'status' && (
        <Modal
          title="Sua trang thai"
          description={`${modal.reservation.user_name || 'Guest'} / ${modal.reservation.table_number}`}
          onClose={() => setModal(null)}
        >
          <div className="staff-modal-body">
            <select value={manualStatus} onChange={(event) => setManualStatus(event.target.value)}>
              {modal.reservation.status === 'CONFIRMED' && <option value="SEATED">Check-in / SEATED</option>}
              {modal.reservation.status === 'CONFIRMED' && <option value="CANCELLED">Huy don</option>}
              {modal.reservation.status === 'CONFIRMED' && <option value="NO_SHOW">No-show</option>}
              {modal.reservation.status === 'SEATED' && <option value="COMPLETED">Check-out / COMPLETED</option>}
              {modal.reservation.status === 'SEATED' && <option value="CANCELLED">Huy don</option>}
            </select>
          </div>
          <div className="staff-modal-actions">
            <button type="button" onClick={() => setModal(null)}>
              Huy
            </button>
            <button className="primary" type="button" onClick={saveStatus}>
              Xac nhan
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'note' && (
        <Modal
          title="Ghi chu nhanh"
          description={`${modal.reservation.user_name || 'Guest'} / ${modal.reservation.table_number}`}
          onClose={() => setModal(null)}
        >
          <div className="staff-modal-body">
            <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
          </div>
          <div className="staff-modal-actions">
            <button type="button" onClick={() => setModal(null)}>
              Huy
            </button>
            <button className="primary" type="button" onClick={saveNote}>
              Luu
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
