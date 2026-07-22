import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="container not-found" role="alert">
        <span className="eyebrow">ERROR</span>
        <h1>No pudimos cargar esta vista</h1>
        <p>Actualiza la página. Si el problema continúa, revisa la conexión con el servicio.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </main>
    );
  }
}
