import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('⚠️ [ULTRON CRITICAL CATCH]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-black/90 font-mono text-white select-none">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-950 border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.25)] space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-widest text-red-400 uppercase">
                {this.props.fallbackTitle || 'Neural Subsystem Disruption'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {this.state.error?.message || 'An unexpected anomaly occurred in the quantum runtime.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-bold tracking-wider transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              REINITIALIZE MATRIX
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
