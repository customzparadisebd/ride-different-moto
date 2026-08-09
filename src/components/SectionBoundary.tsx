import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; label: string };
type State = { failed: boolean };

/** Keeps one broken section from taking down the whole page. */
export class SectionBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}] section failed`, error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="rounded-lg border border-border bg-secondary px-4 py-6 text-center text-sm text-muted-foreground">
            This section is temporarily unavailable.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}