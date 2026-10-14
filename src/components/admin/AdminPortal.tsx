import React, { useState } from 'react';
import { 
  CheckSquare, 
  DollarSign, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Key, 
  ArrowRightLeft, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  AlertTriangle,
  Send,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  Layers
} from 'lucide-react';
import { User, Case, Payment, Approval, AuditLog } from '../../types';
import { dentalStore } from '../../services/store';
import { formatArabicDate, formatArabicDateTime, formatEgp, poundsToMinor } from '../../lib/crypto';

interface AdminPortalProps {
  currentUser: User;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'approvals' | 'finance' | 'people' | 'schedule' | 'audit'>('today');
  
  // Data subscriptions
  const cases = dentalStore.getCasesForViewer(currentUser);
  const dentists = dentalStore.getDentists();
  const reps = dentalStore.getReps();
  const approvals = dentalStore.getApprovalsForViewer(currentUser);
  const payments = dentalStore.getPaymentsForViewer(currentUser);
  const auditLogs = dentalStore.getAuditLogs();
  const stats = dentalStore.getGlobalFinancialStats();

  // Approval Form State (when clicking on a pending case)
  const [selectedCaseToApprove, setSelectedCaseToApprove] = useState<Case | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>('');
  const [approvalLabPriceEgp, setApprovalLabPriceEgp] = useState<string>('900');
  const [approvalCommissionEgp, setApprovalCommissionEgp] = useState<string>('75');
  const [approvalDueDateDays, setApprovalDueDateDays] = useState<number>(3);

  // Reject Modal State
  const [rejectingApprovalId, setRejectingApprovalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Transfer Rep State
  const [transferCaseId, setTransferCaseId] = useState<string>('');
  const [transferNewRepId, setTransferNewRepId] = useState<string>(reps[0]?.id || '');
  const [transferReason, setTransferReason] = useState<string>('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Reveal PIN State
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({});
  const [pinPromptUserId, setPinPromptUserId] = useState<string | null>(null);
  const [pinPromptReason, setPinPromptReason] = useState<string>('');

  // Add Dentist State
  const [showAddDentistModal, setShowAddDentistModal] = useState(false);
  const [newDentistName, setNewDentistName] = useState('');
  const [newDentistPhone, setNewDentistPhone] = useState('');
  const [newDentistGeo, setNewDentistGeo] = useState('');
  const [newDentistRepId, setNewDentistRepId] = useState(reps[0]?.id || '');

  // Search & Filter
  const [auditSearch, setAuditSearch] = useState('');

  // Metrics for "Today"
  const delayedCases = cases.filter(c => c.status === 'delayed' || (c.due_date < Date.now() && c.status !== 'delivered'));
  const readyToday = cases.filter(c => c.status === 'ready_for_delivery');

  // Handle Approving a Case
  const handleConfirmCaseApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseToApprove) return;

    dentalStore.adminApproveCase({
      approvalId: selectedApprovalId,
      caseId: selectedCaseToApprove.id,
      adminId: currentUser.id,
      labPriceMinor: poundsToMinor(Number(approvalLabPriceEgp) || 900),
      commissionMinor: poundsToMinor(Number(approvalCommissionEgp) || 75),
      dueDate: Date.now() + approvalDueDateDays * 86400000,
    });

    setSelectedCaseToApprove(null);
    setSelectedApprovalId('');
  };

  // Handle Approving a Payment
  const handleApprovePayment = (approval: Approval) => {
    const payload = JSON.parse(approval.payload_json);
    dentalStore.adminApprovePayment(approval.id, payload.payment_id, currentUser.id);
  };

  // Handle Rejecting
  const handleConfirmReject = () => {
    if (!rejectingApprovalId || !rejectReason.trim()) return;
    const approval = approvals.find(a => a.id === rejectingApprovalId);
    if (!approval) return;

    const payload = JSON.parse(approval.payload_json);
    if (approval.kind === 'payment') {
      dentalStore.adminRejectPayment(approval.id, payload.payment_id, currentUser.id, rejectReason);
    }
    setRejectingApprovalId(null);
    setRejectReason('');
  };

  // Handle Reveal PIN
  const handleConfirmRevealPin = () => {
    if (!pinPromptUserId || !pinPromptReason.trim()) {
      alert('يرجى ذكر سبب استرجاع الرمز السري لتسجيله في سجل التدقيق الأمني');
      return;
    }
    const plainPin = dentalStore.revealUserPin(pinPromptUserId, currentUser.id, pinPromptReason);
    setRevealedPins(prev => ({ ...prev, [pinPromptUserId]: plainPin }));
    setPinPromptUserId(null);
    setPinPromptReason('');
  };

  // Handle Transfer Rep
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferCaseId || !transferNewRepId || !transferReason.trim()) return;

    dentalStore.transferCaseRep(transferCaseId, transferNewRepId, currentUser.id, transferReason);
    setShowTransferModal(false);
    setTransferReason('');
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvData = dentalStore.exportFinancialsCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `golden_lab_financials_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                لوحة التحكم الإدارية العليا
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {currentUser.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 font-['Cairo']">
              مركز إدارة المعمل • {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              إدارة الاعتمادات، التسعير، الأرصدة المدققة، وتوزيع المهام الميدانية
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير كشف الحسابات (Excel)</span>
            </button>
          </div>
        </div>

        {/* 6 Tabs */}
        <div className="flex items-center gap-2 mt-8 border-t border-slate-800 pt-4 overflow-x-auto">
          {[
            { id: 'today', label: 'اليوم', icon: Clock },
            { id: 'approvals', label: `الاعتمادات (${approvals.length})`, icon: CheckSquare, badge: approvals.length > 0 },
            { id: 'finance', label: 'المالية والمخططات', icon: DollarSign },
            { id: 'people', label: 'الناس (العيادات والمندوبين)', icon: Users },
            { id: 'schedule', label: 'الأجندة الأسبوعية', icon: Calendar },
            { id: 'audit', label: 'سجل التدقيق (Audit)', icon: ShieldAlert },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- TAB 1: TODAY --- */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">بانتظار الاعتماد</span>
                <CheckSquare className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-3xl font-black text-slate-900 mt-2 block font-mono">
                {approvals.length}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">طلبات تسعير وسداد معلقة</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">تحصيل اليوم</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-emerald-700 mt-2 block font-mono">
                {formatEgp(stats.todayCollectedMinor)}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">تم تأكيدها نقدًا وتحويلات</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">حالات متأخرة</span>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-3xl font-black text-red-600 mt-2 block font-mono">
                {delayedCases.length}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">تجاوزت الموعد المسجل</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">جاهزة للتسليم</span>
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900 mt-2 block font-mono">
                {readyToday.length}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">مجدولة لخطوط السير اليوم</span>
            </div>
          </div>

          {/* Quick Approvals Preview if any */}
          {approvals.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-700" />
                  <h3 className="font-bold text-sm text-amber-950">
                    تنبيه: لديك {approvals.length} بنود معلقة بانتظار اعتمادك
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="text-xs font-black text-amber-800 hover:underline"
                >
                  الانتقال لقائمة الاعتمادات ←
                </button>
              </div>

              <div className="divide-y divide-amber-200/60">
                {approvals.slice(0, 3).map(a => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{a.title}</span>
                      <span className="text-slate-500 mr-2">بواسطة: {a.actor_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatArabicDateTime(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: APPROVALS INBOX (The authoritative core) --- */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Cairo']">صندوق الاعتمادات والتسعير</h2>
              <p className="text-xs text-slate-500">لا يدخل أي إجراء في حسابات الطبيب أو التقارير إلا بعد موافقتك هنا</p>
            </div>
          </div>

          {approvals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/70">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">صندوق الاعتمادات فارغ!</h3>
              <p className="text-xs text-slate-400 mt-1">جميع الحالات والمدفوعات والخطوات معتمدة ومطابقة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map(approval => {
                const payload = JSON.parse(approval.payload_json);

                return (
                  <div key={approval.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900">
                            {approval.kind === 'case' ? 'حالة جديدة بحاجة لتسعير' : approval.kind === 'payment' ? 'تحصيل مالي معلق' : 'خطوة مسار'}
                          </span>
                          <span className="text-xs text-slate-400">
                            المسجل: <strong className="text-slate-700">{approval.actor_name}</strong>
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-1.5 font-['Cairo']">
                          {approval.title}
                        </h4>
                      </div>

                      <span className="text-xs text-slate-400">{formatArabicDateTime(approval.created_at)}</span>
                    </div>

                    {/* Content Details */}
                    <div className="py-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl my-3 border border-slate-100">
                      {approval.kind === 'case' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div><span className="text-slate-400">الطبيب:</span> <strong className="text-slate-800 block">{payload.dentist}</strong></div>
                          <div><span className="text-slate-400">المريض:</span> <strong className="text-slate-800 block">{payload.patient}</strong></div>
                          <div><span className="text-slate-400">الخامة والنوع:</span> <strong className="text-slate-800 block">{payload.material} {payload.kind}</strong></div>
                          <div><span className="text-slate-400">الأسنان:</span> <strong className="text-slate-800 block font-mono">{payload.teeth}</strong></div>
                        </div>
                      )}

                      {approval.kind === 'payment' && (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-slate-400">الطبيب:</span> <strong className="text-slate-800 mr-1">{payload.dentist_name}</strong>
                            <span className="mx-2">•</span>
                            <span className="text-slate-400">طريقة السداد:</span> <strong className="text-slate-800 mr-1">{payload.method === 'cash' ? 'كاش' : 'تحويل مباشر'}</strong>
                            <span className="mx-2">•</span>
                            <span className="text-slate-400">ملاحظة:</span> <span className="text-slate-700 mr-1">{payload.note}</span>
                          </div>
                          <div className="text-base font-black text-emerald-700 font-mono">
                            {formatEgp(payload.amount_minor)}
                          </div>
                        </div>
                      )}

                      {approval.kind === 'case_step' && (
                        <div>
                          <p><strong>الخطوة:</strong> {payload.step_name}</p>
                          <p className="mt-1 text-slate-500">ملاحظة: {payload.note || 'لا توجد'}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {approval.kind === 'case' && (
                        <button
                          onClick={() => {
                            const found = cases.find(c => c.id === payload.case_id);
                            if (found) {
                              setSelectedCaseToApprove(found);
                              setSelectedApprovalId(approval.id);
                            }
                          }}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                        >
                          تحديد السعر والموعد واعتماد الحالة
                        </button>
                      )}

                      {approval.kind === 'payment' && (
                        <>
                          <button
                            onClick={() => {
                              setRejectingApprovalId(approval.id);
                              setRejectReason('المبلغ لم يُودع أو غير مطابق');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200"
                          >
                            رفض السداد
                          </button>
                          <button
                            onClick={() => handleApprovePayment(approval)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            اعتماد السداد وتخفيض الرصيد
                          </button>
                        </>
                      )}

                      {approval.kind === 'case_step' && (
                        <button
                          onClick={() => dentalStore.adminApproveStep(approval.id, payload.step_id, currentUser.id)}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                        >
                          تأكيد الخطوة
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal to Approve Case & Set Price */}
          {selectedCaseToApprove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-right animate-in fade-in">
                <h3 className="text-xl font-black text-slate-900 font-['Cairo']">
                  اعتماد وتأكيد حالة: {selectedCaseToApprove.material} {selectedCaseToApprove.kind}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  المريض: {selectedCaseToApprove.patient_name} • عيادة {selectedCaseToApprove.dentist_name}
                </p>

                <form onSubmit={handleConfirmCaseApproval} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      سعر المعمل المعتمد (بالجنيه المصري)
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={approvalLabPriceEgp}
                      onChange={e => setApprovalLabPriceEgp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono font-bold text-lg text-slate-900"
                      required
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      سيُحفظ في القاعدة بالأقراش ({poundsToMinor(Number(approvalLabPriceEgp))} قرش)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عمولة المندوب ({selectedCaseToApprove.rep_name})
                    </label>
                    <input
                      type="number"
                      step={5}
                      value={approvalCommissionEgp}
                      onChange={e => setApprovalCommissionEgp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      مهلة التسليم المتوقعة (بالأيام)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={approvalDueDateDays}
                      onChange={e => setApprovalDueDateDays(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono font-bold text-sm"
                      required
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      الموعد المتوقع: {formatArabicDate(Date.now() + approvalDueDateDays * 86400000)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedCaseToApprove(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
                    >
                      تأكيد الاعتماد وبدء العمل
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal to Reject Approval */}
          {rejectingApprovalId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-right animate-in fade-in">
                <h3 className="text-lg font-black text-red-700">رفض الطلب المعلق</h3>
                <p className="text-xs text-slate-500 mt-1">يُرجى توضيح سبب الرفض ليتم تسجيله في سجل التدقيق</p>
                <div className="mt-4">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="سبب الرفض..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setRejectingApprovalId(null)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-600"
                  >
                    تراجع
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    تأكيد الرفض
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: FINANCE & CHARTS --- */}
      {activeTab === 'finance' && (
        <div className="space-y-8">
          {/* Top 3 Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Collections vs Due */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-800">1. نسبة التحصيل إلى المتبقي</h3>
                <PieChart className="w-4 h-4 text-slate-400" />
              </div>
              
              <div className="h-40 flex items-center justify-center">
                <div className="relative w-32 h-32 rounded-full border-8 border-emerald-500 flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <span className="text-xs text-slate-400 block font-medium">المحصل</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {Math.round((stats.totalCollectedMinor / (stats.totalChargedMinor || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-center">
                <div>
                  <span className="text-emerald-700 font-bold block">{formatEgp(stats.totalCollectedMinor)}</span>
                  <span className="text-slate-400">إجمالي المحصل</span>
                </div>
                <div>
                  <span className="text-red-700 font-bold block">{formatEgp(stats.totalOutstandingMinor)}</span>
                  <span className="text-slate-400">إجمالي المتبقي</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Materials Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-800">2. توزيع الخامات المصنعة</h3>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { name: 'E-Max (Lithium Disilicate)', count: cases.filter(c => c.material === 'E-Max').length, color: 'bg-amber-500' },
                  { name: 'Zirconia Multi-layer', count: cases.filter(c => c.material === 'Zirconia').length, color: 'bg-blue-500' },
                  { name: 'PFM (خزف على معدن)', count: cases.filter(c => c.material === 'PFM').length, color: 'bg-emerald-500' },
                ].map(m => {
                  const pct = Math.round((m.count / (cases.length || 1)) * 100);
                  return (
                    <div key={m.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{m.name}</span>
                        <span className="font-mono text-slate-500">{m.count} حالة ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${m.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 3: Payment Inflows */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-800">3. وسائل التدفقات المالية</h3>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4 pt-3">
                {(() => {
                  const cashTotal = payments.filter(p => p.status === 'approved' && p.method === 'cash').reduce((acc, p) => acc + p.amount_minor, 0);
                  const transferTotal = payments.filter(p => p.status === 'approved' && p.method === 'transfer_direct').reduce((acc, p) => acc + p.amount_minor, 0);
                  return (
                    <>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 block">نقدًا كاش مع المندوبين:</span>
                          <span className="text-sm font-bold text-slate-900 font-mono">{formatEgp(cashTotal)}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Cash</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 block">تحويلات بنكية وإنستاباي:</span>
                          <span className="text-sm font-bold text-slate-900 font-mono">{formatEgp(transferTotal)}</span>
                        </div>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">Digital</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Doctors Financial Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-['Cairo']">كشف حسابات العيادات والأطباء</h3>
                <p className="text-xs text-slate-500">مجموع الأرصدة مدقق بالأقراش دون تقريب عائم</p>
              </div>
              <button
                onClick={handleExportCsv}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200"
              >
                تنزيل CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">اسم الطبيب</th>
                    <th className="p-4">المنطقة / خط السير</th>
                    <th className="p-4">المندوب المسؤول</th>
                    <th className="p-4">إجمالي المطالبات</th>
                    <th className="p-4">المسدد الفعلي</th>
                    <th className="p-4">الرصيد المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dentists.map(d => {
                    const b = dentalStore.calculateDentistBalance(d.id);
                    const rep = reps.find(r => r.id === d.owner_rep_id);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{d.name}</td>
                        <td className="p-4 text-slate-600">{d.geo_text}</td>
                        <td className="p-4 text-slate-700 font-medium">{rep ? rep.name : 'غير مخصص'}</td>
                        <td className="p-4 font-mono font-bold text-slate-800">{formatEgp(b.totalChargedMinor)}</td>
                        <td className="p-4 font-mono font-bold text-emerald-700">{formatEgp(b.totalPaidMinor)}</td>
                        <td className="p-4 font-mono font-bold text-red-700">{formatEgp(b.balanceDueMinor)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PEOPLE (Doctors & Reps) --- */}
      {activeTab === 'people' && (
        <div className="space-y-8">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Cairo']">إدارة الأطباء والمندوبين</h2>
              <p className="text-xs text-slate-500">استرجاع الأكواد والـ PIN المسجل مع التوثيق، ونقل الحالات بين المندوبين</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span>نقل حالة لمندوب آخر</span>
              </button>
              <button
                onClick={() => setShowAddDentistModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طبيب جديد</span>
              </button>
            </div>
          </div>

          {/* Dentists Directory */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-4">قائمة أطباء الأسنان والعيادات:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dentists.map(d => {
                const rep = reps.find(r => r.id === d.owner_rep_id);
                const isPinRevealed = Boolean(revealedPins[d.id]);

                return (
                  <div key={d.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-black text-slate-900">{d.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {d.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{d.geo_text}</p>
                    <p className="text-xs text-slate-600 font-mono">هاتف: {d.phone}</p>
                    <p className="text-xs text-slate-600">المندوب: <strong>{rep ? rep.name : '—'}</strong></p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">PIN:</span>
                      {isPinRevealed ? (
                        <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          {revealedPins[d.id]}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPinPromptUserId(d.id);
                            setPinPromptReason('استرجاع بطلب من الطبيب لتسجيل الدخول');
                          }}
                          className="text-amber-700 hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>إظهار PIN (مع توثيق)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reps Directory */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-4">قائمة المندوبين الميدانيين:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reps.map(r => {
                const isPinRevealed = Boolean(revealedPins[r.id]);
                const comm = dentalStore.calculateRepCommissions(r.id);

                return (
                  <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-black text-slate-900">{r.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        {r.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{r.geo_text}</p>
                    <p className="text-xs text-slate-600 font-mono">هاتف: {r.phone}</p>
                    <p className="text-xs text-slate-600">عمولة معلقة: <strong className="font-mono text-amber-800">{formatEgp(comm.pendingMinor)}</strong></p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">PIN:</span>
                      {isPinRevealed ? (
                        <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          {revealedPins[r.id]}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPinPromptUserId(r.id);
                            setPinPromptReason('استرجاع PIN للمندوب');
                          }}
                          className="text-amber-700 hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>إظهار PIN (مع توثيق)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal to Transfer Rep */}
          {showTransferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-right animate-in fade-in">
                <h3 className="text-lg font-black text-slate-900">نقل حالة لمندوب آخر</h3>
                <p className="text-xs text-slate-500 mt-1">يتم تسجيل عملية النقل في سجل التدقيق الأمني (Audit Log)</p>

                <form onSubmit={handleConfirmTransfer} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اختر الحالة المراد نقلها</label>
                    <select
                      value={transferCaseId}
                      onChange={e => setTransferCaseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      required
                    >
                      <option value="">-- اختر الحالة --</option>
                      {cases.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.case_code} — {c.patient_name} (المندوب الحالي: {c.rep_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المندوب الجديد المستلم</label>
                    <select
                      value={transferNewRepId}
                      onChange={e => setTransferNewRepId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      required
                    >
                      {reps.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.geo_text})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">سبب النقل</label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={e => setTransferReason(e.target.value)}
                      placeholder="مثال: تغيير خط السير أو إجازة المندوب السابق..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowTransferModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-500"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      تأكيد النقل والتوثيق
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal to Reveal PIN Reason */}
          {pinPromptUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-right animate-in fade-in">
                <h3 className="text-lg font-black text-amber-800">توثيق كشف الرمز السري (PIN)</h3>
                <p className="text-xs text-slate-600 mt-1">
                  قاعدة الأمان: لا يُكشف الرمز السري إلا بعد إدخال سبب رسمي يُسجل في سجل التدقيق الأمني (Audit Log).
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">سبب الاسترجاع</label>
                  <input
                    type="text"
                    value={pinPromptReason}
                    onChange={e => setPinPromptReason(e.target.value)}
                    placeholder="مثال: طلب الطبيب تذكيره بالرمز هاتفياً..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setPinPromptUserId(null)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleConfirmRevealPin}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
                  >
                    توثيق وكشف الرمز
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal to Add Dentist */}
          {showAddDentistModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-right animate-in fade-in">
                <h3 className="text-lg font-black text-slate-900">إضافة طبيب / عيادة جديدة</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!newDentistName.trim()) return;
                    dentalStore.createDentist(newDentistName.trim(), newDentistPhone.trim(), newDentistGeo.trim(), newDentistRepId);
                    setShowAddDentistModal(false);
                    setNewDentistName('');
                  }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطبيب</label>
                    <input
                      type="text"
                      value={newDentistName}
                      onChange={e => setNewDentistName(e.target.value)}
                      placeholder="د. فلان الفلاني"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الهاتف</label>
                    <input
                      type="text"
                      value={newDentistPhone}
                      onChange={e => setNewDentistPhone(e.target.value)}
                      placeholder="010..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المنطقة والعيادة</label>
                    <input
                      type="text"
                      value={newDentistGeo}
                      onChange={e => setNewDentistGeo(e.target.value)}
                      placeholder="مدينة نصر - شارع عباس العقاد"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المندوب المسؤول</label>
                    <select
                      value={newDentistRepId}
                      onChange={e => setNewDentistRepId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    >
                      {reps.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddDentistModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-500"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
                    >
                      حفظ وتوليد الكود والـ PIN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: WEEKLY SCHEDULE --- */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-['Cairo']">الأجندة الأسبوعية لخطوط السير</h2>
            <p className="text-xs text-slate-500">توزيع مواعيد الاستلام والتسليم على أيام الأسبوع ومندوبي المعمل</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs text-center">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 border border-slate-800 w-32">المندوب</th>
                  {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map(day => (
                    <th key={day} className="p-3 border border-slate-800">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reps.map(rep => {
                  const repCases = cases.filter(c => c.rep_id === rep.id);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 bg-slate-50 border border-slate-200 text-right">
                        <div>{rep.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{rep.geo_text}</div>
                      </td>
                      {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((day, idx) => (
                        <td key={day} className="p-2 border border-slate-200 align-top h-24">
                          {idx % 2 === 0 && repCases[idx % repCases.length] ? (
                            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-right">
                              <span className="font-bold text-amber-900 block">
                                {repCases[idx % repCases.length].case_code}
                              </span>
                              <span className="text-slate-600 block">
                                {repCases[idx % repCases.length].dentist_name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {repCases[idx % repCases.length].material} {repCases[idx % repCases.length].kind}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[10px]">استلامات عادية</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: AUDIT LOG (Immutable) --- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Cairo']">سجل التدقيق الأمني (Audit Log)</h2>
              <p className="text-xs text-slate-500">سجل غير قابل للتعديل يوثق كل اعتماد مالي، تعديل سعر، أو كشف للـ PIN</p>
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="بحث في السجل..."
                className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الوقت والتاريخ</th>
                  <th className="p-3">المنفِّذ</th>
                  <th className="p-3">نوع الحركة (Action)</th>
                  <th className="p-3">الكيان المرتبط</th>
                  <th className="p-3">تفاصيل التغيير (Before / After)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs
                  .filter(l => 
                    l.actor_name.includes(auditSearch) || 
                    l.action.includes(auditSearch) || 
                    (l.after_json && l.after_json.includes(auditSearch))
                  )
                  .map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 font-mono">{formatArabicDateTime(log.at)}</td>
                      <td className="p-3 font-bold text-slate-900">{log.actor_name}</td>
                      <td className="p-3">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{log.entity}: {log.entity_id}</td>
                      <td className="p-3">
                        <pre className="text-[10px] font-mono bg-slate-900 text-amber-200 p-2 rounded-lg overflow-x-auto max-w-xs">
                          {log.after_json || 'No after state'}
                        </pre>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
