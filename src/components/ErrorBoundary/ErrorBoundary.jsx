import { Component } from 'react';
import './ErrorBoundary.css';

// Se una pagina va in errore mostra il messaggio invece di lasciare lo schermo vuoto.
// Si resetta quando cambia `resetKey` (es. la pagina corrente).
class ErrorBoundary extends Component {
  state = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="error-boundary">
        <h1>Qualcosa è andato storto</h1>
        <pre>{String(this.state.error?.message ?? this.state.error)}</pre>
      </main>
    );
  }
}

export default ErrorBoundary;
