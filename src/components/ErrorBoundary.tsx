import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendlyMsg = `ডেটাবেস অনুমতি বা সংযোগ সমস্যা: ${parsed.error} (${parsed.operationType || ''} ${parsed.path || ''})`;
        }
      } catch {
        // non-JSON error message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              কিছু একটা সমস্যা হয়েছে
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 break-words">
              {friendlyMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
