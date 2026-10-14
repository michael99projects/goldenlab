import React, { useState } from 'react';
import { 
  PlusCircle, 
  Truck, 
  Users, 
  BadgePercent, 
  CheckCircle2, 
  Clock, 
  Search, 
  DollarSign, 
  Layers, 
  FileText,
  AlertCircle,
  Sparkles,
  Send
} from 'lucide-react';
import { User, Case, Patient, MaterialType, RestorationKind } from '../../types';
import { dentalStore } from '../../services/store';
import { CaseTimeline } from '../common/Timeline';
import { formatArabicDate, formatEgp, poundsToMinor } from '../../lib/crypto';

interface RepPortalProps {
  currentUser: User;
}

export const RepPortal: React.FC<RepPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'new_case' | 'cases' | 'payment' | 'doctors' | 'commissions'>('new_case');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data scoped to this representative
  const myCases = dentalStore.getCasesForViewer(currentUser);
  const myDoctors = dentalStore.getDentists().filter(d => d.owner_rep_id === currentUser.id);
  const commissions = dentalStore.calculateRepCommissions(currentUser.id);

  // New Case Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(myDoctors[0]?.id || '');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);
  const [material, setMaterial] = useState<MaterialType>('E-Max');
  const [kind, setKind] = useState<RestorationKind>('Crown');
  const [teethInfo, setTeethInfo] = useState('14');
  const [units, setUnits] = useState(1);
  const [initialStepName, setInitialStepName] = useState('استلام الطبعة السيليكونية وتأكيد المقاس');
  const [notes, setNotes] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Payment Recording Form State
  const [paymentDoctorId, setPaymentDoctorId] = useState<string>(myDoctors[0]?.id || '');
  const [paymentAmountEgp, setPaymentAmountEgp] = useState<string>('500');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer_direct'>('cash');
  const [paymentNote, setPaymentNote] = useState<string>('تحصيل كاش أثناء الاستلام');
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);

  // Case Step Recording State
  const [selectedCaseForStep, setSelectedCaseForStep] = useState<string | null>(null);
  const [stepNameInput, setStepNameInput] = useState('بروفة الإطباق والمطابقة (Try-in)');
  const [stepNoteInput, setStepNoteInput] = useState('');

  // Doctor's patients
  const currentDoctorPatients = dentalStore.getPatientsForViewer(currentUser).filter(
    p => p.dentist_id === selectedDoctorId
  );

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionFeedback(null);

    let patientId = selectedPatientId;

    if (isCreatingNewPatient) {
      if (!newPatientName.trim()) {
        alert('يرجى إدخال اسم المريض الجديد');
        return;
      }
      const newP = dentalStore.createPatient(selectedDoctorId, newPatientName.trim(), 'مريض جديد مسجل بواسطة المندوب');
      patientId = newP.id;
    }

    if (!patientId) {
      alert('يرجى اختيار مريض أو كتابة اسم مريض جديد');
      return;
    }

    dentalStore.repCreateCase({
      repId: currentUser.id,
      dentistId: selectedDoctorId,
      patientId: patientId,
      material: material,
      kind: kind,
      teethInfo: teethInfo,
      units: Number(units) || 1,
      initialStepName: initialStepName,
      note: notes,
    });

    setSubmissionFeedback(
      `تم تسجيل استلام الحالة بنجاح! تم إدراجها كـ [معلق] في قائمة انتظار إدارة المعمل، ولن تظهر للطبيب أو الحسابات قبل اعتماد الأدمن.`
    );
    setNotes('');
    setNewPatientName('');
    setIsCreatingNewPatient(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentFeedback(null);

    const amountMinor = poundsToMinor(Number(paymentAmountEgp) || 0);
    if (amountMinor <= 0) {
      alert('يرجى إدخال مبلغ صحيح بالجنيه');
      return;
    }

    dentalStore.repRecordPayment({
      repId: currentUser.id,
      dentistId: paymentDoctorId,
      amountMinor: amountMinor,
      method: paymentMethod,
      note: paymentNote,
    });

    setPaymentFeedback(
      `تم تسجيل السداد بقيمة ${paymentAmountEgp} ج.م بنجاح! السداد الآن [معلق] في انتظار مطابقة واعتماد الإدارة.`
    );
  };

  const handleAddStepToCase = (caseId: string) => {
    if (!stepNameInput.trim()) return;
    dentalStore.repRecordCaseStep({
      repId: currentUser.id,
      caseId: caseId,
      stepName: stepNameInput.trim(),
      note: stepNoteInput.trim(),
    });
    alert('تم إرسال الخطوة للإدارة كبند معلق للموافقة والتأكيد!');
    setSelectedCaseForStep(null);
    setStepNoteInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                بوابة المندوب الميداني
              </span>
              <span className="text-xs text-slate-400 font-mono">كود المندوب: {currentUser.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cairo']">
              مرحباً، {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentUser.geo_text}
            </p>
          </div>

          {/* Commission Metric Pill */}
          <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">العمولة المستحقة:</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {formatEgp(commissions.pendingMinor)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">إجمالي الأطباء:</span>
              <span className="text-lg font-bold text-white font-mono">
                {myDoctors.length} عيادات
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('new_case')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'new_case'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>استلام جديد (Intake)</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'payment'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>تسجيل سداد نقدي</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'cases'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>حالات خط السير ({myCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>أطبائي وعياداتي ({myDoctors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'commissions'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BadgePercent className="w-4 h-4" />
            <span>عمولاتي</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: NEW CASE INTAKE --- */}
      {activeTab === 'new_case' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-['Cairo']">
                نموذج استلام تركيبة جديدة من العيادة
              </h2>
              <p className="text-xs text-slate-500">
                قاعدة الأمان: كل حالة يسجلها المندوب تدخل بحالة [معلق] وتظهر للأدمن فقط للتأكيد والتسعير
              </p>
            </div>
          </div>

          {submissionFeedback && (
            <div className="p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">تم التسجيل بنجاح:</p>
                <p className="mt-1 leading-relaxed">{submissionFeedback}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateCase} className="space-y-5">
            {/* 1. Doctor Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الطبيب / العيادة
              </label>
              <select
                value={selectedDoctorId}
                onChange={e => {
                  setSelectedDoctorId(e.target.value);
                  setSelectedPatientId('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                required
              >
                {myDoctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.geo_text}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Patient Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  المريض
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewPatient(!isCreatingNewPatient)}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold"
                >
                  {isCreatingNewPatient ? 'اختر من المرضى الحاليين' : '+ تسجيل مريض جديد لهذه العيادة'}
                </button>
              </div>

              {isCreatingNewPatient ? (
                <input
                  type="text"
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="اكتب اسم المريض ثلاثي..."
                  className="w-full px-4 py-3 rounded-xl border border-amber-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                >
                  <option value="">-- اختر المريض من سجل العيادة --</option>
                  {currentDoctorPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Material & Kind */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  خامة التصنيع (Material)
                </label>
                <select
                  value={material}
                  onChange={e => setMaterial(e.target.value as MaterialType)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold"
                >
                  <option value="E-Max">E-Max (Lithium Disilicate)</option>
                  <option value="Zirconia">Zirconia (Multi-layer)</option>
                  <option value="PFM">PFM (Porcelain Fused to Metal)</option>
                  <option value="Titanium">Titanium Custom Abutment</option>
                  <option value="PEEK">PEEK Framework</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع التركيبة (Restoration Kind)
                </label>
                <select
                  value={kind}
                  onChange={e => setKind(e.target.value as RestorationKind)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold"
                >
                  <option value="Crown">Crown (تاج مفرد)</option>
                  <option value="Bridge">Bridge (جسر)</option>
                  <option value="Endo-Crown">Endo-Crown</option>
                  <option value="Onlay">Onlay</option>
                  <option value="Inlay">Inlay</option>
                  <option value="Overlay">Overlay</option>
                  <option value="Implant Abutment">دعامة زراعة (Custom Abutment)</option>
                </select>
              </div>
            </div>

            {/* 4. Teeth Info & Units */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  أرقام الأسنان (Teeth Chart)
                </label>
                <input
                  type="text"
                  value={teethInfo}
                  onChange={e => setTeethInfo(e.target.value)}
                  placeholder="مثال: 14 أو 14, 15, 16"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عدد الوحدات (Units)
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={units}
                  onChange={e => setUnits(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-center focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>
            </div>

            {/* 5. Initial Step Received */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المرحلة المستلمة اليوم بالعيادة
              </label>
              <select
                value={initialStepName}
                onChange={e => setInitialStepName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="استلام الطبعة السيليكونية وتأكيد المقاس">استلام الطبعة السيليكونية وتأكيد المقاس</option>
                <option value="استلام القالب والبروفة الشمعية (Wax-up)">استلام القالب والبروفة الشمعية (Wax-up)</option>
                <option value="بروفة التركيبة في الفم (Try-in)">بروفة التركيبة في الفم (Try-in)</option>
                <option value="طلب تعديل تدرج لوني أو إعادة تلوين">طلب تعديل تدرج لوني أو إعادة تلوين</option>
              </select>
            </div>

            {/* 6. Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات الطبيب والمندوب
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="درجة اللون المطلوبة (مثال: A2, Bleach OM3)، التوصيات الخاصة بالإطباق..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>حفظ الحالة وإرسالها للاعتماد والتسعير</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: RECORD PAYMENT --- */}
      {activeTab === 'payment' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-['Cairo']">
                تسجيل تحصيل مالي من الطبيب
              </h2>
              <p className="text-xs text-slate-500">
                يدخل القيد كـ [معلق] ولا يؤثر على رصيد الطبيب قبل اعتماد إدارة المعمل
              </p>
            </div>
          </div>

          {paymentFeedback && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">تم إرسال السداد بنجاح:</p>
                <p className="mt-1 leading-relaxed">{paymentFeedback}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الطبيب المُسدِّد
              </label>
              <select
                value={paymentDoctorId}
                onChange={e => setPaymentDoctorId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold"
                required
              >
                {myDoctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.geo_text})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المبلغ المسدد (بالجنيه المصري)
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={paymentAmountEgp}
                onChange={e => setPaymentAmountEgp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold font-mono text-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                طريقة الاستلام
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  نقدًا (كاش مع المندوب)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer_direct')}
                  className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'transfer_direct'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  تحويل مباشر / محفظة
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البيان / ملاحظات الإيصال
              </label>
              <input
                type="text"
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
                placeholder="مثال: دفعة مقدمة لحالة فلان أو سداد كاش بالعيادة"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md mt-2 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>إرسال قيد التحصيل للإدارة</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: ROUTE CASES --- */}
      {activeTab === 'cases' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">حالات خط السير الميداني</h3>
            <span className="text-xs text-slate-500">الحالات الخاصة بأطبائك المعتمدين فقط</span>
          </div>

          <div className="space-y-4">
            {myCases.map(c => (
              <div key={c.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {c.case_code}
                    </span>
                    <span className="text-sm font-black text-slate-900 font-['Cairo']">
                      المريض: {c.patient_name} (عيادة {c.dentist_name})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {c.material} {c.kind} ({c.teeth_info})
                    </span>
                    {c.status === 'pending_lab' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        معلق
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    <span>تاريخ التسليم المتوقع: </span>
                    <strong className="text-slate-800">{formatArabicDate(c.due_date)}</strong>
                  </div>

                  <button
                    onClick={() => setSelectedCaseForStep(selectedCaseForStep === c.id ? null : c.id)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                  >
                    + تسجيل حركة جديدة (طبعة / بروفة)
                  </button>
                </div>

                {/* Add Step Inline Box */}
                {selectedCaseForStep === c.id && (
                  <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3 animate-in fade-in">
                    <h5 className="text-xs font-bold text-blue-900">تسجيل خطوة جديدة للحالة {c.case_code}:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={stepNameInput}
                        onChange={e => setStepNameInput(e.target.value)}
                        placeholder="اسم الخطوة (طبعة ثانية، بروفة شمع...)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        value={stepNoteInput}
                        onChange={e => setStepNoteInput(e.target.value)}
                        placeholder="ملاحظات المندوب..."
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => handleAddStepToCase(c.id)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                    >
                      حفظ الخطوة كمعلق للأدمن
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: MY DOCTORS --- */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myDoctors.map(doc => {
              const docCases = myCases.filter(c => c.dentist_id === doc.id);
              const docBalance = dentalStore.calculateDentistBalance(doc.id);
              return (
                <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 font-['Cairo']">{doc.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.geo_text}</p>
                      <p className="text-xs text-slate-600 font-mono mt-1">هاتف: {doc.phone}</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      {doc.code}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">الحالات النشطة:</span>
                      <strong className="text-slate-900">{docCases.length} حالات</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">رصيد المتبقي للمعمل:</span>
                      <strong className="text-red-700 font-mono">{formatEgp(docBalance.balanceDueMinor)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 5: MY COMMISSIONS --- */}
      {activeTab === 'commissions' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-['Cairo']">
                كشف عمولات المندوب الميداني
              </h2>
              <p className="text-xs text-slate-500">
                حساب العمولات فوري وديناميكي عن كل حالة معتمدة ومسلمة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">إجمالي العمولات المستحقة:</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                {formatEgp(commissions.totalEarnedMinor)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block">العمولات المصروفة:</span>
              <span className="text-lg font-black text-emerald-800 font-mono mt-1 block">
                {formatEgp(commissions.totalPaidMinor)}
              </span>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[11px] text-amber-800 block">الرصيد المتاح للصرف:</span>
              <span className="text-lg font-black text-amber-900 font-mono mt-1 block">
                {formatEgp(commissions.pendingMinor)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
