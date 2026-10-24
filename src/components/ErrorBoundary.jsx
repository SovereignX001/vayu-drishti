import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error in section:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 sm:p-10 rounded-[32px] bg-white border border-slate-100 shadow-soft text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-ink-900 font-sans">
              Something went wrong in this section
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              An unexpected render error occurred. You can reload this tab or switch views.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-full bg-ink-900 hover:bg-ink-800 text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-chip"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload this tab</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
