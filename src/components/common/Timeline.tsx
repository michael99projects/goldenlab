import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Case, CaseStep } from '../../types';
import { formatArabicDate, formatArabicDateTime, formatEgp, isCaseDelayed } from '../../lib/crypto';

interface TimelineProps {
  dentalCase: Case;
  totalPaidMinor?: number;
  balanceDueMinor?: number;
  isDentistView?: boolean;
}

export const CaseTimeline: React.FC<TimelineProps> = ({
  dentalCase,
  totalPaidMinor = 0,
  balanceDueMinor = 0,
  isDentistView = false,
}) => {
  const isDelayed = isCaseDelayed(dentalCase.due_date, dentalCase.status);

  // Status badge config
  const getStatusBadge = () => {
    if (isDelayed || dentalCase.status === 'delayed') {
      return {
        label: 'متأخرة عن موعد التسليم',
        classes: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300',
        icon: AlertTriangle,
      };
    }
    switch (dentalCase.status) {
      case 'pending_lab':
        return {
          label: 'منتظر تأكيد المعمل والتسعير',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'in_progress':
        return {
          label: 'جارية وقيد التصنيع الرقمي',
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Clock,
        };
      case 'ready_for_delivery':
        return {
          label: 'جاهزة ومجدولة للتسليم',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'delivered':
        return {
          label: 'تم التسليم للعيادة بنجاح',
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: ShieldCheck,
        };
      case 'cancelled':
        return {
          label: 'ملغاة',
          classes: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: AlertCircle,
        };
      default:
        return {
          label: dentalCase.status,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  // Filter steps: if dentist view and case is pending_lab without approval,
  // ensure pending unconfirmed steps are clearly marked or handled
  const steps = dentalCase.steps || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
              {dentalCase.case_code}
            </span>
            <span className="text-base sm:text-lg font-black font-['Cairo']">
              المريض: {dentalCase.patient_name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-300 mt-1">
            <span>الطبيب: <strong className="text-white">{dentalCase.dentist_name}</strong></span>
            <span>•</span>
            <span>الخامة: <strong className="text-amber-300">{dentalCase.material}</strong></span>
            <span>•</span>
            <span>النوع: <strong className="text-white">{dentalCase.kind}</strong></span>
            <span>•</span>
            <span>الأسنان: <strong className="text-white font-mono">{dentalCase.teeth_info}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.classes}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.label}</span>
          </div>
        </div>
      </div>

      {/* Delay alert banner if applicable */}
      {(isDelayed || dentalCase.status === 'delayed') && (
        <div className="p-3 bg-red-50 border-b border-red-200 flex items-start gap-2.5 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">تنبيه تأخير:</span> تجاوزت الحالة الموعد المحدد للتسليم.
            {dentalCase.delay_reason && (
              <p className="mt-0.5 font-medium text-red-700">
                السبب المسجل: {dentalCase.delay_reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delivery date info */}
      <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>الموعد المحدد للتسليم:</span>
          <strong className="text-slate-900 font-semibold">{formatArabicDate(dentalCase.due_date)}</strong>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-400" />
          <span>المندوب الميداني:</span>
          <strong className="text-slate-900 font-semibold">{dentalCase.rep_name}</strong>
        </div>
      </div>

      {/* Timeline Steps (Vertical colorful layout) */}
      <div className="p-5 sm:p-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          التايم لاين ومسار مراحل التصنيع (CAD/CAM Workflow)
        </h4>

        <div className="relative pr-4 sm:pr-6">
          {/* Connecting vertical background line */}
          <div className="absolute top-3 bottom-3 right-[18px] sm:right-[26px] w-0.5 bg-slate-200 -z-0" />

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const isConfirmed = step.status === 'confirmed';
              const isPending = step.status === 'pending';
              const isCurrent = !isConfirmed && idx === steps.findIndex(s => s.status !== 'confirmed');

              // Color configs
              let stepIcon = <Clock className="w-4 h-4 text-slate-400" />;
              let circleClass = 'bg-slate-100 border-slate-300 text-slate-400';
              let titleClass = 'text-slate-600 font-medium';
              let badgeText = '';
              let badgeClass = '';

              if (isConfirmed) {
                stepIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                circleClass = 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-4 ring-emerald-50';
                titleClass = 'text-slate-900 font-bold';
                badgeText = 'مكتملة ومؤكدة';
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else if (isPending) {
                stepIcon = <Clock className="w-4 h-4 text-amber-600 animate-pulse" />;
                circleClass = 'bg-amber-50 border-amber-500 text-amber-600 ring-4 ring-amber-50';
                titleClass = 'text-amber-900 font-bold';
                badgeText = 'معلقة بانتظار اعتماد الإدارة';
                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
              } else if (isCurrent) {
                stepIcon = <Clock className="w-4 h-4 text-blue-600" />;
                circleClass = 'bg-blue-50 border-blue-500 text-blue-600 ring-4 ring-blue-50';
                titleClass = 'text-blue-900 font-bold';
                badgeText = 'المرحلة الجارية الآن';
                badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
              }

              return (
                <div key={step.id || idx} className="relative flex items-start gap-4">
                  {/* Step status node */}
                  <div className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform ${circleClass}`}>
                    {stepIcon}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/60 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                          {idx + 1}
                        </span>
                        <h5 className={`text-sm ${titleClass}`}>
                          {step.name}
                        </h5>
                      </div>

                      {badgeText && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      )}
                    </div>

                    {step.note && (
                      <p className="text-xs text-slate-600 mt-2 bg-white/80 p-2 rounded-lg border border-slate-100 leading-relaxed">
                        {step.note}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      {step.occurred_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatArabicDateTime(step.occurred_at)}</span>
                        </div>
                      )}
                      {step.received_by_rep_name && (
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>المستلم: <strong className="text-slate-600">{step.received_by_rep_name}</strong></span>
                        </div>
                      )}
                      {step.confirmed_at && (
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          <span>معتمد من الإدارة</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Financial Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-amber-50/30 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-right">
          <div className="p-2 rounded-xl bg-white border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">تكلفة التركيبة الإجمالية:</span>
            <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
              {dentalCase.approved_at ? formatEgp(dentalCase.lab_price_minor) : 'قيد تحديد السعر من المعمل'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200/80">
            <span className="text-[11px] text-emerald-600 font-medium block">المبلغ المسدد المعتمد:</span>
            <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
              {formatEgp(totalPaidMinor)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200/80">
            <span className="text-[11px] text-red-600 font-medium block">المتبقي على الطبيب:</span>
            <span className="text-sm sm:text-base font-black text-red-700 font-mono">
              {formatEgp(balanceDueMinor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
