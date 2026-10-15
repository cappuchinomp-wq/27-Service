import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Wrench, Building2, UserCheck, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-mark login-mark">27</div>
        <div className="eyebrow mb-2">TWENTY-SEVEN BUILDING OS</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ยินดีต้อนรับ</h1>
        <p className="text-sm text-gray-500 mb-6">เข้าสู่ระบบเพื่อบริหารจัดการอาคาร Twenty-Seven</p>

        {/* Roles information */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-left">
          <div className="text-xs font-semibold text-gray-700 mb-2">การแบ่งสิทธิ์ 3 บทบาทในระบบ:</div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span><strong>Manager (ผู้จัดการอาคาร):</strong> สิทธิ์เต็มทุกระบบ บริหารจัดการผู้ใช้งาน</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span><strong>Reception (รับแจ้ง):</strong> ดูภาพรวม แจ้งซ่อม และติดตามงาน</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>Technician (ช่างอาคาร):</strong> รับงานซ่อม ตรวจ PM และจัดการอะไหล่</span>
            </div>
          </div>
        </div>

        {/* Google Sign-in button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-xl shadow-sm transition-all duration-150 hover:shadow disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
        </button>

        {(localError || authError) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{localError || authError}</span>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <UserCheck className="w-3.5 h-3.5" />
          <span>ระบบจะตรวจสอบสิทธิ์และดึงข้อมูลโปรไฟล์จาก Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
