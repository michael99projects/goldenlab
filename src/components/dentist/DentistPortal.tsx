import React, { useState } from 'react';
import { 
  FolderKanban, 
  Users, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Calendar, 
  MessageSquarePlus, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Send,
  Sparkles,
  Search,
  AlertTriangle
} from 'lucide-react';
import { User, Case, Patient, Payment } from '../../types';
import { dentalStore } from '../../services/store';
import { CaseTimeline } from '../common/Timeline';
import { formatArabicDate, formatArabicDateTime, formatEgp } from '../../lib/crypto';

interface DentistPortalProps {
  currentUser: User;
}

export const DentistPortal: React.FC<DentistPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'patients' | 'financials'>('cases');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorNote, setDoctorNote] = useState('');
  const [noteSentMessage, setNoteSentMessage] = useState<string | null>(null);

  // Scoped queries (Strictly enforced by store)
  const myCases = dentalStore.getCasesForViewer(currentUser);
  const myPatients = dentalStore.getPatientsForViewer(currentUser);
  const myPayments = dentalStore.getPaymentsForViewer(currentUser);
  const balance = dentalStore.calculateDentistBalance(currentUser.id);

  // Filter cases
  const filteredCases = myCases.filter(c => {
    const matchesSearch = 
      c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.kind.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const handleSendNote = (caseItem: Case) => {
    if (!doctorNote.trim()) return;
    dentalStore.repRecordCaseStep({
      repId: currentUser.id,
      caseId: caseItem.id,
      stepName: `ملاحظة واستفسار من الطبيب (${currentUser.name})`,
      note: doctorNote.trim(),
    });
    setDoctorNote('');
    setNoteSentMessage('تم إرسال الملاحظة بنجاح إلى إدارة المعمل وستظهر كبند للمراجعة.');
    setTimeout(() => setNoteSentMessage(null), 4000);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome & Summary Header (Hidden on print) */}
      <div className="no-print bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                بوابة الطبيب المعتمد
              </span>
              <span className="text-xs text-slate-400 font-mono">كود الطبيب: {currentUser.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cairo']">
              أهلاً بك، {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentUser.geo_text}
            </p>
          </div>

          {/* Quick Balance Preview Card */}
          <div className="flex items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-md">
            <div>
              <span className="text-xs text-slate-400 block font-medium">الرصيد المتبقي للمعمل:</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {formatEgp(balance.balanceDueMinor)}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-700 mx-2" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">إجمالي المسدد:</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                {formatEgp(balance.totalPaidMinor)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Nav Tabs */}
        <div className="flex items-center gap-2 mt-8 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'cases'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>حالاتي ومسار التصنيع ({myCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'patients'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مرضاي ({myPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'financials'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>كشف الحساب وسجل السداد</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: CASES --- */}
      {activeTab === 'cases' && (
        <div className="no-print space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المريض، كود الحالة، الخامة (Zirconia, E-Max...)"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'in_progress', label: 'جارية' },
                { id: 'ready_for_delivery', label: 'جاهزة للتسليم' },
                { id: 'delivered', label: 'تم التسليم' },
                { id: 'pending_lab', label: 'منتظر تأكيد المعمل' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          {filteredCases.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/70">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">لا توجد حالات مطابقة</h3>
              <p className="text-xs text-slate-400 mt-1">
                تأكد من كتابة الاسم بصورة صحيحة أو قم بتغيير الفلتر
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCases.map(c => {
                const isExpanded = selectedCaseId === c.id;
                // Calculate payments for this specific case if mapped
                const casePayments = myPayments.filter(p => p.case_id === c.id && p.status === 'approved');
                const casePaidMinor = casePayments.reduce((acc, p) => acc + p.amount_minor, 0);
                const caseDueMinor = Math.max(0, (c.lab_price_minor || 0) - casePaidMinor);

                return (
                  <div 
                    key={c.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-amber-400/50 transition-all"
                  >
                    {/* Case Summary Card */}
                    <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {c.case_code}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {c.material} • {c.kind}
                          </span>
                          {c.status === 'ready_for_delivery' && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              جاهزة للتسليم
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-slate-900 mt-2 font-['Cairo']">
                          المريض: {c.patient_name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span>الأسنان: <strong className="text-slate-800 font-mono">{c.teeth_info}</strong></span>
                          <span>•</span>
                          <span>الوحدات: <strong className="text-slate-800">{c.units}</strong></span>
                          <span>•</span>
                          <span>الموعد المقدر: <strong className="text-slate-800">{formatArabicDate(c.due_date)}</strong></span>
                          <span>•</span>
                          <span>المندوب: <strong className="text-slate-800">{c.rep_name}</strong></span>
                        </div>
                      </div>

                      {/* Financial info & Expand Toggle */}
                      <div className="flex items-center gap-4">
                        <div className="text-left bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                          <span className="text-[11px] text-slate-400 block font-medium">تكلفة التركيبة:</span>
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {c.approved_at ? formatEgp(c.lab_price_minor) : 'قيد التسعير'}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedCaseId(isExpanded ? null : c.id)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isExpanded
                              ? 'bg-slate-900 text-white'
                              : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          <span>{isExpanded ? 'إخفاء التايم لاين' : 'عرض التايم لاين الملون'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Timeline View */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100 space-y-6 animate-in fade-in duration-150">
                        <CaseTimeline
                          dentalCase={c}
                          totalPaidMinor={casePaidMinor}
                          balanceDueMinor={caseDueMinor}
                          isDentistView={true}
                        />

                        {/* Interactive Doctor Note Box */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-sm">
                            <MessageSquarePlus className="w-4 h-4 text-amber-600" />
                            <span>إرسال ملاحظة أو استفسار فني لإدارة المعمل بخصوص هذه الحالة:</span>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={doctorNote}
                              onChange={e => setDoctorNote(e.target.value)}
                              placeholder="مثال: يرجى التحقق من نقطة التماس مع الضاحك 15، أو تعديل التدرج اللوني..."
                              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              onClick={() => handleSendNote(c)}
                              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>إرسال للمعمل</span>
                            </button>
                          </div>

                          {noteSentMessage && (
                            <p className="text-xs text-emerald-600 font-semibold mt-2 animate-in fade-in">
                              ✓ {noteSentMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PATIENTS --- */}
      {activeTab === 'patients' && (
        <div className="no-print space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPatients.map(p => {
              const patientCases = myCases.filter(c => c.patient_id === p.id);
              return (
                <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 font-['Cairo']">
                      {p.name}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {patientCases.length} حالات مسجلة
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    <strong>ملاحظات سريرية:</strong> {p.notes || 'لا توجد ملاحظات إضافية'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      التركيبات الجارية والسابقة:
                    </h5>
                    <div className="space-y-1.5">
                      {patientCases.map(pc => (
                        <div key={pc.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/40 border border-amber-100">
                          <span className="font-bold text-slate-800">{pc.material} {pc.kind} ({pc.teeth_info})</span>
                          <span className="font-mono text-amber-800 font-semibold">{pc.case_code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: FINANCIAL STATEMENT (Printable) --- */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Action bar (Hidden on print) */}
          <div className="no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h3 className="font-bold text-slate-900 text-base">كشف الحساب المالي والمدفوعات</h3>
              <p className="text-xs text-slate-500">حساب الأرصدة مدقق بالأقراش وبناءً على القيود المعتمدة حصراً</p>
            </div>
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب الرسمي</span>
            </button>
          </div>

          {/* Printable Official Statement Container */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Lab Print Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 font-['Cairo']">
                    GOLDEN LAB • معمل الأسنان المتخصص
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    كشف حساب العيادة المعتمد • سجل المطالبات والتحصيلات
                  </p>
                  <div className="mt-3 text-xs text-slate-700 space-y-0.5">
                    <p><strong>اسم الطبيب / العيادة:</strong> {currentUser.name}</p>
                    <p><strong>العنوان / خط السير:</strong> {currentUser.geo_text}</p>
                    <p><strong>كود الحساب:</strong> <span className="font-mono">{currentUser.code}</span></p>
                  </div>
                </div>

                <div className="text-left text-xs text-slate-500">
                  <p>تاريخ استخراج الكشف:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{formatArabicDate(Date.now())}</p>
                  <div className="mt-4 px-3 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200 font-semibold inline-block">
                    بيان رسمي معتمد
                  </div>
                </div>
              </div>
            </div>

            {/* Balances Highlight */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-medium block">إجمالي مطالبات التركيبات:</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1 block">
                  {formatEgp(balance.totalChargedMinor)}
                </span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-700 font-medium block">إجمالي المسدد الفعلي:</span>
                <span className="text-lg sm:text-xl font-black text-emerald-800 font-mono mt-1 block">
                  {formatEgp(balance.totalPaidMinor)}
                </span>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center">
                <span className="text-xs text-red-700 font-medium block">الرصيد المتبقي مستحق الدفع:</span>
                <span className="text-lg sm:text-xl font-black text-red-800 font-mono mt-1 block">
                  {formatEgp(balance.balanceDueMinor)}
                </span>
              </div>
            </div>

            {/* Payments Table */}
            <h4 className="font-bold text-sm text-slate-800 mb-3">سجل الدفعات والتحصيلات المعتمدة:</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الإيصال</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">طريقة السداد</th>
                    <th className="p-3">البيان والملاحظات</th>
                    <th className="p-3">المستلم المعتمد</th>
                    <th className="p-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayments.map(pay => (
                    <tr key={pay.id} className={pay.status === 'pending' ? 'bg-amber-50/50' : ''}>
                      <td className="p-3 font-mono font-bold text-slate-800">{pay.id}</td>
                      <td className="p-3 text-slate-600">{formatArabicDate(pay.occurred_at)}</td>
                      <td className="p-3 font-medium">
                        {pay.method === 'cash' ? 'نقدًا (كاش)' : 'تحويل مباشر / محفظة'}
                      </td>
                      <td className="p-3 text-slate-600">{pay.ref_note || '—'}</td>
                      <td className="p-3 text-slate-700">{pay.recorded_by_name}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {formatEgp(pay.amount_minor)}
                        {pay.status === 'pending' && (
                          <span className="text-[10px] text-amber-600 mr-2 font-normal">(معلق)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Line for Print */}
            <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
              <div>
                <p>توقيع وختم الحسابات بالمعمل:</p>
                <div className="mt-8 border-b border-dashed border-slate-400 w-48" />
              </div>
              <div className="text-left">
                <p>توقيع واستلام الطبيب / العيادة:</p>
                <div className="mt-8 border-b border-dashed border-slate-400 w-48 mr-auto" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
