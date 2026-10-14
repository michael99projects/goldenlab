import React, { useState } from 'react';
import { 
  Shield, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  KeyRound,
  ExternalLink,
  Layers
} from 'lucide-react';
import { User, Notification } from '../../types';
import { dentalStore } from '../../services/store';
import { formatArabicDateTime } from '../../lib/crypto';

interface HeaderProps {
  currentUser: User | null;
  onOpenGate: () => void;
  onNavigateHome: () => void;
  currentView: 'landing' | 'dentist' | 'rep' | 'admin';
  setCurrentView: (view: 'landing' | 'dentist' | 'rep' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenGate,
  onNavigateHome,
  currentView,
  setCurrentView,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const notifications: Notification[] = currentUser
    ? dentalStore.getNotificationsForViewer(currentUser)
    : [];
  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleSelectDemoUser = (code: string, pin: string) => {
    const res = dentalStore.gateLogin(code, pin);
    if (res.success && res.user) {
      if (res.user.role === 'admin') setCurrentView('admin');
      else if (res.user.role === 'dentist') setCurrentView('dentist');
      else if (res.user.role === 'rep') setCurrentView('rep');
      setShowDemoAccounts(false);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير النظام والمعمل', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'rep':
        return { label: 'مندوب معمل', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'dentist':
        return { label: 'طبيب أسنان', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 font-['Cairo']">
                  GOLDEN LAB
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                  معمل الأسنان
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                دقة التصنيع الرقمي CAD/CAM ومسار الحالات المباشر
              </p>
            </div>
          </div>

          {/* Center Navigation Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>حسابات تجريبية سريعة</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {currentUser && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      currentView === 'admin'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    لوحة الإدارة (الأدمن)
                  </button>
                )}
                {currentUser.role === 'rep' && (
                  <button
                    onClick={() => setCurrentView('rep')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      currentView === 'rep'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    بوابة المندوب
                  </button>
                )}
                {currentUser.role === 'dentist' && (
                  <button
                    onClick={() => setCurrentView('dentist')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      currentView === 'dentist'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    بوابة الطبيب
                  </button>
                )}
                <button
                  onClick={() => setCurrentView('landing')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    currentView === 'landing'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الرئيسية
                </button>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="الإشعارات"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifs && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-600" />
                          <h4 className="font-bold text-sm text-slate-800">الإشعارات والتحديثات</h4>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => dentalStore.markAllNotificationsAsRead(currentUser.id)}
                            className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                          >
                            تحديد الكل كمقروء
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            لا توجد إشعارات جديدة حالياً
                          </div>
                        ) : (
                          notifications.slice(0, 8).map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => dentalStore.markNotificationAsRead(n.id)}
                              className={`py-2.5 px-1 cursor-pointer transition-colors ${!n.read_at ? 'bg-amber-50/50 rounded-lg' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-800">{n.title}</span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {formatArabicDateTime(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info & Role Badge */}
                <div className="flex items-center gap-2.5 pl-2 border-r border-slate-200">
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${getRoleBadge(currentUser.role).color}`}>
                        {getRoleBadge(currentUser.role).label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      dentalStore.logout();
                      setCurrentView('landing');
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenGate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800 active:scale-95 transition-all"
              >
                <Shield className="w-4 h-4 text-amber-200" />
                <span>دخول الأطباء والمندوبين</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Demo Accounts Quick Drawer */}
      {showDemoAccounts && (
        <div className="bg-gradient-to-b from-amber-50 to-white border-b border-amber-200 p-4 transition-all">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">
                  تبديل الحساب التجريبي بنقرة واحدة (لاختبار المنظومة فوراً):
                </span>
              </div>
              <button
                onClick={() => setShowDemoAccounts(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Admin */}
              <div 
                onClick={() => handleSelectDemoUser('ADM-991', '1472')}
                className="p-3 rounded-xl bg-white border border-amber-300 hover:border-amber-500 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900">مدير النظام (الأدمن)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">ADM-991</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">م. كريم محمود</p>
                <div className="text-[10px] text-slate-400 mt-1">الرمز PIN: <span className="font-mono text-slate-700 font-bold">1472</span></div>
              </div>

              {/* Dentist 1 */}
              <div 
                onClick={() => handleSelectDemoUser('DEN-401', '9632')}
                className="p-3 rounded-xl bg-white border border-emerald-300 hover:border-emerald-500 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900">طبيب أسنان (1)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">DEN-401</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">د. سامي عزيز (مدينة نصر)</p>
                <div className="text-[10px] text-slate-400 mt-1">الرمز PIN: <span className="font-mono text-slate-700 font-bold">9632</span></div>
              </div>

              {/* Dentist 2 */}
              <div 
                onClick={() => handleSelectDemoUser('DEN-402', '8521')}
                className="p-3 rounded-xl bg-white border border-emerald-300 hover:border-emerald-500 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900">طبيبة أسنان (2)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">DEN-402</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">د. ندى المنشاوي (الكوربة)</p>
                <div className="text-[10px] text-slate-400 mt-1">الرمز PIN: <span className="font-mono text-slate-700 font-bold">8521</span></div>
              </div>

              {/* Rep 1 */}
              <div 
                onClick={() => handleSelectDemoUser('REP-101', '2580')}
                className="p-3 rounded-xl bg-white border border-blue-300 hover:border-blue-500 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900">مندوب المعمل (1)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">REP-101</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">أحمد المندوب (مدينة نصر)</p>
                <div className="text-[10px] text-slate-400 mt-1">الرمز PIN: <span className="font-mono text-slate-700 font-bold">2580</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
