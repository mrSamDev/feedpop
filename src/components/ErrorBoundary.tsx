import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="panel mx-4 max-w-md px-6 py-8 text-center">
              <p className="text-lg font-extrabold text-ink">Something went wrong</p>
              <p className="mt-2 text-sm text-ink-60">An unexpected error occurred. Try reloading the page.</p>
              <button onClick={this.handleReload} className="btn btn-refresh mt-4 px-5 py-2">
                Reload page
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
