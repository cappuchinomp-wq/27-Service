import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole } from '../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Shield, ShieldAlert, Wrench, Building2, UserCheck, AlertCircle } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { currentUser, updateRole, role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as UserProfile);
        });
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleRoleSelect = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUid(userId);
      setMessage(null);
      await updateRole(userId, newRole);
      setMessage(`อัปเดตสิทธิ์ของเจ้าหน้าที่เป็น "${newRole}" เรียบร้อยแล้ว`);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingUid(null);
    }
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'technician':
        return <Wrench className="w-4 h-4 text-emerald-600" />;
      case 'reception':
      default:
        return <Building2 className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">จัดการผู้ใช้งานและกำหนดสิทธิ์</h2>
          <p className="text-xs text-gray-500 mt-1">
            กำหนดบทบาท 3 ระดับ (Manager, Reception, Technician) ให้กับบัญชีผู้ใช้ที่ล็อกอินผ่าน Google Sign-In
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-blue-100 bg-blue-50/40">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Manager (ผู้จัดการอาคาร)</span>
          </div>
          <p className="text-xs text-blue-800/80 leading-relaxed">
            สิทธิ์สูงสุด เข้าถึงทุกแท็บ: Dashboard, แจ้งซ่อม, PM, อะไหล่, ประวัติ/ค่าใช้จ่าย และจัดการสิทธิ์ผู้ใช้งาน
          </p>
        </div>

        <div className="card border-amber-100 bg-amber-50/40">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-1">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Reception (เจ้าหน้าที่รับแจ้ง)</span>
          </div>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            สิทธิ์สำหรับแผนกต้อนรับ/ประชาสัมพันธ์: ดูภาพรวมอาคาร และสร้างงานแจ้งซ่อมใหม่ ติดตามสถานะงาน
          </p>
        </div>

        <div className="card border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm mb-1">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>Technician (ช่างอาคาร)</span>
          </div>
          <p className="text-xs text-emerald-800/80 leading-relaxed">
            สิทธิ์ทีมช่าง: ดูงานซ่อม ปรับสถานะงาน บันทึกและตรวจตาราง PM พร้อมเบิก-รับเข้าอะไหล่คงคลัง
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-sm mb-4 pb-2 border-b border-gray-100">
          รายชื่อผู้ใช้งานในระบบ ({users.length} ท่าน)
        </h3>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>เจ้าหน้าที่ / ผู้ใช้งาน</th>
                <th>อีเมล Google</th>
                <th>บทบาทปัจจุบัน</th>
                <th>ปรับเปลี่ยนสิทธิ์</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrent = u.uid === currentUser?.uid;
                const isBootstrap = u.email.toLowerCase() === 'cappuchino.mp@gmail.com';

                return (
                  <tr key={u.uid} className={isCurrent ? 'bg-blue-50/20' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <span>{u.displayName || 'ผู้ใช้งาน'}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded">
                                บัญชีคุณ
                              </span>
                            )}
                            {isBootstrap && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.2 rounded">
                                Root Manager
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono">UID: {u.uid.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="text-xs text-gray-600 font-medium">{u.email}</td>

                    <td>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200">
                        {getRoleIcon(u.role)}
                        <span className="capitalize">{u.role}</span>
                      </div>
                    </td>

                    <td>
                      <select
                        disabled={updatingUid === u.uid}
                        value={u.role}
                        onChange={(e) => handleRoleSelect(u.uid, e.target.value as UserRole)}
                        className="text-xs font-semibold border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="manager">Manager (ผู้จัดการ)</option>
                        <option value="reception">Reception (รับแจ้ง)</option>
                        <option value="technician">Technician (ช่างอาคาร)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400 text-xs">
                    {loading ? 'กำลังโหลดข้อมูลผู้ใช้งาน...' : 'ยังไม่มีผู้ใช้งานลงทะเบียน'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
