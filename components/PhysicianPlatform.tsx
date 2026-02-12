import React, { useState } from 'react';
import { Patient, PatientStatus, TriageLevel, PathwayStep } from '../types';
import { PatientCard } from './PatientCard';
import { getPatientSummary } from '../geminiService';
import { Search, AlertTriangle, CheckCircle, Stethoscope, MessageSquare, BookOpen, Loader2, Sparkles, Activity, Heart, Wind, Thermometer, Building, ArrowDownCircle, Calendar, X, Check, FlaskConical, Scan, Lock, ChevronLeft } from 'lucide-react';

interface PhysicianPlatformProps {
  queue: Patient[];
  onUpdatePatient: (id: string, updates: Partial<Patient>) => void;
}

export const PhysicianPlatform: React.FC<PhysicianPlatformProps> = ({ queue, onUpdatePatient }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [examNotes, setExamNotes] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpStep, setFollowUpStep] = useState<'ASK_IF_NEEDED' | 'ASK_DAYS'>('ASK_IF_NEEDED');
  const [followUpDays, setFollowUpDays] = useState<number>(7);

  const selectedPatient = queue.find(p => p.id === selectedPatientId);

  const handleTransferToER = () => {
    if (!selectedPatient || !examNotes.trim()) return;
    
    const erStep: PathwayStep = {
      status: PatientStatus.ER_QUEUE,
      description: `Escalated to ER by Physician. Reason: ${examNotes}`,
      timestamp: Date.now(),
      actor: 'Attending Physician'
    };

    onUpdatePatient(selectedPatient.id, {
      status: PatientStatus.ER_QUEUE,
      referralSource: 'PHYSICIAN',
      physicianNotes: examNotes,
      triageLevel: TriageLevel.RED,
      pathway: [...(selectedPatient.pathway || []), erStep]
    });
    setSelectedPatientId(null);
    setExamNotes('');
  };

  const handleAdmit = () => {
    if (!selectedPatient) return;
    
    const admitStep: PathwayStep = {
      status: PatientStatus.ADMITTED,
      description: `Patient admitted to hospital ward. Notes: ${examNotes}`,
      timestamp: Date.now(),
      actor: 'Attending Physician'
    };

    onUpdatePatient(selectedPatient.id, {
      status: PatientStatus.ADMITTED,
      physicianNotes: examNotes,
      pathway: [...(selectedPatient.pathway || []), admitStep]
    });
    setSelectedPatientId(null);
    setExamNotes('');
  };

  const initiateDischarge = () => {
    if (!selectedPatient) return;
    setFollowUpStep('ASK_IF_NEEDED');
    setShowFollowUpModal(true);
  };

  const handleFollowUpChoice = (needed: boolean) => {
    if (needed) {
      setFollowUpStep('ASK_DAYS');
    } else {
      finalizeDischarge(false);
    }
  };

  const finalizeDischarge = (needsFollowUp: boolean) => {
    if (!selectedPatient) return;

    const description = needsFollowUp 
      ? `Patient discharged home. Follow-up scheduled in ${followUpDays} days. Instructions: ${examNotes}`
      : `Patient discharged home. No follow-up required. Instructions: ${examNotes}`;

    const dischargeStep: PathwayStep = {
      status: PatientStatus.DISCHARGED,
      description,
      timestamp: Date.now(),
      actor: 'Attending Physician'
    };

    onUpdatePatient(selectedPatient.id, {
      status: PatientStatus.DISCHARGED,
      physicianNotes: examNotes,
      followUpVisit: needsFollowUp,
      followUpDays: needsFollowUp ? followUpDays : undefined,
      followUpSetAt: needsFollowUp ? Date.now() : undefined,
      pathway: [...(selectedPatient.pathway || []), dischargeStep]
    });

    setSelectedPatientId(null);
    setExamNotes('');
    setShowFollowUpModal(false);
  };

  const generateSummary = async () => {
    if (!selectedPatient) return;
    setIsSummarizing(true);
    try {
      const summary = await getPatientSummary(selectedPatient);
      onUpdatePatient(selectedPatient.id, { aiSummary: summary });
    } finally {
      setIsSummarizing(false);
    }
  };

  const getVitalIcon = (key: string) => {
    switch (key) {
      case 'bp': return <Activity size={18} />;
      case 'hr': return <Heart size={18} />;
      case 'temp': return <Thermometer size={18} />;
      case 'spo2': return <Wind size={18} />;
      default: return null;
    }
  };

  const getVitalUnit = (key: string) => {
    switch (key) {
      case 'bp': return 'mmHg';
      case 'hr': return 'bpm';
      case 'temp': return '°C';
      case 'spo2': return '%';
      default: return '';
    }
  };

  const getVitalLabel = (key: string) => {
    switch (key) {
      case 'bp': return 'Blood Pressure';
      case 'hr': return 'Heart Rate';
      case 'temp': return 'Temp';
      case 'spo2': return 'O2 Sat';
      default: return key;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[75vh] relative">
      {/* Follow-up Selection Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Calendar size={24} /></div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Discharge Protocol</h3>
                </div>
                <button onClick={() => setShowFollowUpModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
             </div>
             
             <div className="p-10 space-y-8">
                {followUpStep === 'ASK_IF_NEEDED' ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <p className="text-slate-600 font-bold text-lg leading-relaxed text-center">Is a follow-up clinic visit required for <strong>{selectedPatient?.name}</strong>?</p>
                    <div className="grid grid-cols-2 gap-6">
                      <button 
                        onClick={() => handleFollowUpChoice(false)}
                        className="group p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-slate-300 transition-all flex flex-col items-center text-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all"><X size={28} /></div>
                        <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">No Follow-up</span>
                      </button>

                      <button 
                        onClick={() => handleFollowUpChoice(true)}
                        className="group p-8 rounded-[2.5rem] bg-indigo-600 border-2 border-transparent hover:bg-indigo-700 transition-all flex flex-col items-center text-center shadow-xl shadow-indigo-100"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/20 shadow-sm flex items-center justify-center text-white mb-4"><Check size={28} /></div>
                        <span className="font-black text-white uppercase tracking-widest text-[10px]">Schedule Visit</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                       <button onClick={() => setFollowUpStep('ASK_IF_NEEDED')} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <ChevronLeft size={20} />
                       </button>
                       <p className="text-slate-600 font-bold text-lg leading-relaxed">After how many days should the patient return?</p>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {[2, 7, 14, 30].map(d => (
                        <button 
                          key={d}
                          onClick={() => setFollowUpDays(d)}
                          className={`h-16 rounded-2xl font-black text-sm transition-all border ${followUpDays === d ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>

                    <div className="pt-4 space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Custom Duration (Days)</label>
                      <input 
                        type="number" 
                        value={followUpDays} 
                        onChange={(e) => setFollowUpDays(parseInt(e.target.value) || 0)} 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-center text-slate-900 outline-none focus:border-indigo-400 text-xl"
                      />
                      <button 
                        onClick={() => finalizeDischarge(true)}
                        className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                      >
                        Confirm Follow-up & Discharge
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Queue</h2>
            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{queue.length} Active</div>
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Patient search..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {queue.map(p => (
              <PatientCard key={p.id} patient={p} active={selectedPatientId === p.id} onClick={(p) => setSelectedPatientId(p.id)} />
            ))}
            {queue.length === 0 && <div className="text-center py-20 text-slate-300 font-bold italic uppercase tracking-widest text-[10px]">No cases pending</div>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedPatient ? (
          <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.04)] border border-slate-50 overflow-hidden flex flex-col h-full">
            <div className="bg-blue-600 text-white p-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">{selectedPatient.name}</h2>
                  <p className="text-blue-100 text-sm font-bold opacity-80 uppercase tracking-widest">
                    {selectedPatient.age}Y • {selectedPatient.sex} 
                    {selectedPatient.sex === 'FEMALE' && ` • ${selectedPatient.isPregnant ? 'PREGNANT' : 'NON-PREGNANT'}`}
                  </p>
                </div>
                <div className="bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">Examination Phase</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-12">
                  <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em] border-l-2 border-indigo-200 pl-3">Full Story (AI Summary)</h3>
                      {!selectedPatient.aiSummary && !isSummarizing && (
                        <button onClick={generateSummary} className="flex items-center gap-2 text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100">
                          <Sparkles size={14} /> Generate Patient Narrative
                        </button>
                      )}
                    </div>
                    
                    {isSummarizing ? (
                      <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-3xl flex flex-col items-center justify-center text-indigo-400 gap-4">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-xs font-black uppercase tracking-widest">Synthesizing Clinical Narrative...</p>
                      </div>
                    ) : selectedPatient.aiSummary ? (
                      <div className="bg-indigo-600/5 border border-indigo-100 p-8 rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><BookOpen size={100} /></div>
                        <p className="text-slate-800 font-medium text-lg leading-relaxed italic relative z-10">
                          "{selectedPatient.aiSummary}"
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-[2rem] text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No clinical narrative generated yet.</p>
                      </div>
                    )}
                  </section>

                  {/* Ancillary Services (Locked) Section */}
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h3 className="text-slate-400 font-black uppercase text-[10px] mb-6 tracking-[0.3em] border-l-2 border-slate-200 pl-3">Ancillary Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button disabled className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-not-allowed opacity-60 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300"><FlaskConical size={24} /></div>
                          <div className="text-left">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Request Labs</p>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Biochemical Analysis (Locked)</p>
                          </div>
                        </div>
                        <Lock size={16} className="text-slate-300" />
                      </button>

                      <button disabled className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-not-allowed opacity-60 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300"><Scan size={24} /></div>
                          <div className="text-left">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Request Imaging</p>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Radiology / Ultrasound (Locked)</p>
                          </div>
                        </div>
                        <Lock size={16} className="text-slate-300" />
                      </button>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <section>
                      <h3 className="text-blue-600 font-black uppercase text-[10px] mb-4 tracking-[0.3em] border-l-2 border-blue-200 pl-3">Presentation</h3>
                      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
                        <p className="text-slate-800 font-bold text-lg leading-relaxed italic">"{selectedPatient.chiefComplaint}"</p>
                      </div>
                    </section>
                    <section>
                      <h3 className="text-blue-600 font-black uppercase text-[10px] mb-4 tracking-[0.3em] border-l-2 border-blue-200 pl-3">Clinical Background</h3>
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Medical History</p>
                          <p className="text-sm text-slate-700 font-bold">{selectedPatient.medicalHistory || 'None'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Family History</p>
                          <p className="text-sm text-slate-700 font-bold">{selectedPatient.familyHistory}</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  {selectedPatient.screeningQuestions && selectedPatient.screeningQuestions.length > 0 && (
                    <section>
                      <h3 className="text-blue-600 font-black uppercase text-[10px] mb-6 tracking-[0.3em] border-l-2 border-blue-200 pl-3">AI Screening Review</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {selectedPatient.screeningQuestions.map((qa, i) => (
                          <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <p className="text-indigo-600 font-black text-[10px] uppercase mb-2 tracking-widest">Question {i+1}</p>
                            <p className="text-slate-900 font-bold mb-3">{qa.question}</p>
                            <div className="flex gap-3 items-start bg-white p-4 rounded-xl border border-slate-50 shadow-inner">
                              <MessageSquare size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                              <p className="text-slate-600 text-sm font-medium italic">{qa.answer || 'No response recorded.'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-12">
                   <section>
                     <h3 className="text-indigo-600 font-black uppercase text-[10px] mb-6 tracking-[0.3em] border-l-2 border-indigo-200 pl-3">Patient Pathway</h3>
                     <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {selectedPatient.pathway?.map((step, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 z-10" />
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                               <p className="text-[10px] font-black text-indigo-600 uppercase mb-1 tracking-tighter">
                                 {new Date(step.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {step.actor}
                               </p>
                               <p className="text-xs font-bold text-slate-800 leading-relaxed">{step.description}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                   </section>

                   <section>
                      <h3 className="text-blue-600 font-black uppercase text-[10px] mb-4 tracking-[0.3em] border-l-2 border-blue-200 pl-3">Current Vitals</h3>
                      <div className="grid grid-cols-1 gap-4">
                          {Object.entries(selectedPatient.vitals).map(([k, v]) => (
                            <div key={k} className="bg-white border-2 border-slate-50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                              <div className="p-2 bg-slate-900 text-white rounded-xl">{getVitalIcon(k)}</div>
                              <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-slate-900">{v}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{getVitalUnit(k)}</span>
                                  </div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{getVitalLabel(k)}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                   </section>
                </div>
              </div>

              <section className="space-y-6 pt-12 border-t border-slate-100">
                 <div className="flex items-center justify-between">
                   <h3 className="text-slate-900 font-black text-xl tracking-tight">Diagnostic Assessment</h3>
                   <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-1 rounded">Mandatory for escalation</span>
                 </div>
                 <textarea rows={6} value={examNotes} onChange={(e) => setExamNotes(e.target.value)} placeholder="Enter clinical findings, differential diagnosis, and management directives..." className="w-full px-6 py-5 rounded-[2rem] border border-slate-100 focus:ring-4 focus:ring-blue-50 outline-none bg-slate-50 text-sm font-bold resize-none shadow-inner" />
              </section>
            </div>

            <div className="p-10 bg-slate-50 border-t flex flex-wrap gap-6 items-center justify-between">
               <div className="relative group">
                 <button 
                  onClick={handleTransferToER} 
                  disabled={!examNotes.trim()}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border shadow-sm ${
                    examNotes.trim() ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                  }`}
                 >
                   <AlertTriangle size={18} /> Escalate to ER
                 </button>
                 {!examNotes.trim() && (
                   <div className="absolute bottom-full left-0 mb-3 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <p className="flex items-center gap-2"><ArrowDownCircle size={10} /> Clinical reason required in notes for ER escalation.</p>
                   </div>
                 )}
               </div>
               
               <div className="flex gap-4">
                 <button onClick={() => setSelectedPatientId(null)} className="px-8 py-4 rounded-2xl bg-white text-slate-500 font-black uppercase text-xs tracking-widest border border-slate-200 hover:bg-slate-100 transition-all">Defer</button>
                 <button onClick={handleAdmit} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                   <Building size={18} /> Admit to Ward
                 </button>
                 <button onClick={initiateDischarge} className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                   <CheckCircle size={20} /> Finalize & Discharge
                 </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 h-full rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-6 p-20 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center animate-pulse shadow-inner"><Stethoscope size={48} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-400">Select Medical File</h3>
              <p className="max-w-xs text-sm font-bold uppercase tracking-widest opacity-60 mt-2">Initialize assessment for pending queue patient.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};