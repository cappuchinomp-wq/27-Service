export type UserRole = 'manager' | 'reception' | 'technician';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type IncidentPriority = 'normal' | 'urgent' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Incident {
  id: string;
  incidentNumber: string;
  location: string;
  title?: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  reportedByUid: string;
  reportedByName?: string;
  assignedToUid?: string;
  assignedToName?: string;
  targetCompletionDate?: string;
  recurrenceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type PMFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PMStatus = 'scheduled' | 'completed' | 'overdue';

export interface MaintenancePlan {
  id: string;
  equipmentName: string;
  taskDescription: string;
  frequency: PMFrequency;
  nextDueDate: string;
  daysRemaining?: number;
  status: PMStatus;
  assignedTo?: string;
  lastHistory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  location: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  status: 'ok' | 'low';
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  equipmentOrLocation: string;
  description: string;
  responsibleParty: string;
  amount: number;
  recurrenceText?: string;
  incidentId?: string;
  createdByUid: string;
  createdAt: string;
}

export type ActiveTab = 'dashboard' | 'incidents' | 'maintenance' | 'inventory' | 'history' | 'users';
