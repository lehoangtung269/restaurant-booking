/**
 * Legacy Toast component — kept for backwards compatibility.
 * New code should use useToast() from ToastContext instead.
 *
 * Usage (legacy): <Toast message="..." />
 * Usage (new):    const toast = useToast(); toast.success("...")
 */
export function Toast({ message, type = 'error' }) {
  if (!message) return null;
  return (
    <div className={`toast-item toast-${type} toast-inline`} role="alert">
      <span className="toast-message">{message}</span>
    </div>
  );
}
