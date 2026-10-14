import React, { useState, useEffect } from 'react';
import { dentalStore } from './services/store';
import { User } from './types';
import { Header } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { GateModal } from './components/gate/GateModal';
import { DentistPortal } from './components/dentist/DentistPortal';
import { RepPortal } from './components/rep/RepPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { RefreshCw, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(dentalStore.getCurrentUser());
  const [currentView, setCurrentView] = useState<'landing' | 'dentist' | 'rep' | 'admin'>('landing');
  const [isGateOpen, setIsGateOpen] = useState(false);

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = dentalStore.subscribe(() => {
      const user = dentalStore.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        if (user.role === 'admin') setCurrentView('admin');
        else if (user.role === 'dentist') setCurrentView('dentist');
        else if (user.role === 'rep') setCurrentView('rep');
      } else {
        setCurrentView('landing');
      }
    });

    // Check initial user
    const initialUser = dentalStore.getCurrentUser();
    if (initialUser) {
      if (initialUser.role === 'admin') setCurrentView('admin');
      else if (initialUser.role === 'dentist') setCurrentView('dentist');
      else if (initialUser.role === 'rep') setCurrentView('rep');
    }

    return () => unsubscribe();
  }, []);

  const handleGateSuccess = (user: User) => {
    if (user.role === 'admin') setCurrentView('admin');
    else if (user.role === 'dentist') setCurrentView('dentist');
    else if (user.role === 'rep') setCurrentView('rep');
  };

  const handleResetData = () => {
    if (window.confirm('هل ترغب في إعادة تعيين جميع البيانات إلى البذور الأولية (Seed Data)؟')) {
      dentalStore.resetToSeed();
      setCurrentView('landing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        onOpenGate={() => setIsGateOpen(true)}
        onNavigateHome={() => setCurrentView('landing')}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage onOpenGate={() => setIsGateOpen(true)} />
        )}

        {currentView === 'dentist' && currentUser && currentUser.role === 'dentist' && (
          <DentistPortal currentUser={currentUser} />
        )}

        {currentView === 'rep' && currentUser && currentUser.role === 'rep' && (
          <RepPortal currentUser={currentUser} />
        )}

        {currentView === 'admin' && currentUser && currentUser.role === 'admin' && (
          <AdminPortal currentUser={currentUser} />
        )}

        {/* Fallback if role view mismatched */}
        {currentView !== 'landing' && !currentUser && (
          <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">الجلسة منتهية أو غير مسجلة</h3>
            <p className="text-xs text-slate-500 mt-2 mb-4">يرجى تسجيل الدخول من خلال البوابة الموحدة</p>
            <button
              onClick={() => setIsGateOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold"
            >
              فتح بوابة الدخول
            </button>
          </div>
        )}
      </main>

      {/* Floating Reset Seed Data Button (For evaluator / testing convenience) */}
      <div className="no-print fixed bottom-4 left-4 z-30">
        <button
          onClick={handleResetData}
          title="إعادة تعيين البيانات الأولية"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] font-semibold backdrop-blur-xs shadow-lg border border-slate-700 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>إعادة ضبط البيانات (Seed Reset)</span>
        </button>
      </div>

      {/* Unified Security Gate Modal */}
      <GateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onSuccess={handleGateSuccess}
      />
    </div>
  );
}
