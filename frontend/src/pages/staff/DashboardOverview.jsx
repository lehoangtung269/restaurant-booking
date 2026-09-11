import { Download } from 'lucide-react';
import { displayDate, money } from '../../lib/format';

/**
 * Dashboard overview + Reports tab content (Manager only).
 */
export function DashboardOverview({
  dashboard,
  reservations,
  stats,
  selectedDate,
  managerLoading,
  onRefresh,
  onGoToReservations,
  onGoToReports,
  onExportCsv,
  activeModule,
}) {
  if (activeModule === 'reports') {
    return (
      <section className="staff-management-shell">
        <div className="staff-management-head">
          <div>
            <p className="staff-eyebrow">Reports</p>
            <h1>Thống kê nhà hàng</h1>
          </div>
          <button className="staff-main-action compact" type="button" onClick={onExportCsv}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        <div className="staff-status-grid">
          <div>
            <strong>{money(dashboard.revenue?.total_pre_order_revenue || 0)}</strong>
            <span>doanh thu pre-order</span>
          </div>
          <div>
            <strong>{dashboard.revenue?.total_completed_reservations || 0}</strong>
            <span>đặt bàn hoàn tất</span>
          </div>
          <div>
            <strong>{dashboard.occupancy?.total_booked || 0}</strong>
            <span>slot đã đặt</span>
          </div>
          <div>
            <strong>{dashboard.overview?.no_show_rate || '0.0%'}</strong>
            <span>tỷ lệ no-show</span>
          </div>
        </div>

        <div className="staff-management-grid">
          <article className="staff-panel">
            <div className="staff-list-toolbar">
              <strong>Doanh thu chi tiết</strong>
              <span>Tháng này</span>
            </div>
            <div className="staff-data-list">
              {dashboard.revenue?.breakdown?.map((row) => (
                <article key={row.period}>
                  <div>
                    <strong>Kỳ {row.period}</strong>
                    <span>{row.completed_reservations} đặt bàn hoàn tất</span>
                  </div>
                  <strong>{money(row.pre_order_revenue)}</strong>
                </article>
              ))}
              {!dashboard.revenue?.breakdown?.length && (
                <p className="staff-muted">Chưa có dữ liệu doanh thu.</p>
              )}
            </div>
          </article>

          <article className="staff-panel">
            <div className="staff-list-toolbar">
              <strong>Top món đặt trước</strong>
              <span>Theo số lượng</span>
            </div>
            <div className="staff-data-list">
              {dashboard.topItems?.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.item_name}</strong>
                    <span>{item.category_name} / {item.total_ordered} đặt</span>
                  </div>
                  <strong>{money(item.total_revenue)}</strong>
                </article>
              ))}
              {!dashboard.topItems?.length && (
                <p className="staff-muted">Chưa có dữ liệu pre-order.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    );
  }

  // Default: overview dashboard
  return (
    <section className="staff-management-shell">
      <div className="staff-management-head">
        <div>
          <p className="staff-eyebrow">Management dashboard</p>
          <h1>Hôm nay tại Maison Edem</h1>
        </div>
        <button
          className="staff-main-action compact"
          type="button"
          onClick={onRefresh}
          disabled={managerLoading}
        >
          {managerLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="staff-status-grid">
        <div>
          <strong>{dashboard.overview?.total_reservations ?? reservations.length}</strong>
          <span>đặt bàn hôm nay</span>
        </div>
        <div>
          <strong>{dashboard.overview?.reservations?.CONFIRMED ?? stats.waiting}</strong>
          <span>chờ check-in</span>
        </div>
        <div>
          <strong>{dashboard.overview?.total_customers ?? 0}</strong>
          <span>khách hàng</span>
        </div>
        <div>
          <strong>{dashboard.occupancy?.occupancy_rate || '0.0%'}</strong>
          <span>tỷ lệ lấp đầy</span>
        </div>
      </div>

      <div className="staff-management-grid">
        <article className="staff-panel">
          <div className="staff-list-toolbar">
            <div>
              <strong>Đặt bàn hôm nay</strong>
              <span>{displayDate(selectedDate)}</span>
            </div>
            <button type="button" onClick={onGoToReservations}>Xem flow</button>
          </div>
          <div className="staff-mini-list">
            {[...reservations]
              .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
              .slice(0, 6)
              .map((r) => (
                <div key={r.id}>
                  <strong>{String(r.start_time).slice(0, 5)} / {r.table_number}</strong>
                  <span>{r.user_name || 'Khách'} / {r.status}</span>
                </div>
              ))}
            {!reservations.length && (
              <p className="staff-muted">Không có đặt bàn trong ngày đang chọn.</p>
            )}
          </div>
        </article>

        <article className="staff-panel">
          <div className="staff-list-toolbar">
            <div>
              <strong>Top món đặt trước</strong>
              <span>Tín hiệu bếp</span>
            </div>
            <button type="button" onClick={onGoToReports}>Báo cáo</button>
          </div>
          <div className="staff-mini-list">
            {dashboard.topItems?.slice(0, 6).map((item) => (
              <div key={item.id}>
                <strong>{item.item_name}</strong>
                <span>
                  {item.category_name} / {item.total_ordered} đặt / {money(item.total_revenue)}
                </span>
              </div>
            ))}
            {!dashboard.topItems?.length && (
              <p className="staff-muted">Chưa có dữ liệu pre-order.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
