import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#12243a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">เกิดข้อผิดพลาดในการโหลดระบบ</h2>
            <p className="text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-left font-mono overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="text-xs text-gray-500 mb-6 text-left space-y-1">
              <div><strong>คำแนะนำ:</strong></div>
              <div>• หากใช้งานบน GitHub Pages อย่าลืมเพิ่มโดเมนใน <em>Firebase Console → Authentication → Settings → Authorized domains</em></div>
              <div>• ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="primary-btn w-full justify-center py-2.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> โหลดหน้านี้ใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
