import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Algo deu errado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tente novamente ou volte ao início.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => location.reload()}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
            >
              Tentar de novo
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              Início
            </a>
          </div>
        </div>
      </div>
    );
  }
}
