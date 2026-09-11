import { useMemo } from 'react';
import { displayDate } from '../../lib/format';

const FLOW_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting', label: 'Chờ khách' },
  { key: 'serving', label: 'Đang phục vụ' },
  { key: 'done', label: 'Hoàn tất' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const STATUS_TEXT = {
  waiting: 'Chờ khách',
  serving: 'Đang phục vụ',
  done: 'Hoàn tất',
  cancelled: 'Đã huỷ',
  no_show: 'No-show',
};

const primaryAction = (reservation) => {
  if (reservation.status === 'CONFIRMED') return { label: 'Check-in', status: 'SEATED' };
  if (reservation.status === 'SEATED') return { label: 'Check-out', status: 'COMPLETED' };
  return null;
};

const sortReservations = (items) => {
  const priority = { waiting: 0, serving: 1, done: 2, no_show: 3, cancelled: 4 };
  return [...items].sort(
    (a, b) =>
      (priority[a.uiStatus] ?? 9) - (priority[b.uiStatus] ?? 9) ||
      String(a.start_time).localeCompare(String(b.start_time)),
  );
};

/**
 * Left panel — reservation list with flow tabs and search filter.
 */
export function ReservationFlow({
  reservations,
  selectedTableId,
  selectedDate,
  search,
  activeFlow,
  loading,
  onSelectTable,
  onFlowChange,
  onStatusModal,
}) {
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortReservations(reservations)
      .filter((r) => activeFlow === 'all' || r.uiStatus === activeFlow)
      .filter((r) => {
        if (!q) return true;
        return [r.user_name, r.user_phone, r.user_email, r.table_number, r.special_notes, r.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      });
  }, [activeFlow, reservations, search]);

  return (
    <div className="staff-panel">
      <div className="staff-list-toolbar">
        <div>
          <strong>Đơn đặt bàn</strong>
          <span>{displayDate(selectedDate)}</span>
        </div>
        <div className="staff-flow-tabs">
          {FLOW_TABS.map((tab) => (
            <button
              className={activeFlow === tab.key ? 'active' : ''}
              key={tab.key}
              type="button"
              onClick={() => onFlowChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="staff-flow-list">
        {loading ? (
          <div className="staff-empty">Đang tải dữ liệu...</div>
        ) : visible.length ? (
          visible.map((reservation) => {
            const action = primaryAction(reservation);
            return (
              <article
                className={
                  Number(reservation.table_id) === Number(selectedTableId)
                    ? 'staff-flow-item selected'
                    : 'staff-flow-item'
                }
                key={reservation.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTable(reservation.table_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTable(reservation.table_id);
                  }
                }}
              >
                <div className="staff-time">{String(reservation.start_time).slice(0, 5)}</div>
                <div className="staff-guest">
                  <strong>{reservation.user_name || 'Khách'}</strong>
                  <span>
                    {reservation.table_number} / {reservation.guest_count} khách /{' '}
                    {reservation.user_phone || reservation.user_email || 'Không có liên hệ'}
                  </span>
                  {reservation.special_notes && <em>{reservation.special_notes}</em>}
                </div>
                <div className="staff-action-zone" onClick={(e) => e.stopPropagation()}>
                  <span className={`staff-status ${reservation.uiStatus}`}>
                    {STATUS_TEXT[reservation.uiStatus]}
                  </span>
                  {action && (
                    <button
                      type="button"
                      onClick={() => onStatusModal(reservation, action.status)}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="staff-empty">
            <strong>Chưa có đơn đặt bàn</strong>
            <p>Ngày này chưa có khách đặt bàn hoặc không khớp bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
}
