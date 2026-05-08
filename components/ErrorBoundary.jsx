'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0f1117',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '32px 28px',
          textAlign: 'center',
          margin: '24px 0',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(239,68,68,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 22,
          }}>
            !
          </div>
          <h3 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, fontWeight: 600,
            color: '#ef4444', marginBottom: 8,
          }}>
            Something went wrong
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: '#888',
            lineHeight: 1.6, marginBottom: 20,
            maxWidth: 400, margin: '0 auto 20px',
          }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#ef4444', color: '#fff',
              border: 'none', borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, fontWeight: 600,
              padding: '10px 24px', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
