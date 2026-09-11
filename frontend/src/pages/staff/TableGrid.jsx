const STATUS_TEXT = {
  waiting: 'Chờ khách',
  serving: 'Đang phục vụ',
  done: 'Hoàn tất',
  cancelled: 'Đã huỷ',
  no_show: 'No-show',
  available: 'Bàn trống',
  maintenance: 'Bảo trì',
};

/**
 * Bottom strip — visual overview of all tables with colour-coded status chips.
 */
export function TableGrid({ tables, reservations, selectedTableId, onSelectTable }) {
  const tableState = (table) => {
    if (table.status === 'maintenance') return 'maintenance';
    const active = reservations.find(
      (r) =>
        Number(r.table_id) === Number(table.id) &&
        ['waiting', 'serving'].includes(r.uiStatus),
    );
    return active?.uiStatus || 'available';
  };

  return (
    <section className="staff-table-strip">
      <div className="staff-table-head">
        <strong>Tổng quan bàn</strong>
        <span>Bấm vào bàn để xem đơn và món khách đã chọn</span>
      </div>
      <div className="staff-table-grid">
        {tables.map((table) => {
          const state = tableState(table);
          const booking = reservations.find((r) => Number(r.table_id) === Number(table.id));
          return (
            <button
              className={`staff-table-chip ${state} ${Number(table.id) === Number(selectedTableId) ? 'selected' : ''}`}
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table.id)}
            >
              <strong>{table.name}</strong>
              <span>{STATUS_TEXT[state]}</span>
              <span>
                {booking
                  ? `${String(booking.start_time).slice(0, 5)} / ${booking.user_name || 'Khách'}`
                  : `${table.seats} ghế`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
