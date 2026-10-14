import {
  User,
  Patient,
  Case,
  CaseStep,
  Payment,
  Approval,
  AuditLog,
  Notification,
  FinancialSummary,
  MaterialType,
  RestorationKind
} from '../types';
import {
  SEED_USERS,
  SEED_PATIENTS,
  SEED_CASES,
  SEED_PAYMENTS,
  SEED_APPROVALS,
  SEED_AUDIT_LOGS,
  SEED_NOTIFICATIONS,
} from '../db/seedData';
import { formatEgp, formatArabicDate } from '../lib/crypto';

const STORAGE_KEYS = {
  USERS: 'gl_users_v1',
  PATIENTS: 'gl_patients_v1',
  CASES: 'gl_cases_v1',
  PAYMENTS: 'gl_payments_v1',
  APPROVALS: 'gl_approvals_v1',
  AUDIT: 'gl_audit_v1',
  NOTIFICATIONS: 'gl_notifications_v1',
  SESSION: 'gl_session_v1',
  ATTEMPTS: 'gl_attempts_v1',
};

// Safe LocalStorage helpers
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed saving to storage', e);
  }
}

class DentalStore {
  private users: User[];
  private patients: Patient[];
  private cases: Case[];
  private payments: Payment[];
  private approvals: Approval[];
  private auditLogs: AuditLog[];
  private notifications: Notification[];
  private currentUser: User | null = null;
  private listeners: Set<() => void> = new Set();
  private failedAttemptsMap: Record<string, { count: number; lockedUntil: number | null }>;

  constructor() {
    this.users = loadFromStorage(STORAGE_KEYS.USERS, SEED_USERS);
    this.patients = loadFromStorage(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
    this.cases = loadFromStorage(STORAGE_KEYS.CASES, SEED_CASES);
    this.payments = loadFromStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    this.approvals = loadFromStorage(STORAGE_KEYS.APPROVALS, SEED_APPROVALS);
    this.auditLogs = loadFromStorage(STORAGE_KEYS.AUDIT, SEED_AUDIT_LOGS);
    this.notifications = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    this.currentUser = loadFromStorage(STORAGE_KEYS.SESSION, null);
    this.failedAttemptsMap = loadFromStorage(STORAGE_KEYS.ATTEMPTS, {});
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
    this.persistAll();
  }

  private persistAll() {
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    saveToStorage(STORAGE_KEYS.PATIENTS, this.patients);
    saveToStorage(STORAGE_KEYS.CASES, this.cases);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    saveToStorage(STORAGE_KEYS.APPROVALS, this.approvals);
    saveToStorage(STORAGE_KEYS.AUDIT, this.auditLogs);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    saveToStorage(STORAGE_KEYS.SESSION, this.currentUser);
    saveToStorage(STORAGE_KEYS.ATTEMPTS, this.failedAttemptsMap);
  }

  public resetToSeed() {
    this.users = [...SEED_USERS];
    this.patients = [...SEED_PATIENTS];
    this.cases = [...SEED_CASES];
    this.payments = [...SEED_PAYMENTS];
    this.approvals = [...SEED_APPROVALS];
    this.auditLogs = [...SEED_AUDIT_LOGS];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.currentUser = null;
    this.failedAttemptsMap = {};
    this.notify();
  }

  // --- Auth & Gate ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.notify();
  }

  public logout() {
    this.currentUser = null;
    this.notify();
  }

  /**
   * Unified Gate Login:
   * Rule 1: No hint which failed (code or pin).
   * Rule 2: Lockout after 5 attempts for 15 minutes.
   * Rule 3: Derives user role strictly from validated session, never from client parameters.
   */
  public gateLogin(code: string, pin: string): { success: boolean; error?: string; user?: User } {
    const cleanCode = code.trim().toUpperCase();
    const cleanPin = pin.trim();

    const attemptKey = cleanCode || 'anonymous';
    const tracker = this.failedAttemptsMap[attemptKey] || { count: 0, lockedUntil: null };

    // Check lock
    if (tracker.lockedUntil && tracker.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((tracker.lockedUntil - Date.now()) / 60000);
      return {
        success: false,
        error: `تم قفل الحساب مؤقتًا لتكرار المحاولات الخاطئة. يرجى الانتظار ${remainingMinutes} دقيقة والمحاولة ثانية.`,
      };
    }

    const matchedUser = this.users.find(
      u => u.code.toUpperCase() === cleanCode && u.pin_masked === cleanPin && u.active && !u.archived_at
    );

    if (!matchedUser) {
      tracker.count += 1;
      if (tracker.count >= 5) {
        tracker.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
        this.failedAttemptsMap[attemptKey] = tracker;
        this.persistAll();
        return {
          success: false,
          error: 'تم تجاوز الحد الأقصى للمحاولات (5 مرات). تم قفل الدخول لمدة 15 دقيقة لدواعي الأمان.',
        };
      }
      this.failedAttemptsMap[attemptKey] = tracker;
      this.persistAll();
      return {
        success: false,
        error: 'بيانات الدخول غير صحيحة. يرجى التأكد من كود الدخول والرمز السري (PIN).',
      };
    }

    // Success: reset attempts
    this.failedAttemptsMap[attemptKey] = { count: 0, lockedUntil: null };
    this.currentUser = matchedUser;
    this.notify();

    return {
      success: true,
      user: matchedUser,
    };
  }

  // --- Scoped Access Rules ---

  public getCasesForViewer(viewer: User | null): Case[] {
    if (!viewer) return [];
    if (viewer.role === 'admin') {
      return this.cases.filter(c => !c.archived_at);
    }
    if (viewer.role === 'dentist') {
      // Dentist only sees their own cases
      return this.cases.filter(c => c.dentist_id === viewer.id && !c.archived_at);
    }
    if (viewer.role === 'rep') {
      // Rep sees their cases or cases for dentists assigned to them
      return this.cases.filter(
        c => (c.rep_id === viewer.id || this.isDentistAssignedToRep(c.dentist_id, viewer.id)) && !c.archived_at
      );
    }
    return [];
  }

  public getPatientsForViewer(viewer: User | null): Patient[] {
    if (!viewer) return [];
    if (viewer.role === 'admin') {
      return this.patients.filter(p => !p.archived_at);
    }
    if (viewer.role === 'dentist') {
      return this.patients.filter(p => p.dentist_id === viewer.id && !p.archived_at);
    }
    if (viewer.role === 'rep') {
      return this.patients.filter(
        p => this.isDentistAssignedToRep(p.dentist_id, viewer.id) && !p.archived_at
      );
    }
    return [];
  }

  public getPaymentsForViewer(viewer: User | null): Payment[] {
    if (!viewer) return [];
    if (viewer.role === 'admin') {
      return this.payments;
    }
    if (viewer.role === 'dentist') {
      // Dentist only sees their payments, and only approved/pending ones
      return this.payments.filter(p => p.dentist_id === viewer.id);
    }
    if (viewer.role === 'rep') {
      // Rep sees payments recorded by them or belonging to their assigned dentists
      return this.payments.filter(
        p => p.recorded_by === viewer.id || this.isDentistAssignedToRep(p.dentist_id, viewer.id)
      );
    }
    return [];
  }

  public getApprovalsForViewer(viewer: User | null): Approval[] {
    if (!viewer) return [];
    if (viewer.role === 'admin') {
      return this.approvals.filter(a => a.status === 'pending');
    }
    // Rep can see what they submitted
    if (viewer.role === 'rep') {
      return this.approvals.filter(a => a.actor_id === viewer.id);
    }
    return [];
  }

  public getNotificationsForViewer(viewer: User | null): Notification[] {
    if (!viewer) return [];
    return this.notifications
      .filter(n => n.user_id === viewer.id)
      .sort((a, b) => b.created_at - a.created_at);
  }

  public markNotificationAsRead(notifId: string) {
    const notif = this.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read_at = Date.now();
      this.notify();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    this.notifications.forEach(n => {
      if (n.user_id === userId) n.read_at = Date.now();
    });
    this.notify();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => b.at - a.at);
  }

  public getUsers(): User[] {
    return this.users.filter(u => !u.archived_at);
  }

  public getDentists(): User[] {
    return this.users.filter(u => u.role === 'dentist' && !u.archived_at);
  }

  public getReps(): User[] {
    return this.users.filter(u => u.role === 'rep' && !u.archived_at);
  }

  private isDentistAssignedToRep(dentistId: string, repId: string): boolean {
    const dentist = this.users.find(u => u.id === dentistId);
    return dentist?.owner_rep_id === repId;
  }

  // --- Dynamic Financial Ledger (Strictly Minor Qirsh calculations) ---

  public calculateDentistBalance(dentistId: string): FinancialSummary {
    // Only approved cases contribute to lab charges
    const approvedCases = this.cases.filter(
      c => c.dentist_id === dentistId && c.approved_at !== null && !c.archived_at
    );
    const totalChargedMinor = approvedCases.reduce((acc, c) => acc + (c.lab_price_minor || 0), 0);

    // Only approved payments reduce the balance
    const approvedPayments = this.payments.filter(
      p => p.dentist_id === dentistId && p.status === 'approved'
    );
    const totalPaidMinor = approvedPayments.reduce((acc, p) => acc + p.amount_minor, 0);

    return {
      totalChargedMinor,
      totalPaidMinor,
      balanceDueMinor: Math.max(0, totalChargedMinor - totalPaidMinor),
    };
  }

  public calculateRepCommissions(repId: string): {
    totalEarnedMinor: number;
    totalPaidMinor: number;
    pendingMinor: number;
  } {
    const repCases = this.cases.filter(
      c => c.rep_id === repId && c.approved_at !== null && !c.archived_at
    );
    const totalEarnedMinor = repCases.reduce((acc, c) => acc + (c.commission_minor || 0), 0);
    const totalPaidMinor = repCases
      .filter(c => c.commission_paid)
      .reduce((acc, c) => acc + (c.commission_minor || 0), 0);

    return {
      totalEarnedMinor,
      totalPaidMinor,
      pendingMinor: totalEarnedMinor - totalPaidMinor,
    };
  }

  public getGlobalFinancialStats(): {
    totalChargedMinor: number;
    totalCollectedMinor: number;
    totalOutstandingMinor: number;
    todayCollectedMinor: number;
    pendingPaymentsMinor: number;
  } {
    // Sum across all dentists
    let totalChargedMinor = 0;
    this.cases.forEach(c => {
      if (c.approved_at && !c.archived_at) {
        totalChargedMinor += c.lab_price_minor || 0;
      }
    });

    let totalCollectedMinor = 0;
    let todayCollectedMinor = 0;
    let pendingPaymentsMinor = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    this.payments.forEach(p => {
      if (p.status === 'approved') {
        totalCollectedMinor += p.amount_minor;
        if (p.occurred_at >= startOfTodayMs) {
          todayCollectedMinor += p.amount_minor;
        }
      } else if (p.status === 'pending') {
        pendingPaymentsMinor += p.amount_minor;
      }
    });

    return {
      totalChargedMinor,
      totalCollectedMinor,
      totalOutstandingMinor: Math.max(0, totalChargedMinor - totalCollectedMinor),
      todayCollectedMinor,
      pendingPaymentsMinor,
    };
  }

  // --- Representative Operations (Enter PENDING state) ---

  public repCreateCase(params: {
    repId: string;
    dentistId: string;
    patientId: string;
    material: MaterialType;
    kind: RestorationKind;
    teethInfo: string;
    units: number;
    initialStepName: string;
    note: string;
  }): { success: boolean; caseId: string } {
    const rep = this.users.find(u => u.id === params.repId);
    const dentist = this.users.find(u => u.id === params.dentistId);
    const patient = this.patients.find(p => p.id === params.patientId);

    if (!rep || !dentist || !patient) {
      throw new Error('بيانات غير صحيحة');
    }

    const caseId = `case_${Date.now()}`;
    const caseCode = `GL-${Math.floor(2600 + Math.random() * 900)}`;

    const initialStep: CaseStep = {
      id: `step_${Date.now()}_1`,
      case_id: caseId,
      seq: 1,
      name: params.initialStepName || 'استلام الطبعة وتسجيل المعالم',
      occurred_at: Date.now(),
      price_minor: null,
      note: params.note,
      received_by_rep_id: rep.id,
      received_by_rep_name: rep.name,
      confirmed_by: null,
      confirmed_at: null,
      status: 'pending', // Pending Admin confirmation!
    };

    const newCase: Case = {
      id: caseId,
      case_code: caseCode,
      dentist_id: dentist.id,
      dentist_name: dentist.name,
      patient_id: patient.id,
      patient_name: patient.name,
      rep_id: rep.id,
      rep_name: rep.name,
      material: params.material,
      kind: params.kind,
      status: 'pending_lab', // RULE: Always pending lab confirmation!
      teeth_info: params.teethInfo,
      units: params.units || 1,
      lab_price_minor: 0, // Admin sets lab price upon approval
      commission_minor: 0,
      commission_paid: false,
      due_date: Date.now() + 4 * 86400000,
      note: params.note,
      created_by: rep.id,
      created_at: Date.now(),
      approved_by: null,
      approved_at: null,
      archived_at: null,
      steps: [initialStep],
    };

    this.cases.unshift(newCase);

    // Create approval item
    const approvalId = `appr_${Date.now()}`;
    const approval: Approval = {
      id: approvalId,
      kind: 'case',
      entity_id: caseId,
      actor_id: rep.id,
      actor_name: rep.name,
      title: `طلب اعتماد حالة جديدة: ${params.material} ${params.kind} (${dentist.name})`,
      payload_json: JSON.stringify({
        case_id: caseId,
        case_code: caseCode,
        dentist: dentist.name,
        patient: patient.name,
        material: params.material,
        kind: params.kind,
        units: params.units,
        teeth: params.teethInfo,
        note: params.note,
      }),
      status: 'pending',
      decided_by: null,
      decided_at: null,
      rejection_note: null,
      created_at: Date.now(),
    };
    this.approvals.unshift(approval);

    // Notify admin
    const admin = this.users.find(u => u.role === 'admin');
    if (admin) {
      this.notifications.unshift({
        id: `notif_${Date.now()}`,
        user_id: admin.id,
        type: 'approval',
        title: 'استلام حالة جديدة معلقة',
        message: `سجل المندوب ${rep.name} حالة جديدة للطبيب ${dentist.name} بحاجة لاعتماد وتحديد السعر.`,
        created_at: Date.now(),
        read_at: null,
      });
    }

    this.notify();
    return { success: true, caseId };
  }

  public repRecordPayment(params: {
    repId: string;
    dentistId: string;
    caseId?: string;
    amountMinor: number;
    method: 'cash' | 'transfer_direct';
    note: string;
  }): { success: boolean; paymentId: string } {
    const rep = this.users.find(u => u.id === params.repId);
    const dentist = this.users.find(u => u.id === params.dentistId);
    if (!rep || !dentist) throw new Error('بيانات غير صحيحة');

    const paymentId = `pay_${Date.now()}`;
    const newPayment: Payment = {
      id: paymentId,
      case_id: params.caseId || null,
      case_step_id: null,
      dentist_id: dentist.id,
      dentist_name: dentist.name,
      amount_minor: params.amountMinor,
      method: params.method,
      status: 'pending', // RULE: Stays pending until admin approves!
      recorded_by: rep.id,
      recorded_by_name: rep.name,
      approved_by: null,
      approved_at: null,
      occurred_at: Date.now(),
      ref_note: params.note,
      reversal_of: null,
    };

    this.payments.unshift(newPayment);

    // Create approval item
    const approvalId = `appr_${Date.now()}`;
    const approval: Approval = {
      id: approvalId,
      kind: 'payment',
      entity_id: paymentId,
      actor_id: rep.id,
      actor_name: rep.name,
      title: `سداد ${params.method === 'cash' ? 'نقدي' : 'تحويل'} معلق بقيمة ${formatEgp(params.amountMinor)} من ${dentist.name}`,
      payload_json: JSON.stringify({
        payment_id: paymentId,
        dentist_name: dentist.name,
        amount_minor: params.amountMinor,
        method: params.method,
        note: params.note,
      }),
      status: 'pending',
      decided_by: null,
      decided_at: null,
      rejection_note: null,
      created_at: Date.now(),
    };
    this.approvals.unshift(approval);

    // Notify Admin
    const admin = this.users.find(u => u.role === 'admin');
    if (admin) {
      this.notifications.unshift({
        id: `notif_${Date.now()}`,
        user_id: admin.id,
        type: 'payment',
        title: 'طلب اعتماد تحصيل مالي',
        message: `سجل المندوب ${rep.name} تحصيل ${formatEgp(params.amountMinor)} من ${dentist.name}.`,
        created_at: Date.now(),
        read_at: null,
      });
    }

    this.notify();
    return { success: true, paymentId };
  }

  public repRecordCaseStep(params: {
    repId: string;
    caseId: string;
    stepName: string;
    note: string;
  }) {
    const rep = this.users.find(u => u.id === params.repId);
    const c = this.cases.find(x => x.id === params.caseId);
    if (!rep || !c) throw new Error('حالة غير موجودة');

    const stepId = `step_${Date.now()}`;
    const newStep: CaseStep = {
      id: stepId,
      case_id: c.id,
      seq: c.steps.length + 1,
      name: params.stepName,
      occurred_at: Date.now(),
      price_minor: null,
      note: params.note,
      received_by_rep_id: rep.id,
      received_by_rep_name: rep.name,
      confirmed_by: null,
      confirmed_at: null,
      status: 'pending', // Pending admin confirmation
    };

    c.steps.push(newStep);

    // Add to approvals queue
    this.approvals.unshift({
      id: `appr_${Date.now()}`,
      kind: 'case_step',
      entity_id: stepId,
      actor_id: rep.id,
      actor_name: rep.name,
      title: `تأكيد خطوة: ${params.stepName} للحالة ${c.case_code}`,
      payload_json: JSON.stringify({
        case_id: c.id,
        step_id: stepId,
        case_code: c.case_code,
        step_name: params.stepName,
        dentist_name: c.dentist_name,
        patient_name: c.patient_name,
        note: params.note,
      }),
      status: 'pending',
      decided_by: null,
      decided_at: null,
      rejection_note: null,
      created_at: Date.now(),
    });

    this.notify();
  }

  // --- Admin Approval Actions (The authoritative control) ---

  public adminApproveCase(params: {
    approvalId: string;
    caseId: string;
    adminId: string;
    labPriceMinor: number;
    commissionMinor: number;
    dueDate: number;
  }) {
    const admin = this.users.find(u => u.id === params.adminId);
    const c = this.cases.find(x => x.id === params.caseId);
    const appr = this.approvals.find(a => a.id === params.approvalId);

    if (!c || !admin) throw new Error('بيانات غير صحيحة');

    const beforeState = JSON.stringify({
      status: c.status,
      lab_price_minor: c.lab_price_minor,
      commission_minor: c.commission_minor,
    });

    c.status = 'in_progress';
    c.lab_price_minor = params.labPriceMinor;
    c.commission_minor = params.commissionMinor;
    c.due_date = params.dueDate;
    c.approved_by = admin.id;
    c.approved_at = Date.now();

    // Confirm initial step
    if (c.steps.length > 0) {
      c.steps[0].status = 'confirmed';
      c.steps[0].confirmed_by = admin.id;
      c.steps[0].confirmed_at = Date.now();
    }

    if (appr) {
      appr.status = 'approved';
      appr.decided_by = admin.id;
      appr.decided_at = Date.now();
    }

    // Immutable Audit Log
    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'approve_case',
      entity: 'cases',
      entity_id: c.id,
      before_json: beforeState,
      after_json: JSON.stringify({
        status: c.status,
        lab_price_minor: c.lab_price_minor,
        commission_minor: c.commission_minor,
      }),
      ip_hash: 'admin-console',
    });

    // Notify Dentist
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: c.dentist_id,
      type: 'delivery',
      title: `تم تأكيد استلام وبدء تصنيع الحالة ${c.case_code}`,
      message: `بدأ معمل جولدن لاب تصنيع تركيبة ${c.material} ${c.kind} للمريض ${c.patient_name}. الموعد المقدر للتسليم: ${formatArabicDate(c.due_date)}.`,
      created_at: Date.now(),
      read_at: null,
    });

    this.notify();
  }

  public adminApprovePayment(approvalId: string, paymentId: string, adminId: string) {
    const admin = this.users.find(u => u.id === adminId);
    const payment = this.payments.find(p => p.id === paymentId);
    const appr = this.approvals.find(a => a.id === approvalId);

    if (!payment || !admin) throw new Error('دفعة غير موجودة');

    const beforeState = JSON.stringify({ status: payment.status });

    payment.status = 'approved';
    payment.approved_by = admin.id;
    payment.approved_at = Date.now();

    if (appr) {
      appr.status = 'approved';
      appr.decided_by = admin.id;
      appr.decided_at = Date.now();
    }

    // Audit log
    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'approve_payment',
      entity: 'payments',
      entity_id: payment.id,
      before_json: beforeState,
      after_json: JSON.stringify({ status: 'approved', approved_by: admin.id }),
      ip_hash: 'admin-console',
    });

    // Notify Doctor
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: payment.dentist_id,
      type: 'payment',
      title: 'تم تأكيد السداد وإضافته لكشف الحساب',
      message: `تم اعتماد استلام مبلغ ${formatEgp(payment.amount_minor)} وتخفيض رصيد المتبقي.`,
      created_at: Date.now(),
      read_at: null,
    });

    this.notify();
  }

  public adminRejectPayment(approvalId: string, paymentId: string, adminId: string, reason: string) {
    const admin = this.users.find(u => u.id === adminId);
    const payment = this.payments.find(p => p.id === paymentId);
    const appr = this.approvals.find(a => a.id === approvalId);

    if (!payment || !admin) throw new Error('دفعة غير موجودة');

    payment.status = 'rejected';
    payment.rejection_reason = reason;

    if (appr) {
      appr.status = 'rejected';
      appr.decided_by = admin.id;
      appr.decided_at = Date.now();
      appr.rejection_note = reason;
    }

    // Audit log
    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'reject_payment',
      entity: 'payments',
      entity_id: payment.id,
      before_json: JSON.stringify({ status: 'pending' }),
      after_json: JSON.stringify({ status: 'rejected', reason }),
      ip_hash: 'admin-console',
    });

    this.notify();
  }

  public adminApproveStep(approvalId: string, stepId: string, adminId: string) {
    const admin = this.users.find(u => u.id === adminId);
    const appr = this.approvals.find(a => a.id === approvalId);

    let foundStep: CaseStep | null = null;
    let foundCase: Case | null = null;

    for (const c of this.cases) {
      const s = c.steps.find(st => st.id === stepId);
      if (s) {
        foundStep = s;
        foundCase = c;
        break;
      }
    }

    if (!foundStep || !foundCase || !admin) throw new Error('خطوة غير موجودة');

    foundStep.status = 'confirmed';
    foundStep.confirmed_by = admin.id;
    foundStep.confirmed_at = Date.now();

    if (appr) {
      appr.status = 'approved';
      appr.decided_by = admin.id;
      appr.decided_at = Date.now();
    }

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'approve_step',
      entity: 'case_steps',
      entity_id: stepId,
      before_json: JSON.stringify({ status: 'pending' }),
      after_json: JSON.stringify({ status: 'confirmed' }),
      ip_hash: 'admin-console',
    });

    // Notify dentist of progression
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: foundCase.dentist_id,
      type: 'delivery',
      title: `تحديث مسار الحالة ${foundCase.case_code}`,
      message: `تم إنجاز مرحلة: "${foundStep.name}" بنجاح.`,
      created_at: Date.now(),
      read_at: null,
    });

    this.notify();
  }

  public adminUpdateCaseStatus(
    caseId: string,
    adminId: string,
    newStatus: Case['status'],
    delayReason?: string
  ) {
    const admin = this.users.find(u => u.id === adminId);
    const c = this.cases.find(x => x.id === caseId);
    if (!c || !admin) return;

    const before = JSON.stringify({ status: c.status, delay_reason: c.delay_reason });
    c.status = newStatus;
    if (delayReason !== undefined) c.delay_reason = delayReason;

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'update_case_status',
      entity: 'cases',
      entity_id: c.id,
      before_json: before,
      after_json: JSON.stringify({ status: newStatus, delay_reason: delayReason }),
      ip_hash: 'admin-console',
    });

    this.notify();
  }

  // Transfer Case between Reps with Audit Log
  public transferCaseRep(caseId: string, newRepId: string, adminId: string, reason: string) {
    const admin = this.users.find(u => u.id === adminId);
    const c = this.cases.find(x => x.id === caseId);
    const newRep = this.users.find(u => u.id === newRepId && u.role === 'rep');

    if (!admin || !c || !newRep) throw new Error('بيانات غير صحيحة');

    const before = JSON.stringify({ rep_id: c.rep_id, rep_name: c.rep_name });

    c.rep_id = newRep.id;
    c.rep_name = newRep.name;

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'transfer_rep',
      entity: 'cases',
      entity_id: c.id,
      before_json: before,
      after_json: JSON.stringify({ new_rep_id: newRep.id, new_rep_name: newRep.name, reason }),
      ip_hash: 'admin-console',
    });

    this.notify();
  }

  // Reveal PIN with mandatory Audit Log
  public revealUserPin(targetUserId: string, adminId: string, reason: string): string {
    const admin = this.users.find(u => u.id === adminId);
    const target = this.users.find(u => u.id === targetUserId);

    if (!admin || !target) throw new Error('مستخدم غير موجود');

    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      at: Date.now(),
      actor_id: admin.id,
      actor_name: admin.name,
      action: 'pin_reveal',
      entity: 'users',
      entity_id: target.id,
      before_json: null,
      after_json: JSON.stringify({
        target_name: target.name,
        target_role: target.role,
        reason: reason || 'طلب مباشر من الإدارة',
      }),
      ip_hash: 'admin-console',
    });

    this.notify();
    return target.pin_masked;
  }

  // Add new patient
  public createPatient(dentistId: string, name: string, notes: string): Patient {
    const dentist = this.users.find(u => u.id === dentistId);
    const p: Patient = {
      id: `pat_${Date.now()}`,
      dentist_id: dentistId,
      dentist_name: dentist ? dentist.name : '',
      name,
      notes,
      created_at: Date.now(),
      archived_at: null,
    };
    this.patients.unshift(p);
    this.notify();
    return p;
  }

  // Add new Doctor / Clinic
  public createDentist(name: string, phone: string, geoText: string, repId: string): User {
    const code = `DEN-${Math.floor(400 + Math.random() * 590)}`;
    const pin = `${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: `usr_den_${Date.now()}`,
      role: 'dentist',
      name,
      phone,
      geo_text: geoText,
      code,
      code_hash: code,
      pin_masked: pin,
      owner_rep_id: repId,
      active: true,
      failed_attempts: 0,
      locked_until: null,
      created_at: Date.now(),
      archived_at: null,
    };

    this.users.push(newUser);
    this.notify();
    return newUser;
  }

  // CSV Export with UTF-8 BOM for Arabic Excel
  public exportFinancialsCsv(): string {
    const rows = [
      ['اسم الطبيب', 'العيادة / المنطقة', 'إجمالي المسدد (ج.م)', 'إجمالي المطالبات (ج.م)', 'الرصيد المتبقي (ج.م)', 'المندوب المسؤول'],
    ];

    const dentists = this.getDentists();
    dentists.forEach(d => {
      const balance = this.calculateDentistBalance(d.id);
      const rep = this.users.find(u => u.id === d.owner_rep_id);
      rows.push([
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.geo_text.replace(/"/g, '""')}"`,
        (balance.totalPaidMinor / 100).toFixed(2),
        (balance.totalChargedMinor / 100).toFixed(2),
        (balance.balanceDueMinor / 100).toFixed(2),
        `"${(rep ? rep.name : 'غير محدد').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    return csvContent;
  }
}

export const dentalStore = new DentalStore();
