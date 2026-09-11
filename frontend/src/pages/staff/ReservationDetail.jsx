import { ClipboardList, StickyNote } from 'lucide-react';
import { displayDate } from '../../lib/format';

const STATUS_TEXT = {
  waiting: 'Chờ khách',
  serving: 'Đang phục vụ',
  done: 'Hoàn tất',
  cancelled: 'Đã huỷ',
  no_show: 'No-show',
  available: 'Bàn trống',
  maintenance: 'Bảo trì',
};

const primaryAction = (reservation) => {
  if (reservation.status === 'CONFIRMED') return { label: 'Check-in', status: 'SEATED' };
  if (reservation.status === 'SEATED') return { label: 'Check-out', status: 'COMPLETED' };
  return null;
};

/**
 * Side panel showing details for the selected table / reservation.
 */
export function ReservationDetail({
  selectedTable,
  selectedReservation,
  activePreOrder,
  selectedDate,
  onStatusModal,
  onNoteModal,
  onToggleMaintenance,
}) {
  if (!selectedTable) {
    return (
      <div className="staff-empty">
        <strong>Chọn một bàn</strong>
        <p>Thông tin khách và món đặt trước sẽ hiện ở đây.</p>
      </div>
    );
  }

  const action = selectedReservation ? primaryAction(selectedReservation) : null;

  return (
    <>
      <div className="staff-detail-head">
        <div>
          <h2>{selectedTable.name}</h2>
          <p>{selectedTable.seats} ghế / {selectedTable.area}</p>
        </div>
        <span className={`staff-status ${selectedReservation?.uiStatus || selectedTable.status}`}>
          {STATUS_TEXT[selectedReservation?.uiStatus || selectedTable.status]}
        </span>
      </div>

      <div className="staff-detail-body">
        {selectedReservation ? (
          <>
            <div className="staff-detail-title">
              <h3>{selectedReservation.user_name || 'Khách'}</h3>
              <p>{selectedReservation.user_phone || selectedReservation.user_email}</p>
            </div>

            <div className="staff-info-box">
              <div><span>Ngày</span><strong>{displayDate(selectedReservation.reservation_date)}</strong></div>
              <div>
                <span>Giờ</span>
                <strong>
                  {String(selectedReservation.start_time).slice(0, 5)}
                  {selectedReservation.end_time && ` – ${String(selectedReservation.end_time).slice(0, 5)}`}
                </strong>
              </div>
              <div><span>Số khách</span><strong>{selectedReservation.guest_count}</strong></div>
              <div><span>Trạng thái</span><strong>{selectedReservation.status}</strong></div>
            </div>

            <div className="staff-note-box">
              <span>Món khách đặt trước</span>
              {activePreOrder?.items?.length ? (
                activePreOrder.items.map((item) => (
                  <div className="staff-order-row" key={item.id}>
                    <strong>{item.item_name}</strong>
                    <small>x{item.quantity}{item.notes ? ` / ${item.notes}` : ''}</small>
                  </div>
                ))
              ) : (
                <p>Khách chưa đặt món trước.</p>
              )}
            </div>

            <div className="staff-note-box">
              <span>Ghi chú khách</span>
              <p>{selectedReservation.special_notes || 'Chưa có ghi chú.'}</p>
            </div>

            {action && (
              <button
                className="staff-main-action"
                type="button"
                onClick={() => onStatusModal(selectedReservation, action.status)}
              >
                {action.label}
              </button>
            )}

            <div className="staff-secondary-grid">
              <button type="button" onClick={() => onNoteModal(selectedReservation)}>
                <StickyNote size={15} /> Ghi chú
              </button>
              {action && (
                <button type="button" onClick={() => onStatusModal(selectedReservation)}>
                  <ClipboardList size={15} /> Sửa trạng thái
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="staff-detail-title">
              <h3>Chưa có đơn</h3>
              <p>{displayDate(selectedDate)}</p>
            </div>
            <div className="staff-info-box">
              <div><span>Bàn</span><strong>{selectedTable.name}</strong></div>
              <div><span>Số ghế</span><strong>{selectedTable.seats}</strong></div>
              <div><span>Trạng thái</span><strong>{STATUS_TEXT[selectedTable.status]}</strong></div>
            </div>
            <div className="staff-note-box">
              <span>Thông tin</span>
              <p>Không có khách đặt bàn này trong ngày đang xem.</p>
            </div>
            <button
              className="staff-main-action secondary"
              type="button"
              onClick={() => onToggleMaintenance(selectedTable)}
            >
              {selectedTable.status === 'maintenance' ? 'Mở lại bàn' : 'Chuyển bảo trì'}
            </button>
          </>
        )}
      </div>
    </>
  );
}
