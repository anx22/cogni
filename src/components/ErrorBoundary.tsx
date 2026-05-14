import { Component, type ErrorInfo, type ReactNode } from "react";
import { devlog } from "@/lib/devlog/devlog";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Globale Auffanggrenze für Render-Fehler. Spiegelt jeden gefangenen Fehler
 * in `devlog` (Kategorie `error`) — von dort fließt er via Sink in
 * `pipeline_events` (siehe pipelineSink.ts).
 *
 * Behält die App lauffähig, indem statt eines weißen Bildschirms eine
 * minimale Recovery-Karte angezeigt wird.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    devlog.error(`ErrorBoundary: ${error.message}`, {
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md space-y-3 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-medium">Etwas ist schiefgelaufen.</h2>
          <p className="text-sm text-muted-foreground break-words">{this.state.error.message}</p>
          <button
            onClick={this.reset}
            className="text-sm rounded-md border border-border px-3 py-1.5 hover:bg-accent transition"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }
}
