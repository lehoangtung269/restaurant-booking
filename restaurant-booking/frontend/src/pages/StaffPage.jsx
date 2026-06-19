import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, ChefHat, LayoutDashboard, LogOut, Search, Table2, UsersRound } from 'lucide-react';
import { useAuth } from '../contexts/authContextValue';
import { useToast } from '../contexts/ToastContext';
import { api, getErrorMessage } from '../lib/api';
import { todayISO } from '../lib/format';
import { CustomSelect } from '../components/CustomSelect';

// ── Sub-components ────────────────────────────────────────────────────────────
import { StaffCalendar } from './staff/StaffCalendar';
import { StaffModal } from './staff/StaffModal';
import { ReservationFlow } from './staff/ReservationFlow';
import { ReservationDetail } from './staff/ReservationDetail';
import { TableGrid } from './staff/TableGrid';
import { DashboardOverview } from './staff/DashboardOverview';
import {
  TablesManagement,
  MenuManagement,
  AccountsManagement,
  emptyTableForm,
  emptyMenuForm,
  emptyUserForm,
} from './staff/ManagementPanels';

// ── Constants ─────────────────────────────────────────────────────────────────
const STAFF_MODULES = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard, managerOnly: true },
  { key: 'reservations', label: 'Reservations', icon: CalendarDays },
  { key: 'tables', label: 'Tables', icon: Table2 },
  { key: 'menu', label: 'Menu', icon: ChefHat, managerOnly: true },
  { key: 'accounts', label: 'Staff', icon: UsersRound, managerOnly: true },
  { key: 'reports', label: 'Reports', icon: BarChart3, managerOnly: true },
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

const normalizeReservation = (item) => ({
  ...item,
  uiStatus: mapReservationStatus(item.status),
});

// ── Main Component ────────────────────────────────────────────────────────────
export function StaffPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const canManage = user?.role === 'MANAGER';

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState(canManage ? 'overview' : 'reservations');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFlow, setActiveFlow] = useState('all');
  const [modal, setModal] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [manualStatus, setManualStatus] = useState('SEATED');

  // ── Data state ────────────────────────────────────────────────────────────
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [preOrder, setPreOrder] = useState({ reservationId: null, data: null });
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [dashboard, setDashboard] = useState({ overview: null, revenue: null, occupancy: null, topItems: [] });

  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [userForm, setUserForm] = useState(emptyUserForm);

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentModule = !canManage && ['overview', 'menu', 'accounts', 'reports'].includes(activeModule)
    ? 'reservations'
    : activeModule;

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedReservation = selectedTable
    ? reservations.find((r) => Number(r.table_id) === Number(selectedTable.id))
    : null;

  const stats = useMemo(() => {
    const waiting = reservations.filter((r) => r.uiStatus === 'waiting').length;
    const serving = reservations.filter((r) => r.uiStatus === 'serving').length;
    const done = reservations.filter((r) => r.uiStatus === 'done').length;
    const reserved = new Set(
      reservations
        .filter((r) => ['waiting', 'serving'].includes(r.uiStatus))
        .map((r) => Number(r.table_id)),
    );
    const available = tables.filter((t) => t.status === 'available' && !reserved.has(Number(t.id))).length;
    return { waiting, serving, done, available };
  }, [reservations, tables]);

  const bookingDates = useMemo(
    () => new Set(reservations.map((r) => r.reservation_date)),
    [reservations],
  );

  const activePreOrder =
    preOrder.reservationId === selectedReservation?.id ? preOrder.data : null;

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);

      const loadTables = api.get('/api/tables')
        .then((res) => {
          if (ignore) return;
          const normalizedTables = res.data.map(normalizeTable);
          setTables(normalizedTables);
          setSelectedTableId((cur) => cur || normalizedTables[0]?.id || null);
        })
        .catch((err) => {
          if (!ignore) toast.error(`Tables error: ${getErrorMessage(err)}`);
        });

      const loadReservations = api.get('/api/reservations', { params: { date: selectedDate } })
        .then((res) => {
          if (ignore) return;
          setReservations(res.data.map(normalizeReservation));
        })
        .catch((err) => {
          if (!ignore) toast.error(getErrorMessage(err));
        });

      try {
        await Promise.allSettled([loadTables, loadReservations]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [selectedDate, toast]);

  const loadManagerData = useCallback(async () => {
    if (!canManage) return;
    setManagerLoading(true);
    const today = todayISO();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    try {
      const [catRes, itemRes, userRes, overviewRes, revenueRes, occupancyRes, topRes] =
        await Promise.all([
          api.get('/api/menu/categories'),
          api.get('/api/menu/items'),
          api.get('/api/users'),
          api.get('/api/dashboard/overview', { params: { from: today, to: today } }),
          api.get('/api/dashboard/revenue', { params: { year, month } }),
          api.get('/api/dashboard/occupancy', { params: { from: today, to: today } }),
          api.get('/api/dashboard/top-items', { params: { from: today, to: today, limit: 6 } }),
        ]);
      setCategories(catRes.data);
      setMenuItems(itemRes.data);
      setUsers(userRes.data);
      setDashboard({
        overview: overviewRes.data,
        revenue: revenueRes.data,
        occupancy: occupancyRes.data,
        topItems: topRes.data,
      });
      setMenuForm((cur) => ({ ...cur, category_id: cur.category_id || catRes.data[0]?.id || '' }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setManagerLoading(false);
    }
  }, [canManage, toast]);

  useEffect(() => {
    if (!canManage) return;
    const timer = setTimeout(() => {
      loadManagerData();
    }, 0);
    return () => clearTimeout(timer);
  }, [canManage, loadManagerData]);

  // Pre-order for selected reservation
  useEffect(() => {
    if (!selectedReservation) return;
    let ignore = false;
    api
      .get(`/api/pre-orders/${selectedReservation.id}`)
      .then(({ data }) => { if (!ignore) setPreOrder({ reservationId: selectedReservation.id, data }); })
      .catch(() => { if (!ignore) setPreOrder({ reservationId: selectedReservation.id, data: null }); });
    return () => { ignore = true; };
  }, [selectedReservation]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openStatusModal = (reservation, status) => {
    setManualStatus(status || (reservation.status === 'CONFIRMED' ? 'SEATED' : 'COMPLETED'));
    setModal({ type: 'status', reservation });
  };

  const saveStatus = async () => {
    if (!modal?.reservation) return;
    try {
      await api.patch(`/api/reservations/${modal.reservation.id}/status`, { status: manualStatus });
      const { data } = await api.get('/api/reservations', { params: { date: selectedDate } });
      setReservations(data.map(normalizeReservation));
      setModal(null);
      toast.success('Đã cập nhật trạng thái');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openNoteModal = (reservation) => {
    setNoteDraft(reservation.special_notes || '');
    setModal({ type: 'note', reservation });
  };

  const saveNote = async () => {
    if (!modal?.reservation) return;
    try {
      const { data } = await api.patch(`/api/reservations/${modal.reservation.id}/note`, { note: noteDraft });
      setReservations((cur) =>
        cur.map((r) =>
          r.id === modal.reservation.id
            ? { ...r, special_notes: data.special_notes || noteDraft, uiStatus: mapReservationStatus(data.status || r.status) }
            : r,
        ),
      );
      setModal(null);
      toast.success('Đã lưu ghi chú');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleTableMaintenance = async (table) => {
    const newStatus = table.status === 'maintenance' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.patch(`/api/tables/${table.id}/status`, { status: newStatus });
      setTables((cur) =>
        cur.map((t) =>
          t.id === table.id
            ? { ...t, status: newStatus === 'MAINTENANCE' ? 'maintenance' : 'available' }
            : t,
        ),
      );
      toast.success(newStatus === 'MAINTENANCE' ? 'Đã chuyển bàn sang bảo trì' : 'Bàn đã hoạt động lại');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const saveTable = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      const payload = {
        table_number: tableForm.table_number.trim(),
        capacity: Number(tableForm.capacity),
        area: tableForm.area,
        status: tableForm.status,
      };
      if (tableForm.id) {
        await api.put(`/api/tables/${tableForm.id}`, { table_number: payload.table_number, capacity: payload.capacity, status: payload.status });
      } else {
        await api.post('/api/tables', payload);
      }
      const { data } = await api.get('/api/tables');
      setTables(data.map(normalizeTable));
      setTableForm(emptyTableForm);
      toast.success(tableForm.id ? 'Đã cập nhật bàn' : 'Đã thêm bàn mới');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const deleteTable = async (table) => {
    if (!canManage) return;
    try {
      await api.delete(`/api/tables/${table.id}`);
      setTables((cur) => cur.filter((t) => t.id !== table.id));
      toast.success('Đã xoá bàn');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const saveMenuItem = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      const payload = {
        name: menuForm.name.trim(),
        category_id: Number(menuForm.category_id),
        price: Number(menuForm.price),
        description: menuForm.description.trim() || undefined,
        image_url: menuForm.image_url.trim() || undefined,
        is_available: Boolean(menuForm.is_available),
      };
      if (menuForm.id) await api.put(`/api/menu/items/${menuForm.id}`, payload);
      else await api.post('/api/menu/items', payload);
      const { data } = await api.get('/api/menu/items');
      setMenuItems(data);
      setMenuForm({ ...emptyMenuForm, category_id: categories[0]?.id || '' });
      toast.success(menuForm.id ? 'Đã cập nhật món' : 'Đã thêm món mới');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const deleteMenuItem = async (item) => {
    if (!canManage) return;
    try {
      await api.delete(`/api/menu/items/${item.id}`);
      setMenuItems((cur) => cur.filter((m) => m.id !== item.id));
      toast.success('Đã xoá món');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      await api.post('/api/users', userForm);
      const { data } = await api.get('/api/users');
      setUsers(data);
      setUserForm(emptyUserForm);
      toast.success('Đã tạo tài khoản');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const updateUserRole = async (targetUser, role) => {
    try {
      const { data } = await api.patch(`/api/users/${targetUser.id}/role`, { role });
      setUsers((cur) => cur.map((u) => (u.id === targetUser.id ? { ...u, ...data } : u)));
      toast.success('Đã cập nhật quyền tài khoản');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleUserActive = async (targetUser) => {
    try {
      const { data } = await api.patch(`/api/users/${targetUser.id}/active`, { is_active: !targetUser.is_active });
      setUsers((cur) => cur.map((u) => (u.id === targetUser.id ? { ...u, ...data } : u)));
      toast.success(data.is_active ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const exportReportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['total_reservations', dashboard.overview?.total_reservations || 0],
      ['total_customers', dashboard.overview?.total_customers || 0],
      ['available_tables', dashboard.overview?.total_tables || 0],
      ['revenue', dashboard.revenue?.total_pre_order_revenue || 0],
      ['occupancy_rate', dashboard.occupancy?.occupancy_rate || 0],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maison-edem-report-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="staff-page">
      {/* Top bar */}
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
            <button
              className={calendarOpen ? 'active' : ''}
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <CalendarDays size={16} />
              <span>
                <small>Xem ngày</small>
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
              placeholder="Tìm khách, liên hệ hoặc bàn..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="staff-logout" type="button" onClick={logout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      {/* Module nav */}
      <nav className="staff-module-nav" aria-label="Management sections">
        {STAFF_MODULES.filter((m) => !m.managerOnly || canManage).map((m) => {
          const Icon = m.icon;
          return (
            <button
              className={currentModule === m.key ? 'active' : ''}
              key={m.key}
              type="button"
              onClick={() => setActiveModule(m.key)}
            >
              <Icon size={16} />
              {m.label}
            </button>
          );
        })}
      </nav>

      {/* ── Reservations module ── */}
      {currentModule === 'reservations' && (
        <>
          <section className="staff-status-grid">
            <div><strong>{stats.waiting}</strong><span>chờ check-in</span></div>
            <div><strong>{stats.serving}</strong><span>đang phục vụ</span></div>
            <div><strong>{stats.done}</strong><span>hoàn tất</span></div>
            <div><strong>{stats.available}</strong><span>bàn trống</span></div>
          </section>

          <section className="staff-main-layout">
            <ReservationFlow
              reservations={reservations}
              selectedTableId={selectedTableId}
              selectedDate={selectedDate}
              search={search}
              activeFlow={activeFlow}
              loading={loading}
              onSelectTable={setSelectedTableId}
              onFlowChange={setActiveFlow}
              onStatusModal={openStatusModal}
            />

            <aside className="staff-panel staff-detail">
              <ReservationDetail
                selectedTable={selectedTable}
                selectedReservation={selectedReservation}
                activePreOrder={activePreOrder}
                selectedDate={selectedDate}
                onStatusModal={openStatusModal}
                onNoteModal={openNoteModal}
                onToggleMaintenance={toggleTableMaintenance}
              />
            </aside>
          </section>

          <TableGrid
            tables={tables}
            reservations={reservations}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
          />
        </>
      )}

      {/* ── Dashboard / Reports ── */}
      {(currentModule === 'overview' || currentModule === 'reports') && canManage && (
        <DashboardOverview
          activeModule={currentModule}
          dashboard={dashboard}
          reservations={reservations}
          stats={stats}
          selectedDate={selectedDate}
          managerLoading={managerLoading}
          onRefresh={loadManagerData}
          onGoToReservations={() => setActiveModule('reservations')}
          onGoToReports={() => setActiveModule('reports')}
          onExportCsv={exportReportCsv}
        />
      )}

      {/* ── Tables management ── */}
      {currentModule === 'tables' && (
        <TablesManagement
          tables={tables}
          tableForm={tableForm}
          setTableForm={setTableForm}
          reservations={reservations}
          onSave={saveTable}
          onDelete={deleteTable}
          onToggleMaintenance={toggleTableMaintenance}
        />
      )}

      {/* ── Menu management ── */}
      {currentModule === 'menu' && canManage && (
        <MenuManagement
          categories={categories}
          menuItems={menuItems}
          menuForm={menuForm}
          setMenuForm={setMenuForm}
          onSave={saveMenuItem}
          onDelete={deleteMenuItem}
        />
      )}

      {/* ── Accounts management ── */}
      {currentModule === 'accounts' && canManage && (
        <AccountsManagement
          users={users}
          userForm={userForm}
          setUserForm={setUserForm}
          currentUserId={user?.id}
          onCreateUser={createUser}
          onUpdateRole={updateUserRole}
          onToggleActive={toggleUserActive}
        />
      )}

      {/* ── Status Modal ── */}
      {modal?.type === 'status' && (
        <StaffModal
          title="Sửa trạng thái"
          description={`${modal.reservation.user_name || 'Khách'} / ${modal.reservation.table_number}`}
          onClose={() => setModal(null)}
        >
          <div className="staff-modal-body">
            <CustomSelect
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value)}
              options={
                modal.reservation.status === 'CONFIRMED'
                  ? [
                      { value: 'SEATED', label: 'Check-in / SEATED' },
                      { value: 'CANCELLED', label: 'Huỷ đơn' },
                      { value: 'NO_SHOW', label: 'No-show' },
                    ]
                  : [
                      { value: 'COMPLETED', label: 'Check-out / COMPLETED' },
                      { value: 'CANCELLED', label: 'Huỷ đơn' },
                    ]
              }
            />
          </div>
          <div className="staff-modal-actions">
            <button type="button" onClick={() => setModal(null)}>Huỷ</button>
            <button className="primary" type="button" onClick={saveStatus}>Xác nhận</button>
          </div>
        </StaffModal>
      )}

      {/* ── Note Modal ── */}
      {modal?.type === 'note' && (
        <StaffModal
          title="Ghi chú nhanh"
          description={`${modal.reservation.user_name || 'Khách'} / ${modal.reservation.table_number}`}
          onClose={() => setModal(null)}
        >
          <div className="staff-modal-body">
            <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
          </div>
          <div className="staff-modal-actions">
            <button type="button" onClick={() => setModal(null)}>Huỷ</button>
            <button className="primary" type="button" onClick={saveNote}>Lưu</button>
          </div>
        </StaffModal>
      )}
    </main>
  );
}
