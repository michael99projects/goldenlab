export type UserRole = 'admin' | 'rep' | 'dentist';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  geo_text: string;
  maps_url?: string;
  code: string;
  code_hash: string;
  pin_masked: string;
  owner_rep_id?: string; // For dentist: assigned representative
  active: boolean;
  failed_attempts: number;
  locked_until: number | null;
  created_at: number;
  archived_at: number | null;
}

export interface Session {
  id: string;
  user_id: string;
  user: User;
  created_at: number;
  expires_at: number;
  ip_hash: string;
}

export interface Patient {
  id: string;
  dentist_id: string;
  dentist_name?: string;
  name: string;
  notes: string;
  created_at: number;
  archived_at: number | null;
}

export type MaterialType = 'Zirconia' | 'E-Max' | 'PFM' | 'Titanium' | 'PEEK' | 'Other';

export type RestorationKind = 
  | 'Crown' 
  | 'Bridge' 
  | 'Endo-Crown' 
  | 'Onlay' 
  | 'Inlay' 
  | 'Overlay' 
  | 'Implant Abutment';

export type CaseStatus = 
  | 'pending_lab'      // منتظر تأكيد المعمل
  | 'in_progress'      // جارية
  | 'ready_for_delivery' // جاهزة للتسليم
  | 'delivered'        // تم التسليم
  | 'delayed'          // متأخرة عن الموعد
  | 'cancelled';       // ملغاة

export interface CaseStep {
  id: string;
  case_id: string;
  seq: number;
  name: string;
  occurred_at: number;
  price_minor: number | null;
  note: string;
  received_by_rep_id: string;
  received_by_rep_name?: string;
  confirmed_by: string | null;
  confirmed_at: number | null;
  status: 'recorded' | 'pending' | 'confirmed';
}

export interface Case {
  id: string;
  case_code: string;
  dentist_id: string;
  dentist_name: string;
  patient_id: string;
  patient_name: string;
  rep_id: string;
  rep_name: string;
  material: MaterialType;
  kind: RestorationKind;
  status: CaseStatus;
  teeth_info: string;
  units: number;
  lab_price_minor: number; // In Qirsh (100 = 1 EGP). Confirmed by Admin only!
  commission_minor: number; // In Qirsh, rep commission
  commission_paid: boolean;
  due_date: number; // Timestamp
  delay_reason?: string | null;
  note: string;
  created_by: string;
  created_at: number;
  approved_by: string | null;
  approved_at: number | null;
  archived_at: number | null;
  steps: CaseStep[];
}

export type PaymentMethod = 'cash' | 'transfer_direct';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: string;
  case_id: string | null;
  case_step_id: string | null;
  dentist_id: string;
  dentist_name: string;
  amount_minor: number; // In Qirsh (100 = 1 EGP)
  method: PaymentMethod;
  status: PaymentStatus;
  recorded_by: string;
  recorded_by_name: string;
  approved_by: string | null;
  approved_at: number | null;
  occurred_at: number;
  ref_note: string;
  rejection_reason?: string | null;
  reversal_of: string | null;
}

export type ApprovalKind = 'case' | 'case_step' | 'payment' | 'dentist' | 'note';

export interface Approval {
  id: string;
  kind: ApprovalKind;
  entity_id: string;
  actor_id: string;
  actor_name: string;
  title: string;
  payload_json: string;
  status: 'pending' | 'approved' | 'rejected';
  decided_by: string | null;
  decided_at: number | null;
  rejection_note: string | null;
  created_at: number;
}

export interface AuditLog {
  id: string;
  at: number;
  actor_id: string;
  actor_name: string;
  action: 'pin_reveal' | 'approve_payment' | 'reject_payment' | 'approve_step' | 'approve_case' | 'transfer_rep' | 'set_price' | 'create_patient' | 'update_case_status';
  entity: string;
  entity_id: string;
  before_json: string | null;
  after_json: string | null;
  ip_hash: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'approval' | 'payment' | 'delivery' | 'delay' | 'system';
  title: string;
  message: string;
  payload_json?: string;
  created_at: number;
  read_at: number | null;
}

export interface FinancialSummary {
  totalChargedMinor: number;
  totalPaidMinor: number;
  balanceDueMinor: number;
}
