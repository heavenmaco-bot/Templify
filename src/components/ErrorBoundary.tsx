import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold">!</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">Application Error</h1>
              <p className="text-slate-500 text-sm">Something went wrong while rendering the application.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Error Details</p>
              <pre className="text-xs font-mono text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
