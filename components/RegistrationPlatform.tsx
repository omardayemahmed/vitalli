import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus, Sex, TriageLevel, PathwayStep, Specialty } from '../types';
import { UserPlus, Save, AlertCircle, CheckCircle2, Search, Smartphone, ShieldCheck, Mail, MapPin, Fingerprint, Ticket, Printer, ArrowRight, Database, Users, ChevronLeft, SearchCode, IdCard, Info, Clock, Link as LinkIcon, Calendar, AlertTriangle, ExternalLink, BellRing, PhoneOutgoing, Stethoscope, Activity, Baby, Smile, Lock } from 'lucide-react';

interface RegistrationPlatformProps {
  onRegister: (p: Patient) => void;
  patients: Patient[];
}

type RegistrationMode = 'GATEWAY' | 'NEW_PATIENT' | 'SEARCH_ARCHIVES' | 'VERIFY_EXISTING' | 'FOLLOW_UP_REGISTRY';

export const RegistrationPlatform: React.FC<RegistrationPlatformProps> = ({ onRegister, patients }) => {
  const [mode, setMode] = useState<RegistrationMode>('GATEWAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExisting, setSelectedExisting] = useState<Patient | null>(null);
  const [lastAssignedMRN, setLastAssignedMRN] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    email: '',
    address: '',
    age: '',
    sex: 'MALE' as Sex,
    specialty: 'INTERNAL_MEDICINE' as Specialty
  });
  const [lastAssignedQueue, setLastAssignedQueue] = useState<string | null>(null);

  const activeSession = useMemo(() => {
    if (!formData.nationalId || formData.nationalId.length < 14) return null;
    
    return patients.find(p => 
      p.nationalId === formData.nationalId && 
      p.status !== PatientStatus.DISCHARGED && 
      p.status !== PatientStatus.STABILIZED_HOME
    );
  }, [formData.nationalId, patients]);

  const followUpPatients = useMemo(() => {
    return patients.filter(p => p.followUpVisit === true).sort((a, b) => (b.followUpSetAt || 0) - (a.followUpSetAt || 0));
  }, [patients]);

  const isFormValid = () => {
    return (
      formData.name.trim().length > 0 &&
      formData.nationalId.trim().length === 14 &&
      formData.phone.trim().length > 7 &&
      formData.age !== '' &&
      !activeSession
    );
  };

  const filteredArchives = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    return patients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.nationalId.toLowerCase() === query ||
      p.nationalId.includes(query) ||
      p.id.toLowerCase() === query ||
      p.id.toLowerCase().includes(query) ||
      p.phone.includes(query)
    ).sort((a, b) => {
      if (a.nationalId.toLowerCase() === query || a.id.toLowerCase() === query) return -1;
      if (b.nationalId.toLowerCase() === query || b.id.toLowerCase() === query) return 1;
      return 0;
    }).slice(0, 5);
  }, [searchQuery, patients]);

  const handleSelectExisting = (p: Patient) => {
    setSelectedExisting(p);
    setFormData({
      name: p.name,
      nationalId: p.nationalId,
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      age: p.age.toString(),
      sex: p.sex,
      specialty: p.specialty || 'INTERNAL_MEDICINE'
    });
    setMode('VERIFY_EXISTING');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    const today = new Date().toDateString();
    const todayPatients = patients.filter(p => new Date(p.timestamp).toDateString() === today);
    const nextNum = (todayPatients.length + 1).toString().padStart(3, '0');
    const queueNumber = `Q-${nextNum}`;

    const patientId = selectedExisting?.id || `MRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newEntry: Patient = {
      id: patientId,
      name: formData.name,
      nationalId: formData.nationalId,
      phone: formData.phone,
      queueNumber: queueNumber,
      email: formData.email,
      address: formData.address,
      age: parseInt(formData.age),
      sex: formData.sex,
      specialty: formData.specialty,
      isPregnant: false,
      chiefComplaint: '',
      vitals: { bp: '', hr: '', temp: '', spo2: '' },
      triageLevel: null,
      status: PatientStatus.REGISTERED,
      timestamp: Date.now(),
      referralSource: 'REGISTRATION',
      pathway: [{
        status: PatientStatus.REGISTERED,
        description: `Patient registered for ${formData.specialty.replace('_', ' ')} and issued queue ticket.`,
        timestamp: Date.now(),
        actor: 'Registration Clerk'
      }]
    };

    onRegister(newEntry);
    setLastAssignedQueue(queueNumber);
    setLastAssignedMRN(patientId);
  };

  const resetFlow = () => {
    setLastAssignedQueue(null);
    setLastAssignedMRN(null);
    setMode('GATEWAY');
    setSelectedExisting(null);
    setSearchQuery('');
    setFormData({ name: '', nationalId: '', phone: '', email: '', address: '', age: '', sex: 'MALE', specialty: 'INTERNAL_MEDICINE' });
  };

  const specialties = [
    { id: 'INTERNAL_MEDICINE' as Specialty, label: 'Internal Medicine', icon: <Stethoscope size={24} />, locked: false },
    { id: 'SURGERY' as Specialty, label: 'Surgery', icon: <Activity size={24} />, locked: true },
    { id: 'OBS_GYN' as Specialty, label: 'Gynecology & Obstetrics', icon: <Baby size={24} />, locked: true },
    { id: 'PEDIATRICS' as Specialty, label: 'Pediatrics', icon: <Smile size={24} />, locked: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">Registration Portal</h2>
          <p className="text-slate-500 font-medium text-xl mt-4 italic">Front-Desk Admission Workflow</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-3xl flex items-center gap-4">
           <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100"><ShieldCheck size={20} /></div>
           <div>
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Master Archive Sync</p>
              <p className="text-xs font-bold text-slate-500">Live Connection Active</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          {lastAssignedQueue ? (
            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-500">
               <div className="p-12 text-center space-y-10">
                  <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={56} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">Admission Confirmed</h3>
                    <p className="text-slate-500 font-bold text-lg mt-2">Registration profile synchronized with triage station.</p>
                  </div>

                  <div className="max-w-xl mx-auto w-full">
                    <div className="relative p-12 bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden group text-left">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                          <Ticket size={240} className="text-white" />
                       </div>
                       
                       <div className="relative z-10 space-y-8">
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">Official Visit Voucher</p>
                            <h4 className="text-8xl font-black text-white tracking-tighter">{lastAssignedQueue}</h4>
                          </div>

                          <div className="h-px bg-white/10 w-full" />

                          <div className="grid grid-cols-2 gap-8">
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Medical Record Number</p>
                               <p className="text-2xl font-black text-indigo-400 tracking-tight">{lastAssignedMRN}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Admission Date</p>
                               <div className="flex items-center gap-2 text-white font-bold text-lg">
                                 <Calendar size={18} className="text-teal-400" />
                                 {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                               </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                             <div className="flex items-center gap-2 text-teal-400 font-black text-[9px] uppercase tracking-widest">
                                <Clock size={12} /> Priority: Standard
                             </div>
                             <div className="flex items-center gap-2 text-slate-500 font-black text-[9px] uppercase tracking-widest">
                                <IdCard size={12} /> ID: {formData.nationalId}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] text-indigo-900 font-bold text-sm max-w-xl mx-auto flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Users size={20} /></div>
                    <div className="text-left">
                      <p className="font-black text-indigo-950 mb-1">Permanent Record Link Established</p>
                      <p className="text-xs leading-relaxed opacity-80">This visit is now permanently logged under <strong>{lastAssignedMRN}</strong>. The patient should present this ticket at the triage station for immediate intake.</p>
                    </div>
                  </div>
               </div>

               <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-6">
                  <button onClick={() => window.print()} className="flex-1 py-6 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                     <Printer size={18} /> Print Admission Ticket
                  </button>
                  <button onClick={resetFlow} className="flex-1 py-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                     New Admission <ArrowRight size={18} />
                  </button>
               </div>
            </div>
          ) : mode === 'GATEWAY' ? (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <button onClick={() => setMode('NEW_PATIENT')} className="group relative p-16 rounded-[3.5rem] bg-white border-2 border-transparent hover:border-indigo-500 transition-all text-left shadow-xl hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><UserPlus size={160} /></div>
                     <div className="bg-indigo-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mb-10 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform"><UserPlus size={40} /></div>
                     <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">New Patient</h3>
                     <p className="text-slate-500 font-medium leading-relaxed">Create a unique Medical Record (MRN) tethered permanently to a Name and 14-digit National ID.</p>
                     <div className="mt-12 flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">Establish Identity <ArrowRight size={18} /></div>
                  </button>

                  <button onClick={() => setMode('SEARCH_ARCHIVES')} className="group relative p-16 rounded-[3.5rem] bg-slate-900 border-2 border-transparent hover:border-indigo-400 transition-all text-left shadow-xl hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Database size={160} className="text-white" /></div>
                     <div className="bg-white/10 text-white w-20 h-20 rounded-3xl flex items-center justify-center mb-10 shadow-lg backdrop-blur-md group-hover:scale-110 transition-transform"><SearchCode size={40} /></div>
                     <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Returning Patient</h3>
                     <p className="text-slate-400 font-medium leading-relaxed">Search archives using linked <strong>Name</strong>, <strong>National ID</strong>, or <strong>MRN</strong> for record retrieval.</p>
                     <div className="mt-12 flex items-center gap-3 text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">Retrieve Record <ArrowRight size={18} /></div>
                  </button>
               </div>
            </div>
          ) : mode === 'SEARCH_ARCHIVES' ? (
            <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-50 overflow-hidden animate-in slide-in-from-right-10 duration-500">
               <div className="p-12 space-y-10">
                  <div className="flex items-center justify-between">
                     <button onClick={() => setMode('GATEWAY')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                        <ChevronLeft size={16} /> Back to Gateway
                     </button>
                     <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> Global Registry Search
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="text-4xl font-black text-slate-900 tracking-tight">Archives Lookup</h3>
                     <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={28} />
                        <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Name, 14-Digit ID, or MRN..." className="w-full pl-16 pr-8 py-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-2xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-inner placeholder:text-slate-200" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     {filteredArchives.length > 0 ? (
                        filteredArchives.map(p => (
                           <button key={p.id} onClick={() => handleSelectExisting(p)} className="w-full p-8 rounded-3xl bg-white border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center justify-between group">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{p.name.charAt(0)}</div>
                                 <div>
                                    <div className="flex items-center gap-3">
                                       <p className="text-xl font-black text-slate-900">{p.name}</p>
                                       <div className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><LinkIcon size={10} /> Linked Profile</div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                       <span className="flex items-center gap-1 text-indigo-600 font-black">MRN: {p.id}</span>
                                       <span className="flex items-center gap-1 font-black text-slate-700">ID: {p.nationalId}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-50 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight size={24} /></div>
                           </button>
                        ))
                     ) : searchQuery ? (
                        <div className="py-20 text-center space-y-4">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><Search size={32} className="text-slate-200" /></div>
                           <p className="text-slate-400 font-bold italic text-lg">No record found with those identifiers.</p>
                           <button onClick={() => setMode('NEW_PATIENT')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100">Establish New Linkage</button>
                        </div>
                     ) : (
                        <div className="py-20 text-center text-slate-300 font-black text-xs uppercase tracking-[0.5em] opacity-40">Waiting for search query...</div>
                     )}
                  </div>
               </div>
            </div>
          ) : mode === 'FOLLOW_UP_REGISTRY' ? (
             <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-50 overflow-hidden animate-in slide-in-from-right-10 duration-500">
                <div className="p-12 space-y-10">
                   <div className="flex items-center justify-between">
                      <button onClick={() => setMode('GATEWAY')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                         <ChevronLeft size={16} /> Back to Gateway
                      </button>
                      <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                         <BellRing size={14} /> Follow-up Registry
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Return Reminders</h3>
                      <p className="text-slate-500 font-medium text-lg leading-relaxed italic">Monitoring patients scheduled for clinical return. High priority cases are flagged based on duration.</p>
                   </div>

                   <div className="space-y-6">
                      {followUpPatients.length > 0 ? (
                        followUpPatients.map(p => {
                          const returnDate = new Date((p.followUpSetAt || 0) + (p.followUpDays || 0) * 24 * 60 * 60 * 1000);
                          const isOverdue = returnDate < new Date();
                          
                          return (
                            <div key={p.id} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-indigo-500 transition-all">
                               <div className="flex items-center gap-6">
                                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-sm ${isOverdue ? 'bg-rose-600 text-white' : 'bg-white text-indigo-600'}`}>
                                     {p.name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-xl font-black text-slate-900">{p.name}</p>
                                     <div className="flex gap-4 mt-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone size={12} /> {p.phone}</p>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Returns in {p.followUpDays} Days</p>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     <p className={`text-xs font-black uppercase tracking-widest ${isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                                        {isOverdue ? 'Overdue' : 'Scheduled Return'}
                                     </p>
                                     <p className="text-sm font-bold text-slate-900">{returnDate.toLocaleDateString()}</p>
                                  </div>
                                  <button className="p-4 bg-white rounded-2xl text-indigo-600 border border-slate-100 shadow-sm hover:bg-slate-900 hover:text-white transition-all">
                                     <PhoneOutgoing size={20} />
                                  </button>
                               </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-32 text-center text-slate-200 space-y-4">
                           <BellRing size={64} className="mx-auto opacity-20" />
                           <p className="text-2xl font-black italic tracking-tight">Registry Idle</p>
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-60">No follow-up visits currently tracked.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          ) : (
            <form onSubmit={handleRegister} className="bg-white rounded-[3rem] shadow-xl border border-slate-50 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
              <div className="p-10 bg-slate-50 border-b flex items-center justify-between">
                 <button type="button" onClick={() => setMode(selectedExisting ? 'SEARCH_ARCHIVES' : 'GATEWAY')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                    <ChevronLeft size={16} /> {selectedExisting ? 'Back to Lookup' : 'Back to Gateway'}
                 </button>
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedExisting ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-teal-600 text-white border-teal-700'}`}>{selectedExisting ? 'Verified Existing Link' : 'Establishing New Linkage'}</span>
                 </div>
              </div>

              <div className="p-12 space-y-10">
                {activeSession && (
                  <div className="bg-orange-50 border-2 border-orange-200 p-8 rounded-[2.5rem] flex items-start gap-6 animate-in zoom-in-95 duration-500">
                    <div className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-100"><AlertTriangle size={32} /></div>
                    <div className="space-y-3">
                       <h4 className="text-xl font-black text-orange-950 tracking-tight">Active Hospital Ticket Detected</h4>
                       <p className="text-sm font-bold text-orange-800 leading-relaxed">
                         The patient <strong>{activeSession.name}</strong> currently has an active session in the <strong>{activeSession.status.replace('_', ' ')}</strong> department.
                       </p>
                       <p className="text-xs text-orange-700 font-medium opacity-80">A new ticket cannot be issued until the current visit is finalized and the patient is officially discharged.</p>
                       <div className="pt-4">
                          <button type="button" className="flex items-center gap-2 px-6 py-3 bg-white text-orange-700 border border-orange-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-orange-100 transition-all">
                             <ExternalLink size={14} /> Open Active Medical File
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Full Legal Name <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Legal name for archival linkage" className={`w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none ${activeSession ? 'opacity-50' : ''}`} disabled={!!activeSession} />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">National ID (Exactly 14 Digits) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input type="text" inputMode="numeric" required value={formData.nationalId} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 14); setFormData({...formData, nationalId: val}); }} placeholder="00000000000000" className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none tracking-widest" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Primary Contact Number <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+00 (000) 000-0000" className={`w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none ${activeSession ? 'opacity-50' : ''}`} disabled={!!activeSession} />
                    </div>
                  </div>

                  <div>
                     <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Age <span className="text-rose-500">*</span></label>
                    <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="0" className={`w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none ${activeSession ? 'opacity-50' : ''}`} disabled={!!activeSession} />
                  </div>

                  <div>
                     <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Biological Sex <span className="text-rose-500">*</span></label>
                    <div className={`flex bg-slate-50 p-1.5 rounded-3xl border border-slate-100 ${activeSession ? 'opacity-50 pointer-events-none' : ''}`}>
                      <button type="button" onClick={() => setFormData({...formData, sex: 'MALE'})} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${formData.sex === 'MALE' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>MALE</button>
                      <button type="button" onClick={() => setFormData({...formData, sex: 'FEMALE'})} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${formData.sex === 'FEMALE' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>FEMALE</button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Target Specialty <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {specialties.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={s.locked || !!activeSession}
                          onClick={() => !s.locked && setFormData({...formData, specialty: s.id})}
                          className={`relative p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 group ${
                            s.locked ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' :
                            formData.specialty === s.id ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-100' :
                            'bg-white border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          {/* Locked Overlay Indicator */}
                          {s.locked && (
                             <div className="absolute top-3 right-3 bg-slate-200 p-1.5 rounded-lg text-slate-500">
                                <Lock size={14} />
                             </div>
                          )}

                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            formData.specialty === s.id && !s.locked ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {s.icon}
                          </div>
                          <div>
                            <p className={`font-black uppercase tracking-tight text-sm ${
                              formData.specialty === s.id && !s.locked ? 'text-white' : 'text-slate-900'
                            }`}>{s.label}</p>
                            {s.locked && (
                              <div className="flex flex-col gap-0.5 mt-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available in Full Version</span>
                                </div>
                              </div>
                            )}
                          </div>
                          {formData.specialty === s.id && !s.locked && (
                             <div className="absolute top-4 right-4"><CheckCircle2 size={18} className="text-white" /></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {!activeSession && (
                  <div className="bg-indigo-50 rounded-[2rem] p-8 flex items-center gap-6 border border-indigo-100">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600"><LinkIcon size={32} /></div>
                    <div>
                        <p className="text-sm font-black text-indigo-900 mb-1 tracking-tight">System Linkage Protocol</p>
                        <p className="text-xs text-indigo-700 font-bold opacity-80 leading-relaxed">By finalizing this record, you are permanently tethering this <strong>Name</strong> and <strong>National ID</strong> to a unique <strong>Medical Record Number (MRN)</strong>.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-12 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-6">
                 <button 
                  type="submit"
                  disabled={!isFormValid()}
                  className={`w-full max-lg py-10 rounded-[2.5rem] font-black text-3xl transition-all flex items-center justify-center gap-6 ${
                    isFormValid() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-100 hover:-translate-y-2' : 
                    'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                 >
                   <Save size={36} />
                   {selectedExisting ? 'Verify & Link Admission' : 'Establish Link & Admit'}
                 </button>
                 {!isFormValid() && !activeSession && (
                   <p className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest"><AlertCircle size={14} /> Mandatory identifiers required for registration</p>
                 )}
                 {activeSession && (
                    <p className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest"><AlertTriangle size={14} /> New ticket issuance blocked: Patient currently in facility</p>
                 )}
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <button onClick={() => setMode('FOLLOW_UP_REGISTRY')} className="w-full group p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all text-left flex items-center justify-between">
              <div>
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <BellRing size={24} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Follow-up Registry</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Clinic Returns</p>
              </div>
              <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-inner">{followUpPatients.length}</div>
           </button>

           <div className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Users size={200} /></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4">Registry Flux</h3>
                <div className="flex items-baseline gap-2 mb-8">
                   <span className="text-6xl font-black">{patients.filter(p => new Date(p.timestamp).toDateString() === new Date().toDateString()).length}</span>
                   <span className="text-indigo-300 font-bold uppercase tracking-widest text-sm">Today</span>
                </div>
                <div className="space-y-4 pt-8 border-t border-white/10">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400"><span>Sync Engine</span><span className="text-teal-400">Linked</span></div>
                   <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-teal-400 h-full w-[94%] rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)]" /></div>
                </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Recent Archives Entry</h3>
              <div className="space-y-4">
                 {patients.filter(p => p.referralSource === 'REGISTRATION').slice(-5).reverse().map(p => (
                   <div key={p.id + p.timestamp} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-indigo-50 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 text-sm group-hover:text-indigo-900">{p.name}</p>
                          <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-black shadow-sm">{p.queueNumber}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">ID: {p.nationalId} • MRN: {p.id.split('-')[1]}</p>
                      </div>
                      <div className="text-right"><p className="text-[10px] font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-50 shadow-sm">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                   </div>
                 ))}
                 {patients.filter(p => p.referralSource === 'REGISTRATION').length === 0 && (
                   <div className="py-10 text-center"><Users size={32} className="mx-auto text-slate-100 mb-2" /><p className="text-slate-300 font-bold italic text-xs">Registry Awaiting Data</p></div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};