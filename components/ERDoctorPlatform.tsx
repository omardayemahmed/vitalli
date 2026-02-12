import React, { useState } from 'react';
import { Patient, PatientStatus, TriageLevel, PathwayStep } from '../types.ts';
import { PatientCard } from './PatientCard.tsx';
import { getPatientSummary } from '../geminiService.ts';
import { HeartPulse, Building, Home, RotateCcw, BookOpen, Loader2, Sparkles, Activity, Heart, Wind, Thermometer, ArrowDownCircle } from 'lucide-react';

interface ERDoctorPlatformProps {
  queue: Patient[];
  onUpdatePatient: (id: string, updates: Partial<Patient>) => void;
}

export const ERDoctorPlatform: React.FC<ERDoctorPlatformProps> = ({ queue, onUpdatePatient }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [erNotes, setErNotes] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const selectedPatient = queue.find(p => p.id === selectedId);

  const handleDisposition = (status: PatientStatus) => {
    if (!selectedPatient) return;
    
    // Check if returning to clinic without updates
    if (status === PatientStatus.PHYSICIAN_QUEUE && !erNotes.trim()) {
      return;
    }

    const description = status === PatientStatus.ADMITTED 
      ? `Patient hospitalized after stabilization. ER Notes: ${erNotes}`
      : status === PatientStatus.STABILIZED_HOME
      ? `Patient stabilized and discharged home. ER Notes: ${erNotes}`
      : `Patient returned to Physician queue for clinic follow-up. Stabilization updates: ${erNotes}`;

    const dispositionStep: PathwayStep = {
      status,
      description,
      timestamp: Date.now(),
      actor: 'ER Physician'
    };

    const updates: Partial<Patient> = {
      status,
      erNotes,
      timestamp: Date.now(),
      pathway: [...(selectedPatient.pathway || []), dispositionStep]
    };

    if (status === PatientStatus.PHYSICIAN_QUEUE) {
      updates.triageLevel = TriageLevel.ORANGE;
    }

    onUpdatePatient(selectedPatient.id, updates);
    setSelectedId(null);
    setErNotes('');
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
      case 'bp': return 'BP';
      case 'hr': return 'HR';
      case 'temp': return 'Temp';
      case 'spo2': return 'SpO2';
      default: return key;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[75vh]">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_15px_45px_rgba(0,0,0,0.04)] border border-slate-50 border-l-[10px] border-l-rose-600">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><HeartPulse size={24} /></div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Critical Arrivals</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Emergency Status</h3>
               <div className="flex justify-around items-center">
                  <div className="text-center">
                    <p className="text-4xl font-black text-rose-600">{queue.length}</p>
                    <p className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest">Pending Cases</p>
                  </div>
               </div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {queue.map(p => (
                <div key={p.id} className="relative group">
                  <PatientCard patient={p} active={selectedId === p.id} onClick={(p) => setSelectedId(p.id)} />
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${p.referralSource === 'PHYSICIAN' ? 'bg-orange-500' : 'bg-rose-600'} animate-pulse`} />
                </div>
              ))}
              {queue.length === 0 && <div className="text-center py-24 text-slate-300 font-bold italic uppercase tracking-widest text-[10px]">No active critical cases</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedPatient ? (
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.06)] border border-rose-50 flex flex-col h-full overflow-hidden">
             <div className="bg-rose-600 p-10 text-white relative">
                <div className="absolute top-6 right-8 bg-white/20 px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-lg border border-white/20">Emergent Red-Phase</div>
                <h2 className="text-4xl font-black tracking-tight mb-2">{selectedPatient.name}</h2>
                <div className="flex gap-6 items-center text-rose-100 text-sm font-bold opacity-90 tracking-widest uppercase">
                   <span>{selectedPatient.age} Years</span>
                   <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                   <span>{selectedPatient.sex}</span>
                   {selectedPatient.sex === 'FEMALE' && (
                     <>
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                        <span>{selectedPatient.isPregnant ? 'Pregnant' : 'Not Pregnant'}</span>
                     </>
                   )}
                   <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                   <span>Route: {selectedPatient.referralSource || 'Standard'}</span>
                </div>
             </div>

             <div className="flex-1 p-10 overflow-y-auto space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                   <div className="lg:col-span-8 space-y-12">
                      <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-rose-600 font-black uppercase text-[10px] tracking-[0.3em] border-l-2 border-rose-200 pl-3">Emergency Case Story (AI Narrative)</h3>
                          {!selectedPatient.aiSummary && !isSummarizing && (
                            <button onClick={generateSummary} className="flex items-center gap-2 text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-100">
                              <Sparkles size={14} /> Synthesize Case Story
                            </button>
                          )}
                        </div>
                        
                        {isSummarizing ? (
                          <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl flex flex-col items-center justify-center text-rose-400 gap-4">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-xs font-black uppercase tracking-widest">Synthesizing Critical Narrative...</p>
                          </div>
                        ) : selectedPatient.aiSummary ? (
                          <div className="bg-rose-600/5 border border-rose-100 p-8 rounded-[2rem] relative overflow-hidden group shadow-inner">
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

                      {selectedPatient.referralSource === 'PHYSICIAN' && (
                        <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl flex items-start gap-6 shadow-sm">
                          <div className="p-3 bg-amber-200 text-amber-700 rounded-2xl shadow-sm"><RotateCcw size={24} /></div>
                          <div>
                            <p className="font-black text-amber-900 text-[10px] uppercase mb-1 tracking-widest">Provider Escalation Summary</p>
                            <p className="text-amber-800 text-lg font-bold italic leading-relaxed">"{selectedPatient.physicianNotes || 'Unstable presentation during examination.'}"</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-8">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-rose-600 flex items-center gap-3 border-l-2 border-rose-100 pl-4">Acute Intervention</h3>
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Documentation of Stabilization</span>
                           <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-1 rounded">Required for Clinic Return</span>
                        </div>
                        <textarea rows={8} value={erNotes} onChange={(e) => setErNotes(e.target.value)} placeholder="Stabilization protocols, medications administered, and procedural notes..." className="w-full px-8 py-6 rounded-[2.5rem] border border-slate-100 focus:ring-4 focus:ring-rose-50 outline-none resize-none text-md font-bold bg-slate-50 shadow-inner" />
                      </div>
                   </div>

                   <div className="lg:col-span-4 space-y-12">
                      <section>
                         <h3 className="text-rose-600 font-black uppercase text-[10px] mb-6 tracking-[0.3em] border-l-2 border-rose-200 pl-3">Clinical Journey</h3>
                         <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {selectedPatient.pathway?.map((step, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-white border-4 border-rose-500 z-10" />
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                   <p className="text-[10px] font-black text-rose-600 uppercase mb-1 tracking-tighter">
                                     {new Date(step.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {step.actor}
                                   </p>
                                   <p className="text-xs font-bold text-slate-800 leading-relaxed">{step.description}</p>
                                </div>
                              </div>
                            ))}
                         </div>
                      </section>

                      <div className="space-y-8">
                          <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-rose-600 flex items-center gap-3 border-l-2 border-rose-100 pl-4">Biometrics</h3>
                          <div className="grid grid-cols-1 gap-4">
                            {Object.entries(selectedPatient.vitals).map(([k,v]) => (
                              <div key={k} className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-4 border border-slate-800 shadow-xl">
                                <div className="text-rose-500">{getVitalIcon(k)}</div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-black">{v}</span>
                                      <span className="text-[8px] font-bold text-slate-500 uppercase">{getVitalUnit(k)}</span>
                                    </div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{getVitalLabel(k)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>
                   </div>
                </div>

                <div className="pt-12 border-t border-slate-50">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="font-black text-slate-900 text-3xl tracking-tight">Final Disposition</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Critical Outcome Selection</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <button onClick={() => handleDisposition(PatientStatus.ADMITTED)} className="group p-8 rounded-[2.5rem] bg-rose-50 border-2 border-transparent hover:border-rose-500 transition-all text-left shadow-sm">
                         <div className="bg-rose-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform"><Building size={28} /></div>
                         <h4 className="font-black text-rose-900 uppercase tracking-widest text-sm mb-2">Hospitalize</h4>
                         <p className="text-xs text-rose-700 font-bold leading-relaxed">Immediate transfer to specialized inpatient ward or ICU.</p>
                      </button>
                      <button onClick={() => handleDisposition(PatientStatus.STABILIZED_HOME)} className="group p-8 rounded-[2.5rem] bg-teal-50 border-2 border-transparent hover:border-teal-500 transition-all text-left shadow-sm">
                         <div className="bg-teal-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform"><Home size={28} /></div>
                         <h4 className="font-black text-teal-900 uppercase tracking-widest text-sm mb-2">Discharge</h4>
                         <p className="text-xs text-teal-700 font-bold leading-relaxed">Stabilized for safe release with outpatient follow-up.</p>
                      </button>
                      <div className="relative group">
                        <button 
                          onClick={() => handleDisposition(PatientStatus.PHYSICIAN_QUEUE)} 
                          disabled={!erNotes.trim()}
                          className={`w-full h-full p-8 rounded-[2.5rem] border-2 transition-all text-left shadow-sm flex flex-col ${
                            erNotes.trim() ? 'bg-slate-50 border-transparent hover:border-blue-500' : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform ${erNotes.trim() ? 'bg-blue-600 text-white shadow-blue-200 group-hover:scale-110' : 'bg-slate-300 text-slate-500 shadow-none'}`}><RotateCcw size={28} /></div>
                          <h4 className={`font-black uppercase tracking-widest text-sm mb-2 ${erNotes.trim() ? 'text-slate-900' : 'text-slate-400'}`}>De-escalate</h4>
                          <p className={`text-xs font-bold leading-relaxed ${erNotes.trim() ? 'text-slate-700' : 'text-slate-400'}`}>Return to standard Physician queue for clinic management.</p>
                        </button>
                        {!erNotes.trim() && (
                          <div className="absolute bottom-full left-0 mb-3 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <p className="flex items-center gap-2"><ArrowDownCircle size={10} /> Stabilization updates required to return patient to clinic.</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-slate-50 h-full rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-6 p-20 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center animate-pulse shadow-inner"><HeartPulse size={48} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-400">Emergency Protocol Idle</h3>
              <p className="max-w-xs text-sm font-bold uppercase tracking-widest opacity-60 mt-2">Pick a critical arrival to initiate life-saving documentation.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};