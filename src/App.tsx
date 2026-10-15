/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { NewIncidentModal } from './components/NewIncidentModal';
import { DashboardView } from './views/DashboardView';
import { IncidentsView } from './views/IncidentsView';
import { MaintenanceView } from './views/MaintenanceView';
import { InventoryView } from './views/InventoryView';
import { HistoryExpensesView } from './views/HistoryExpensesView';
import { UsersView } from './views/UsersView';
import { ActiveTab, Incident, MaintenancePlan, InventoryItem, ExpenseRecord } from './types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase/config';
import { handleFirestoreError, OperationType } from './firebase/errors';
import { checkAndSeedInitialData } from './services/seedService';

const MainLayout: React.FC = () => {
  const { currentUser, loading: authLoading, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Firestore real-time state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenancePlan[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Seed baseline data when user logs in
  useEffect(() => {
    if (currentUser) {
      checkAndSeedInitialData(currentUser.uid, currentUser.displayName || 'ผู้ใช้งาน');
    }
  }, [currentUser]);

  // Firestore listeners (Only attach when authenticated per skill guidelines)
  useEffect(() => {
    if (!currentUser) return;

    // 1. Incidents listener
    const unsubIncidents = onSnapshot(
      collection(db, 'incidents'),
      (snapshot) => {
        const list: Incident[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Incident);
        });
        // Sort by createdAt descending
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setIncidents(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'incidents');
      }
    );

    // 2. Maintenance listener
    const unsubMaintenance = onSnapshot(
      collection(db, 'maintenance'),
      (snapshot) => {
        const list: MaintenancePlan[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as MaintenancePlan);
        });
        setMaintenance(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'maintenance');
      }
    );

    // 3. Inventory listener
    const unsubInventory = onSnapshot(
      collection(db, 'inventory'),
      (snapshot) => {
        const list: InventoryItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as InventoryItem);
        });
        setInventory(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'inventory');
      }
    );

    // 4. Expenses listener
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list: ExpenseRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ExpenseRecord);
        });
        setExpenses(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'expenses');
      }
    );

    return () => {
      unsubIncidents();
      unsubMaintenance();
      unsubInventory();
      unsubExpenses();
    };
  }, [currentUser]);

  // Role permissions enforcement
  useEffect(() => {
    const rolePermissions: Record<string, ActiveTab[]> = {
      manager: ['dashboard', 'incidents', 'maintenance', 'inventory', 'history', 'users'],
      reception: ['dashboard', 'incidents'],
      technician: ['dashboard', 'incidents', 'maintenance', 'inventory']
    };

    const allowed = rolePermissions[role] || rolePermissions.reception;
    if (!allowed.includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [role, currentTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#12243a] flex flex-col items-center justify-center text-white">
        <div className="brand-mark mb-4 animate-pulse">27</div>
        <div className="text-sm font-semibold tracking-wide">กำลังเชื่อมต่อกับระบบ Twenty-Seven Building OS...</div>
        <div className="text-xs text-gray-400 mt-1">ตรวจสอบความปลอดภัยและสิทธิ์การใช้งานผ่าน Firebase</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const openIncidentsCount = incidents.filter(
    (i) => i.status !== 'completed' && i.status !== 'cancelled'
  ).length;

  const handleManualSeed = async () => {
    if (window.confirm('คุณต้องการเติมข้อมูลตัวอย่างเดิม (Incidents, PM, อะไหล่, ค่าใช้จ่าย) หรือไม่?')) {
      await checkAndSeedInitialData(currentUser.uid, currentUser.displayName || 'ผู้ใช้งาน');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        openIncidentsCount={openIncidentsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar currentTab={currentTab} onSeedData={handleManualSeed} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              incidents={incidents}
              maintenance={maintenance}
              expenses={expenses}
              onOpenNewIncident={() => setIsModalOpen(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onOpenNewIncident={() => setIsModalOpen(true)}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView maintenance={maintenance} />
          )}

          {currentTab === 'inventory' && (
            <InventoryView inventory={inventory} />
          )}

          {currentTab === 'history' && (
            <HistoryExpensesView expenses={expenses} />
          )}

          {currentTab === 'users' && <UsersView />}
        </main>
      </div>

      {/* Modal for reporting incidents */}
      <NewIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingIncidents={incidents}
        onIncidentCreated={() => {
          // Handled automatically via Firestore onSnapshot
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
