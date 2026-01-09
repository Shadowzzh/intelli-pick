import type { ReactNode } from "react";
import { Component } from "react";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold mb-2">出错了</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || "页面遇到了一些问题"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset}>重试</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                刷新页面
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  错误详情
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
