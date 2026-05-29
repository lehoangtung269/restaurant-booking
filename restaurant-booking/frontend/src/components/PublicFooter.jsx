import { Link } from 'react-router-dom';

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <p className="footer-brand">Maison Edem</p>
        <p>Dark fine dining restaurant. Built for booking, pre-order and floor operations.</p>
        <div className="footer-links">
          <Link to="/menu">Menu</Link>
          <Link to="/booking/tables">Reserve</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </footer>
  );
}
