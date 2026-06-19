import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry / Datadog etc.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    return (
      <main className="error-boundary-page">
        <div className="error-boundary-card">
          <p className="eyebrow gold">Unexpected error</p>
          <h1>Something went wrong.</h1>
          <p className="error-boundary-detail">
            {this.props.message ||
              'An unexpected error occurred. Our team has been notified. Please try again or return home.'}
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="error-boundary-stack">{this.state.error.message}</pre>
          )}
          <div className="error-boundary-actions">
            <button className="gold-button" type="button" onClick={this.handleReset}>
              Try again
            </button>
            <Link className="booking-secondary-link" to="/">
              Return home
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
