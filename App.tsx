import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Patient, PlatformType, PatientStatus, TriageLevel, User } from './types.ts';
import { RegistrationPlatform } from './components/RegistrationPlatform.tsx';
import { NursePlatform } from './components/NursePlatform.tsx';
import { PhysicianPlatform } from './components/PhysicianPlatform.tsx';
import { ERDoctorPlatform } from './components/ERDoctorPlatform.tsx';
import { HistoryPlatform } from './components/HistoryPlatform.tsx';
import { LiveFeedSidebar } from './components/LiveFeedSidebar.tsx';
import { AuthFlow } from './components/AuthFlow.tsx';
import { Activity, Stethoscope, HeartPulse, Hospital, LogOut, ShieldCheck, History as HistoryIcon, Lock, LayoutDashboard, ArrowRight, ArrowLeft, Zap, ShieldAlert, Cpu, Database, UserPlus } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<PlatformType | 'DASHBOARD'>('DASHBOARD');
  const [patients, setPatients] = useState<Patient[]>([]); 

  const physicianQueue = useMemo(() => {
    return patients
      .filter(p => p.status === PatientStatus.PHYSICIAN_QUEUE)
      .sort((a, b) => {
        // Rule 1: Intermediate (ORANGE) always appears before Stable (GREEN)
        if (a.triageLevel === TriageLevel.ORANGE && b.triageLevel === TriageLevel.GREEN) return -1;
        if (a.triageLevel === TriageLevel.GREEN && b.triageLevel === TriageLevel.ORANGE) return 1;

        // Rule 2: Priority ordering within Stable (GREEN) patients
        if (a.triageLevel === TriageLevel.GREEN && b.triageLevel === TriageLevel.GREEN) {
          // Priority 2a: Age >= 75 (Elderly)
          const aIsElderly = a.age >= 75;
          const bIsElderly = b.age >= 75;
          if (aIsElderly && !bIsElderly) return -1;
          if (!aIsElderly && bIsElderly) return 1;

          // Priority 2b: Pregnant females
          if (a.isPregnant && !b.isPregnant) return -1;
          if (!a.isPregnant && b.isPregnant) return 1;
        }

        // Rule 3: Tie-breaker / Default (FCFS) for Intermediate or equal-priority Stable
        return a.timestamp - b.timestamp;
      });
  }, [patients]);

  const erQueue = useMemo(() => {
    return patients
      .filter(p => p.status === PatientStatus.ER_QUEUE)
      .sort((a, b) => {
        if (a.triageLevel === TriageLevel.RED && b.triageLevel !== TriageLevel.RED) return -1;
        if (b.triageLevel === TriageLevel.RED && a.triageLevel !== TriageLevel.RED) return 1;
        return a.timestamp - b.timestamp;
      });
  }, [patients]);

  const addPatient = useCallback((newPatient: Patient) => {
    setPatients(prev => {
      // Check if patient already exists by ID (MRN)
      const existingIndex = prev.findIndex(p => p.id === newPatient.id);
      if (existingIndex !== -1) {
        // Update existing patient (Transitioning departments)
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newPatient };
        return updated;
      }
      // New patient registration
      return [...prev, newPatient];
    });
  }, []);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const handleLogout = () => {
    setUser(null);
    setAdminActiveTab('DASHBOARD'); 
  };

  if (!user) {
    return <AuthFlow onAuthenticate={setUser} />;
  }

  const isAdmin = user.role === 'ADMIN';
  const currentView = isAdmin ? adminActiveTab : user.role;

  const AdminDashboard = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.4em] mb-4 bg-indigo-50 w-fit px-4 py-2 rounded-full border border-indigo-100">
            <ShieldCheck size={14} /> Global Authorization Active
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tight">Hospital Command Center</h2>
          <p className="text-slate-500 font-medium text-xl mt-4 max-w-2xl">Monitor real-time patient flow and clinical departmental throughput across the enterprise.</p>
        </div>
        <div className="hidden lg:grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-slate-900">{patients.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Census</p>
           </div>
           <div className="bg-rose-600 p-6 rounded-[2rem] shadow-xl shadow-rose-100 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-white">{erQueue.length}</p>
              <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest mt-1">Active Reds</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { id: 'REGISTRATION', title: 'Admissions', desc: 'Manage patient identification and archives.', icon: <UserPlus size={32} />, color: 'violet', stats: patients.filter(p => p.status === PatientStatus.REGISTERED).length, label: 'New Arrivals' },
          { id: 'NURSE', title: 'Triage & Intake', desc: 'Clinical risk assessment and biometric screening.', icon: <Activity size={32} />, color: 'teal', stats: patients.length, label: 'In-Process' },
          { id: 'PHYSICIAN', title: 'Clinical Queue', desc: 'Attending level examination and disposition.', icon: <Stethoscope size={32} />, color: 'blue', stats: physicianQueue.length, label: 'Waiting for MD' },
          { id: 'ER', title: 'Critical Care', desc: 'Immediate interventions and stabilization.', icon: <HeartPulse size={32} />, color: 'rose', stats: erQueue.length, label: 'Emergent Cases' },
        ].map((dept) => (
          <button
            key={dept.id}
            onClick={() => setAdminActiveTab(dept.id as PlatformType)}
            className="group relative bg-white p-8 rounded-[3rem] text-left border-2 border-transparent hover:border-slate-200 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
              dept.color === 'violet' ? 'bg-violet-600 text-white shadow-violet-100' :
              dept.color === 'teal' ? 'bg-teal-600 text-white shadow-teal-100' :
              dept.color === 'blue' ? 'bg-blue-600 text-white shadow-blue-100' :
              'bg-rose-600 text-white shadow-rose-100'
            }`}>
              {dept.icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{dept.title}</h3>
            <p className="text-slate-500 font-medium text-xs leading-relaxed mb-8 h-8">{dept.desc}</p>
            
            <div className="flex items-end justify-between pt-6 border-t border-slate-50">
              <div>
                <p className={`text-3xl font-black ${
                  dept.color === 'violet' ? 'text-violet-600' :
                  dept.color === 'teal' ? 'text-teal-600' :
                  dept.color === 'blue' ? 'text-blue-600' :
                  'text-rose-600'
                }`}>{dept.stats}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dept.label}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                <ArrowRight size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <button
          onClick={() => setAdminActiveTab('HISTORY')}
          className="lg:col-span-8 bg-slate-900 p-10 rounded-[3rem] flex items-center justify-between group hover:bg-black transition-all shadow-2xl shadow-slate-200 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Database size={120} className="text-white" />
          </div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="bg-white/10 p-5 rounded-3xl text-white backdrop-blur-md">
              <HistoryIcon size={40} />
            </div>
            <div className="text-left">
              <h3 className="text-white text-3xl font-black tracking-tight mb-1">Clinical Archives</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Global Electronic Medical Record Audit</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-white font-black text-xs uppercase tracking-[0.3em] pr-4 animate-pulse relative z-10">
            Access Logs <ArrowRight size={24} />
          </div>
        </button>

        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Cpu size={14} className="text-indigo-500" /> System Telemetry
              </h4>
              <div className="flex gap-1">
                 <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
                 <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse delay-75" />
                 <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse delay-150" />
              </div>
           </div>
           <div className="flex-1 space-y-4">
              {[
                { label: 'AI Risk Engine', status: 'Online', val: '99.8%' },
                { label: 'Clinic Sync', status: 'Active', val: 'Low Lat' },
                { label: 'Archive Search', status: 'Ready', val: 'Indexed' }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                   <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{item.label}</span>
                   <span className="text-[9px] font-black text-teal-600 bg-white px-2 py-1 rounded-lg border border-teal-50">{item.val}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <header className="bg-white border-b flex-shrink-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <Hospital size={28} />
            </div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 leading-tight tracking-tighter">Vitalli</h1>
              <p className="text-[9px] text-slate-400 tracking-[0.3em] uppercase font-black">
                {isAdmin ? 'Global Master Console' : `${user.role} Terminal`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {isAdmin && adminActiveTab !== 'DASHBOARD' && (
              <button 
                onClick={() => setAdminActiveTab('DASHBOARD')}
                className="flex items-center gap-2 bg-slate-100 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                Exit to Dashboard
              </button>
            )}

            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-50">
                {isAdmin ? <ShieldCheck size={20} className="text-slate-800" /> : <Lock size={20} className="text-indigo-600" />}
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isAdmin ? 'Full Authorization' : `Staff Access: ${user.role}`}
                </p>
                <p className="text-sm font-black text-slate-900">{user.name}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 text-slate-400 hover:text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] transition-colors"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> Terminate Session
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {currentView === 'DASHBOARD' && <AdminDashboard />}
            <div className={currentView === 'DASHBOARD' ? 'hidden' : 'p-4 md:p-6 lg:p-10'}>
              {currentView === 'REGISTRATION' && <RegistrationPlatform onRegister={addPatient} patients={patients} />}
              {currentView === 'NURSE' && <NursePlatform onAddPatient={addPatient} patients={patients} />}
              {currentView === 'PHYSICIAN' && <PhysicianPlatform queue={physicianQueue} onUpdatePatient={updatePatient} />}
              {currentView === 'ER' && <ERDoctorPlatform queue={erQueue} onUpdatePatient={updatePatient} />}
              {currentView === 'HISTORY' && <HistoryPlatform patients={patients} />}
            </div>
          </div>
        </main>
        
        {currentView !== 'DASHBOARD' && <LiveFeedSidebar patients={patients} />}
      </div>

      <footer className="bg-white border-t p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-8 justify-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
           <div className="flex items-center gap-2 text-violet-600"><div className="w-2.5 h-2.5 rounded-full bg-violet-600 shadow-sm"></div> NEW: Registration</div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></div> RED: Emergency</div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div> ORANGE: Priority</div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-600 shadow-sm"></div> GREEN: Standard</div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[8px] border border-indigo-100">
             {isAdmin ? 'AI COMMAND OVERRIDE ACTIVE' : 'SECURE ISOLATED WORKSTATION'}
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;