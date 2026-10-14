import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl">
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white font-['Cairo']">حدث خطأ أثناء تحميل المنظومة</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              تعذر استكمال العرض. يمكنك محاولة تحديث الصفحة أو مسح الذاكرة المؤقتة.
            </p>
            {this.state.error && (
              <pre className="mt-4 p-3 rounded-xl bg-slate-950 text-red-300 font-mono text-[11px] text-right overflow-x-auto max-h-36">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة ضبط وتحديث الصفحة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
