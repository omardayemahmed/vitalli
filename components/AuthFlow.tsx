
import React, { useState } from 'react';
import { PlatformType, User } from '../types';
import { Activity, Stethoscope, HeartPulse, Hospital, ArrowRight, Mail, Lock, User as UserIcon, Loader2, ChevronLeft, Zap, UserPlus } from 'lucide-react';

interface AuthFlowProps {
  onAuthenticate: (user: User) => void;
}

type AuthStep = 'SELECT_PLATFORM' | 'SIGN_IN' | 'REGISTER';

export const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthenticate }) => {
  const [step, setStep] = useState<AuthStep>('SELECT_PLATFORM');
  const [selectedRole, setSelectedRole] = useState<PlatformType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const platforms = [
    {
      id: 'REGISTRATION' as PlatformType,
      title: 'Registration Portal',
      desc: 'Front desk identity capture. Primary entry point for new records.',
      icon: <UserPlus size={40} />,
      color: 'violet'
    },
    {
      id: 'NURSE' as PlatformType,
      title: 'Nursing Portal',
      desc: 'Clinical risk assessment and contextual triage screening.',
      icon: <Activity size={40} />,
      color: 'teal'
    },
    {
      id: 'PHYSICIAN' as PlatformType,
      title: 'Physician Portal',
      desc: 'Locked attending view. Isolated clinical examination queue.',
      icon: <Stethoscope size={40} />,
      color: 'blue'
    },
    {
      id: 'ER' as PlatformType,
      title: 'ER Critical Portal',
      desc: 'Exclusive emergency view. Strictly siloed critical care.',
      icon: <HeartPulse size={40} />,
      color: 'rose'
    }
  ];

  const handleRoleSelect = (role: PlatformType) => {
    setSelectedRole(role);
    setStep('SIGN_IN');
    setError(null);
  };

  const handleDemoAccess = () => {
    onAuthenticate({
      id: 'DEMO-USER',
      name: 'Demo Administrator',
      email: 'admin@vitalli.com',
      role: 'ADMIN' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 1200));

    if (formData.email === 'admin@vitalli.com' && formData.password === 'admin123') {
      onAuthenticate({
        id: 'ADMIN-MASTER',
        name: 'System Administrator',
        email: formData.email,
        role: 'ADMIN' 
      });
    } else {
      onAuthenticate({
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Clinical Staff',
        email: formData.email,
        role: selectedRole! 
      });
    }
    setIsLoading(false);
  };

  const getRoleTheme = () => {
    const p = platforms.find(pl => pl.id === selectedRole);
    return p?.color || 'indigo';
  };

  const theme = getRoleTheme();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="mb-12 flex flex-col items-center gap-4">
        <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-2xl shadow-indigo-100 transform rotate-3 hover:rotate-0 transition-transform">
          <Hospital size={48} />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Vitalli</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">Professional Hospital Operating System</p>
        </div>
      </div>

      {step === 'SELECT_PLATFORM' && (
        <div className="max-w-6xl w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] mb-12">Select Siloed Department Terminal</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full mb-16">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => handleRoleSelect(p.id)}
                className="group relative bg-white p-8 rounded-[3rem] text-left border-2 border-transparent hover:border-slate-200 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 shadow-lg ${
                  p.color === 'violet' ? 'bg-violet-600 text-white shadow-violet-100' :
                  p.color === 'teal' ? 'bg-teal-600 text-white shadow-teal-100' :
                  p.color === 'blue' ? 'bg-blue-600 text-white shadow-blue-100' :
                  'bg-rose-600 text-white shadow-rose-100'
                }`}>
                  {React.cloneElement(p.icon as React.ReactElement<any>, { size: 32 })}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{p.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 text-xs">{p.desc}</p>
                <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                  p.color === 'violet' ? 'text-violet-600' :
                  p.color === 'teal' ? 'text-teal-600' :
                  p.color === 'blue' ? 'text-blue-600' :
                  'text-rose-600'
                }`}>
                  Initialize Locked Session <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6 pt-12 border-t-2 border-dashed border-slate-200 w-full max-w-xl text-center">
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6">Internal Development Oversight</p>
              <button 
                onClick={handleDemoAccess}
                className="group relative flex items-center gap-4 bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] font-black text-xl transition-all hover:bg-black hover:shadow-2xl hover:shadow-slate-300 hover:-translate-y-1"
              >
                <Zap className="text-yellow-400 group-hover:animate-pulse" size={24} />
                Launch Demo Version (Multi-Platform)
                <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full shadow-lg">ADMIN OVERRIDE</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {(step === 'SIGN_IN' || step === 'REGISTER') && (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-500">
          <button 
            onClick={() => setStep('SELECT_PLATFORM')}
            className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Gateways
          </button>
          
          <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-50">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {step === 'SIGN_IN' ? 'Portal Access' : 'Staff Registration'}
              </h2>
              <p className="text-slate-400 font-bold text-sm mt-2">
                Locked {selectedRole?.toLowerCase()} workstation entry
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 'REGISTER' && (
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><UserIcon size={20} /></div>
                  <input 
                    required
                    type="text" 
                    placeholder="Full Clinical Name" 
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-slate-100 outline-none transition-all font-bold text-slate-900"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              )}
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><Mail size={20} /></div>
                <input 
                  required
                  type="email" 
                  placeholder="Clinical ID (Email)" 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-slate-100 outline-none transition-all font-bold text-slate-900"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><Lock size={20} /></div>
                <input 
                  required
                  type="password" 
                  placeholder="Security Key" 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-slate-100 outline-none transition-all font-bold text-slate-900"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-6 rounded-2xl font-black text-xl text-white shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 ${
                  theme === 'violet' ? 'bg-violet-600 shadow-violet-100 hover:bg-violet-700' :
                  theme === 'teal' ? 'bg-teal-600 shadow-teal-100 hover:bg-teal-700' :
                  theme === 'blue' ? 'bg-blue-600 shadow-blue-100 hover:bg-blue-700' :
                  'bg-rose-600 shadow-rose-100 hover:bg-rose-700'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : (step === 'SIGN_IN' ? 'Authorize Portal' : 'Register for Portal')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
