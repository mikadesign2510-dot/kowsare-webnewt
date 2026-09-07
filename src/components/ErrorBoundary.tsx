// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { storage } from '../lib/storage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    storage.addLog({
      level: 'critical',
      source: 'React ErrorBoundary',
      message: error.message || 'خطای رندر کامپوننت',
      details: error.stack || (errorInfo as any).componentStack
    });
  }

  public render() {
    const { hasError } = this.state as any;
    const { fallback, children } = this.props as any;

    if (hasError) {
      return fallback || (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">خطای سیستمی رخ داد</h1>
            <p className="text-slate-500 mb-6 text-sm">متأسفانه در نمایش این صفحه خطایی رخ داده است. این مشکل به صورت خودکار در لاگ سیستم ثبت شد.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              تلاش مجدد و بارگذاری صفحه
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

