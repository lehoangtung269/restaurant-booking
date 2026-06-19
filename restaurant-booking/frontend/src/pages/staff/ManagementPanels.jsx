/* eslint-disable react-refresh/only-export-components */
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { money } from '../../lib/format';
import { CustomSelect } from '../../components/CustomSelect';

const TABLE_AREA_OPTIONS = [
  { value: 'INDOOR', label: 'Trong nhà' },
  { value: 'OUTDOOR', label: 'Ngoài trời' },
  { value: 'VIP', label: 'VIP' },
];

const TABLE_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Hoạt động' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
];

const USER_ROLE_OPTIONS = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'CUSTOMER', label: 'Customer' },
];

const emptyTableForm = { id: null, table_number: '', capacity: 2, area: 'INDOOR', status: 'AVAILABLE' };
const emptyMenuForm = { id: null, name: '', category_id: '', price: '', description: '', image_url: '', is_available: true };
const emptyUserForm = { full_name: '', email: '', phone: '', password: '', role: 'STAFF' };

// ─── Tables management ────────────────────────────────────────────────────────
export function TablesManagement({ tables, tableForm, setTableForm, onSave, onDelete, onToggleMaintenance, reservations }) {
  const tableState = (table) => {
    if (table.status === 'maintenance') return 'maintenance';
    const active = reservations.find(
      (r) => Number(r.table_id) === Number(table.id) && ['waiting', 'serving'].includes(r.uiStatus),
    );
    return active?.uiStatus || 'available';
  };

  return (
    <section className="staff-management-shell">
      <div className="staff-management-head">
        <div>
          <p className="staff-eyebrow">Tables</p>
          <h1>Sơ đồ phòng ăn</h1>
        </div>
      </div>
      <div className="staff-management-grid">
        <form className="staff-form-panel" onSubmit={onSave}>
          <h2>{tableForm.id ? 'Sửa bàn' : 'Thêm bàn'}</h2>
          <label>
            Số bàn
            <input
              value={tableForm.table_number}
              onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
              required
            />
          </label>
          <label>
            Số ghế
            <input
              type="number"
              min="1"
              value={tableForm.capacity}
              onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
              required
            />
          </label>
          {!tableForm.id && (
            <label>
              Khu vực
              <CustomSelect
                value={tableForm.area}
                onChange={(e) => setTableForm({ ...tableForm, area: e.target.value })}
                options={TABLE_AREA_OPTIONS}
              />
            </label>
          )}
          <label>
            Trạng thái
            <CustomSelect
              value={tableForm.status}
              onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
              options={TABLE_STATUS_OPTIONS}
            />
          </label>
          <div className="staff-form-actions">
            <button className="staff-main-action compact" type="submit">
              {tableForm.id ? 'Lưu bàn' : 'Thêm bàn'}
            </button>
            {tableForm.id && (
              <button type="button" onClick={() => setTableForm(emptyTableForm)}>
                Huỷ
              </button>
            )}
          </div>
        </form>

        <div className="staff-panel">
          <div className="staff-table-grid management">
            {tables.map((table) => (
              <article className={`staff-table-chip ${tableState(table)}`} key={table.id}>
                <strong>{table.name}</strong>
                <span>{table.area} / {table.seats} ghế</span>
                <div className="staff-row-actions">
                  <button type="button" onClick={() => setTableForm({
                    id: table.id,
                    table_number: table.name,
                    capacity: table.seats,
                    area: table.area || 'INDOOR',
                    status: table.status === 'maintenance' ? 'MAINTENANCE' : 'AVAILABLE',
                  })}>
                    <Pencil size={14} /> Sửa
                  </button>
                  <button type="button" onClick={() => onToggleMaintenance(table)}>
                    {table.status === 'maintenance' ? 'Mở lại' : 'Bảo trì'}
                  </button>
                  <button type="button" onClick={() => onDelete(table)}>
                    <Trash2 size={14} /> Xoá
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Menu management ──────────────────────────────────────────────────────────
export function MenuManagement({ categories, menuItems, menuForm, setMenuForm, onSave, onDelete }) {
  return (
    <section className="staff-management-shell">
      <div className="staff-management-head">
        <div>
          <p className="staff-eyebrow">Menu</p>
          <h1>Danh mục bếp</h1>
        </div>
      </div>
      <div className="staff-management-grid">
        <form className="staff-form-panel" onSubmit={onSave}>
          <h2>{menuForm.id ? 'Sửa món' : 'Thêm món'}</h2>
          <label>
            Tên món
            <input
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              required
            />
          </label>
          <label>
            Danh mục
            <CustomSelect
              value={menuForm.category_id}
              onChange={(e) => setMenuForm({ ...menuForm, category_id: e.target.value })}
              options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
            />
          </label>
          <label>
            Giá (VND)
            <input
              type="number"
              min="0"
              value={menuForm.price}
              onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
              required
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={menuForm.description}
              onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
            />
          </label>
          <label>
            URL ảnh
            <input
              value={menuForm.image_url}
              onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
            />
          </label>
          <label className="staff-check-row">
            <input
              type="checkbox"
              checked={menuForm.is_available}
              onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.checked })}
            />
            Cho phép đặt trước
          </label>
          <div className="staff-form-actions">
            <button className="staff-main-action compact" type="submit">
              {menuForm.id ? 'Lưu món' : 'Thêm món'}
            </button>
            {menuForm.id && (
              <button
                type="button"
                onClick={() => setMenuForm({ ...emptyMenuForm, category_id: categories[0]?.id || '' })}
              >
                Huỷ
              </button>
            )}
          </div>
        </form>

        <div className="staff-panel">
          <div className="staff-data-list">
            {menuItems.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.category_name} / {money(item.price)} / {item.is_available ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </div>
                <div className="staff-row-actions">
                  <button type="button" onClick={() => setMenuForm({
                    id: item.id,
                    name: item.name || '',
                    category_id: item.category_id || categories[0]?.id || '',
                    price: item.price || '',
                    description: item.description || '',
                    image_url: item.image_url || '',
                    is_available: item.is_available !== false,
                  })}>
                    <Pencil size={14} /> Sửa
                  </button>
                  <button type="button" onClick={() => onDelete(item)}>
                    <Trash2 size={14} /> Xoá
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Accounts management ──────────────────────────────────────────────────────
export function AccountsManagement({ users, userForm, setUserForm, currentUserId, onCreateUser, onUpdateRole, onToggleActive }) {
  return (
    <section className="staff-management-shell">
      <div className="staff-management-head">
        <div>
          <p className="staff-eyebrow">Staff accounts</p>
          <h1>Quản lý tài khoản</h1>
        </div>
      </div>
      <div className="staff-management-grid">
        <form className="staff-form-panel" onSubmit={onCreateUser}>
          <h2>Tạo tài khoản</h2>
          <label>
            Họ tên
            <input
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
          </label>
          <label>
            Điện thoại
            <input
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              minLength="6"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
            />
          </label>
          <label>
            Vai trò
            <CustomSelect
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              options={USER_ROLE_OPTIONS}
            />
          </label>
          <button className="staff-main-action compact" type="submit">
            <Plus size={15} /> Tạo tài khoản
          </button>
        </form>

        <div className="staff-panel">
          <div className="staff-data-list">
            {users.map((account) => (
              <article key={account.id}>
                <div>
                  <strong>{account.full_name || account.email}</strong>
                  <span>
                    {account.email} / {account.phone || 'Không có SĐT'} /{' '}
                    <span style={{ color: account.is_active ? 'var(--leaf)' : 'var(--error, #e05)' }}>
                      {account.is_active ? 'Đang hoạt động' : 'Đã khoá'}
                    </span>
                  </span>
                </div>
                <div className="staff-row-actions">
                  <CustomSelect
                    value={account.role}
                    onChange={(e) => onUpdateRole(account, e.target.value)}
                    disabled={account.id === currentUserId}
                    options={USER_ROLE_OPTIONS}
                    className="inline-select"
                  />
                  <button
                    type="button"
                    disabled={account.id === currentUserId}
                    onClick={() => onToggleActive(account)}
                  >
                    {account.is_active ? 'Khoá' : 'Mở khoá'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { emptyMenuForm, emptyTableForm, emptyUserForm };
