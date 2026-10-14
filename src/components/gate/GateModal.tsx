import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { dentalStore } from '../../services/store';
import { User } from '../../types';

interface GateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const GateModal: React.FC<GateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !pin.trim()) {
      setError('يرجى كتابة كود الدخول والرمز السري (PIN).');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = dentalStore.gateLogin(code, pin);
      setIsLoading(false);

      if (result.success && result.user) {
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'بيانات الدخول غير صحيحة.');
      }
    }, 350);
  };

  const handleFillDemo = (demoCode: string, demoPin: string) => {
    setCode(demoCode);
    setPin(demoPin);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right">
        {/* Top Accent Gradient */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-['Cairo']">
                بوابة الدخول الموحدة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Golden Lab Security Gate • تشفير جلسة مباشر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            أهلاً بكم في منظومة معمل الأسنان. يُرجى إدخال الكود المخصص لك ورمز الـ PIN السري للانتقال التلقائي إلى لوحة عملك المخصصة.
          </p>

          {/* Unified Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="leading-relaxed font-semibold">{error}</div>
            </div>
          )}

          {/* Code Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كود الدخول المخصص (Code)
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="مثال: DEN-401 أو REP-101 أو ADM-991"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium tracking-wide placeholder:text-slate-400 uppercase transition-all"
                autoFocus
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                الرمز السري (PIN)
              </label>
              <span className="text-[10px] text-slate-400">4 أرقام سرية</span>
            </div>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-mono tracking-widest transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>يتم قفل الدخول تلقائياً لمدة 15 دقيقة بعد 5 محاولات خاطئة.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-bold text-sm shadow-md shadow-amber-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>تأكيد الهوية والدخول</span>
                <ArrowLeft className="w-4 h-4 text-amber-200" />
              </>
            )}
          </button>

          {/* Demo Helper Drawer Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoHelp(!showDemoHelp)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold py-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showDemoHelp ? 'إخفاء الحسابات التجريبية' : 'عرض أكواد الحسابات للتجربة السريعة'}</span>
            </button>

            {showDemoHelp && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
                <div 
                  onClick={() => handleFillDemo('ADM-991', '1472')}
                  className="p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">مدير النظام (الأدمن)</span>
                    <span className="text-[10px] text-slate-500">م. كريم محمود</span>
                  </div>
                  <span className="font-mono text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                    ADM-991 / 1472
                  </span>
                </div>

                <div 
                  onClick={() => handleFillDemo('DEN-401', '9632')}
                  className="p-2 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">طبيب أسنان (د. سامي عزيز)</span>
                    <span className="text-[10px] text-slate-500">مدينة نصر</span>
                  </div>
                  <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    DEN-401 / 9632
                  </span>
                </div>

                <div 
                  onClick={() => handleFillDemo('REP-101', '2580')}
                  className="p-2 rounded-lg bg-white border border-blue-200 hover:border-blue-400 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">مندوب المعمل (أحمد المندوب)</span>
                    <span className="text-[10px] text-slate-500">مصر الجديدة ومدينة نصر</span>
                  </div>
                  <span className="font-mono text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                    REP-101 / 2580
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
