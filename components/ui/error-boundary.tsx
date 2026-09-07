'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[250px] flex items-center justify-center p-6">
          <div className="w-full max-w-md p-6 rounded-2xl border border-red-500/20 bg-red-950/20 backdrop-blur-xl text-center shadow-xl">
            <div className="h-12 w-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Something went wrong</h3>
            <p className="text-sm text-slate-400 mb-5">
              An unexpected error occurred while rendering this section.
            </p>
            {this.state.error?.message && (
              <div className="text-xs font-mono bg-slate-900/60 p-2.5 rounded-lg text-red-300/80 mb-5 overflow-x-auto text-left border border-slate-800">
                {this.state.error.message}
              </div>
            )}
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              <RotateCcw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
