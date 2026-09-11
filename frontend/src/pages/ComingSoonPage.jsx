import { Link } from 'react-router-dom';

export function ComingSoonPage({ title = 'Coming next', text = 'This section will be implemented in the next frontend slice.' }) {
  return (
    <main className="content-section page-spacer">
      <div className="reserve-panel compact-panel">
        <div>
          <p className="eyebrow gold">Next slice</p>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        <Link className="gold-button" to="/">
          Back home
        </Link>
      </div>
    </main>
  );
}
