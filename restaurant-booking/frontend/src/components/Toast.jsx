export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast show">{message}</div>;
}
