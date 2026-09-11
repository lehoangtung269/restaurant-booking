/**
 * Reusable Modal component for staff portal.
 * Closes when clicking the backdrop (outside the card).
 */
export function StaffModal({ title, description, children, onClose }) {
  return (
    <div
      className="staff-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="staff-modal-title">
        <div className="staff-modal-head">
          <div>
            <h3 id="staff-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
