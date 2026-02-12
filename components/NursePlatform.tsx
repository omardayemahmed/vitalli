import React, { useState, useMemo, useEffect } from 'react';
import { Patient, PatientStatus, TriageLevel, Vitals, Sex, PathwayStep } from '../types.ts';
import { getAITriage, getScreeningQuestions } from '../geminiService.ts';
import { User, ClipboardList, Thermometer, BrainCircuit, CheckCircle2, Loader2, History, AlertCircle, Baby, Search, XCircle, PlusCircle, MessageSquareText, Activity, Heart, Wind, UserPlus, Database, ArrowRight, Fingerprint, Ticket, Scan, Stethoscope, HeartPulse, Building, Home, Pill, Users } from 'lucide-react';
import { TRIAGE_LABELS } from '../constants.tsx';

interface NursePlatformProps {
  onAddPatient: (p: Patient) => void;
  patients: Patient[];
}

type IntakeState = 'QUEUE_ENTRY' | 'INTAKE' | 'TRIAGE_RESULT' | 'SCREENING' | 'FINAL';

export const NursePlatform: React.FC<NursePlatformProps> = ({ onAddPatient, patients }) => {
  const [currentView, setCurrentView] = useState<IntakeState>('QUEUE_ENTRY');
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [queueInput, setQueueInput] = useState('');
  const [error, setError] = useState<{ message: string; type: 'NOT_FOUND' | 'ALREADY_PROCESSED' } | null>(null);
  const [processedInfo, setProcessedInfo] = useState<{ name: string; status: PatientStatus } | null>(null);
  
  const [formData, setFormData] = useState<Partial<Patient>>({
    id: undefined,
    name: '',
    age: undefined,
    sex: undefined,
    isPregnant: undefined, 
    nationalId: '',
    phone: '',
    queueNumber: '',
    medicalHistory: '',
    familyHistory: '',
    medications: '',
    surgeries: '',
    chiefComplaint: '',
    vitals: { bp: '', hr: '', temp: '', spo2: '' },
    pathway: []
  });

  const [aiTriage, setAiTriage] = useState<{ level: TriageLevel; justification: string } | null>(null);
  const [screening, setScreening] = useState<string[]>([]);
  const [screeningAnswers, setScreeningAnswers] = useState<string[]>(['', '', '', '', '']);

  const isScreeningValid = useMemo(() => {
    if (screening.length === 0) return false;
    return screeningAnswers.every(ans => ans.trim().length > 0);
  }, [screening, screeningAnswers]);

  const handleQueueSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setProcessedInfo(null);

    const input = queueInput.trim().toUpperCase();
    if (!input) return;

    const foundPatient = patients.find(p => {
      const pQueue = p.queueNumber?.toUpperCase() || "";
      if (pQueue === input) return true;
      
      const pDigits = pQueue.replace(/\D/g, ''); 
      const inputDigits = input.replace(/\D/g, '');
      
      if (pDigits && inputDigits && inputDigits.length > 0) {
        return parseInt(pDigits, 10) === parseInt(inputDigits, 10);
      }
      return false;
    });

    if (!foundPatient) {
      setError({ message: "No patient found with that ticket number in the system.", type: 'NOT_FOUND' });
      return;
    }

    if (foundPatient.status === PatientStatus.REGISTERED) {
      setFormData({
        ...formData,
        id: foundPatient.id,
        name: foundPatient.name,
        nationalId: foundPatient.nationalId,
        phone: foundPatient.phone,
        queueNumber: foundPatient.queueNumber,
        age: foundPatient.age,
        sex: foundPatient.sex,
        isPregnant: foundPatient.sex === 'FEMALE' ? undefined : false, 
        medicalHistory: foundPatient.medicalHistory || '',
        familyHistory: foundPatient.familyHistory || '',
        medications: foundPatient.medications || '',
        surgeries: foundPatient.surgeries || '',
        vitals: { bp: '', hr: '', temp: '', spo2: '' },
        chiefComplaint: '',
        pathway: foundPatient.pathway || []
      });
      setCurrentView('INTAKE');
      setStep(1);
    } else {
      setProcessedInfo({ name: foundPatient.name, status: foundPatient.status });
      setError({ 
        message: `Patient "${foundPatient.name}" (Ticket ${foundPatient.queueNumber}) has already been triaged.`, 
        type: 'ALREADY_PROCESSED' 
      });
    }
  };

  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData(prev => {
      const updates = { ...prev, [field]: value };
      if (field === 'sex' && value === 'MALE') {
        updates.isPregnant = false;
      }
      return updates;
    });
  };

  const handleVitalsChange = (field: keyof Vitals, value: string) => {
    let sanitized = value;
    if (field === 'temp') {
      sanitized = value.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) sanitized = parts[0] + '.' + parts.slice(1).join('');
    } else if (field !== 'bp') {
      sanitized = value.replace(/[^0-9]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      vitals: { ...(prev.vitals as Vitals), [field]: sanitized }
    }));
  };

  const isFormValid = () => {
    const { name, age, sex, chiefComplaint, vitals, isPregnant } = formData;
    const vitalsExist = vitals && vitals.bp && vitals.hr && vitals.temp && vitals.spo2;
    const ageValid = typeof age === 'number' && age > 0;
    const pregnancyChecked = sex === 'FEMALE' ? (isPregnant !== undefined && isPregnant !== null) : true;
    return !!(name && ageValid && sex && chiefComplaint && vitalsExist && pregnancyChecked);
  };

  const runAITriage = async () => {
    if (!isFormValid()) return;
    setLoading(true);
    const result = await getAITriage(formData.chiefComplaint || '', formData.vitals as Vitals);
    setAiTriage(result);
    setLoading(false);
    setCurrentView('TRIAGE_RESULT');
    setStep(2);
  };

  const runEnhancedScreening = async () => {
    setLoading(true);
    const questions = await getScreeningQuestions(
      formData.chiefComplaint || '', 
      formData.vitals as Vitals,
      formData.age || 0,
      formData.sex as Sex
    );
    setScreening(questions);
    setScreeningAnswers(new Array(questions.length).fill(''));
    setLoading(false);
    setCurrentView('SCREENING');
    setStep(3);
  };

  const finalizePatient = () => {
    const status = aiTriage?.level === TriageLevel.RED ? PatientStatus.ER_QUEUE : PatientStatus.PHYSICIAN_QUEUE;
    const triageStep: PathwayStep = {
      status: status,
      description: `Triage completed. Category: ${aiTriage?.level}. Complaint: ${formData.chiefComplaint}`,
      timestamp: Date.now(),
      actor: 'Triage Nurse'
    };

    const finalPatient: Patient = {
      ...formData as Patient,
      id: formData.id || `MRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      nationalId: formData.nationalId || 'PENDING',
      phone: formData.phone || 'PENDING',
      isPregnant: formData.isPregnant || false,
      triageLevel: aiTriage?.level || TriageLevel.GREEN,
      aiJustification: aiTriage?.justification,
      screeningQuestions: screening.map((q, i) => ({ question: q, answer: screeningAnswers[i] })),
      status: status,
      timestamp: Date.now(),
      referralSource: 'NURSE',
      pathway: [...(formData.pathway || []), triageStep]
    };

    onAddPatient(finalPatient);
    setCurrentView('QUEUE_ENTRY');
    setStep(1);
    setQueueInput('');
    setFormData({ 
      id: undefined,
      name: '', 
      age: undefined, 
      sex: undefined, 
      isPregnant: undefined, 
      nationalId: '', 
      phone: '', 
      queueNumber: '', 
      medicalHistory: '', 
      familyHistory: '', 
      medications: '', 
      surgeries: '', 
      chiefComplaint: '', 
      vitals: { bp: '', hr: '', temp: '', spo2: '' },
      pathway: []
    });
    setAiTriage(null);
    setScreening([]);
    setScreeningAnswers(['', '', '', '', '']);
  };

  const updateScreeningAnswer = (index: number, value: string) => {
    const newAnswers = [...screeningAnswers];
    newAnswers[index] = value;
    setScreeningAnswers(newAnswers);
  };

  const getStatusDisplay = (status: PatientStatus) => {
    switch (status) {
      case PatientStatus.PHYSICIAN_QUEUE: return { label: 'Physician Queue', icon: <Stethoscope size={16} />, color: 'text-blue-600 bg-blue-50' };
      case PatientStatus.ER_QUEUE: return { label: 'Emergency Room', icon: <HeartPulse size={16} />, color: 'text-rose-600 bg-rose-50' };
      case PatientStatus.ADMITTED: return { label: 'Admitted / Inpatient', icon: <Building size={16} />, color: 'text-indigo-600 bg-indigo-50' };
      case PatientStatus.DISCHARGED: 
      case PatientStatus.STABILIZED_HOME: return { label: 'Discharged', icon: <Home size={16} />, color: 'text-teal-600 bg-teal-50' };
      default: return { label: 'In Process', icon: <Activity size={16} />, color: 'text-slate-600 bg-slate-50' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {currentView !== 'QUEUE_ENTRY' && (
        <div className="flex justify-center items-center mb-10 gap-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all shadow-lg ${step >= s ? 'bg-teal-600 text-white shadow-teal-200' : 'bg-white text-slate-300 border border-slate-100'}`}>
                {s === 1 && <User size={20} />}
                {s === 2 && <BrainCircuit size={20} />}
                {s === 3 && <ClipboardList size={20} />}
                {s === 4 && <CheckCircle2 size={20} />}
              </div>
              {s < 4 && <div className={`w-20 h-1 mx-2 rounded-full ${step > s ? 'bg-teal-600' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-slate-50 overflow-hidden">
        {currentView === 'QUEUE_ENTRY' && (
          <div className="p-12 lg:p-24 space-y-16 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-8">
                <Ticket size={48} />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Active Triage Intake</h2>
              <p className="text-slate-500 font-medium text-xl leading-relaxed">Enter the assigned Queue Number from the registration ticket to initialize clinical triage.</p>
            </div>

            <form onSubmit={handleQueueSearch} className="max-w-xl mx-auto space-y-8">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors">
                  <Scan size={32} />
                </div>
                <input 
                  autoFocus
                  type="text" 
                  value={queueInput} 
                  onChange={(e) => {
                    setQueueInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 1 or Q-001" 
                  className="w-full pl-20 pr-8 py-10 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-4xl font-black text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-8 focus:ring-teal-50 outline-none transition-all shadow-inner tracking-tight placeholder:text-slate-200 placeholder:font-bold"
                />
              </div>

              {error && (
                <div className={`border p-6 rounded-3xl animate-in fade-in slide-in-from-top-2 ${error.type === 'ALREADY_PROCESSED' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                  <div className="flex items-start gap-4">
                    <AlertCircle size={24} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-black text-lg mb-2">{error.type === 'ALREADY_PROCESSED' ? 'Ticket Already Processed' : 'Ticket Not Found'}</p>
                      <p className="font-bold opacity-80">{error.message}</p>
                      {processedInfo && (
                        <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Location:</span>
                           <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${getStatusDisplay(processedInfo.status).color}`}>
                              {getStatusDisplay(processedInfo.status).icon}
                              {getStatusDisplay(processedInfo.status).label}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-8 bg-teal-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-teal-100 hover:bg-teal-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-4 group"
              >
                Start Patient Intake <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </form>
          </div>
        )}

        {currentView === 'INTAKE' && (
          <div className="p-8 lg:p-14 space-y-16 animate-in slide-in-from-right-12 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setCurrentView('QUEUE_ENTRY')}
                  className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-800 transition-all border border-slate-100"
                >
                  <XCircle size={24} />
                </button>
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Clinical Intake</h2>
                  <p className="text-slate-500 font-medium text-lg mt-1 italic">
                    Ticket: <span className="text-teal-600 font-black">{formData.queueNumber}</span> • Profile: <span className="text-slate-800 font-black">{formData.name}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <section>
                <h3 className="flex items-center gap-3 text-rose-600 font-black mb-10 text-xl uppercase tracking-widest border-l-4 border-rose-500 pl-4">
                  1. Clinical Profile & Biometrics <span className="text-rose-500">*</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-5 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Patient Name</label>
                        <input type="text" readOnly value={formData.name} className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-100 outline-none bg-slate-100 text-slate-500 font-bold transition-all text-lg cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Age</label>
                        <input type="text" readOnly value={formData.age} className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-100 outline-none bg-slate-100 font-black text-2xl text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Biological Sex</label>
                        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] opacity-60">
                          <button disabled className={`flex-1 py-4 rounded-[1rem] text-xs font-black transition-all ${formData.sex === 'MALE' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-500'}`}>MALE</button>
                          <button disabled className={`flex-1 py-4 rounded-[1rem] text-xs font-black transition-all ${formData.sex === 'FEMALE' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-500'}`}>FEMALE</button>
                        </div>
                      </div>

                      {formData.sex === 'FEMALE' && (
                        <div className="md:col-span-2 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                           <label className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                             Pregnancy Status <span className="text-rose-500">* (Mandatory)</span>
                           </label>
                           <div className="grid grid-cols-2 gap-4">
                              <button 
                                type="button"
                                onClick={() => handleInputChange('isPregnant', true)}
                                className={`flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-sm transition-all border-2 ${formData.isPregnant === true ? 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-100' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200'}`}
                              >
                                <Baby size={18} /> PREGNANT
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleInputChange('isPregnant', false)}
                                className={`flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-sm transition-all border-2 ${formData.isPregnant === false ? 'bg-slate-900 text-white border-slate-950 shadow-lg shadow-slate-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                              >
                                <XCircle size={18} /> NOT PREGNANT
                              </button>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-10">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">Biometric Data Streaming <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative bg-white rounded-3xl border-2 border-slate-100 p-8 hover:border-rose-400 hover:shadow-2xl hover:shadow-rose-50 transition-all flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Activity size={24} /></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-rose-400">mmHg</span>
                         </div>
                         <input type="text" value={formData.vitals?.bp} onChange={(e) => handleVitalsChange('bp', e.target.value)} placeholder="000 / 00" className="w-full bg-transparent text-slate-900 font-black text-4xl outline-none placeholder:text-slate-100 text-center" />
                         <p className="text-center mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Blood Pressure</p>
                      </div>

                      <div className="group relative bg-white rounded-3xl border-2 border-slate-100 p-8 hover:border-rose-400 hover:shadow-2xl hover:shadow-rose-50 transition-all flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Heart size={24} /></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-rose-400">bpm</span>
                         </div>
                         <input type="text" inputMode="numeric" value={formData.vitals?.hr} onChange={(e) => handleVitalsChange('hr', e.target.value)} placeholder="00" className="w-full bg-transparent text-slate-900 font-black text-4xl outline-none placeholder:text-slate-100 text-center" />
                         <p className="text-center mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Heart Rate</p>
                      </div>

                      <div className="group relative bg-white rounded-3xl border-2 border-slate-100 p-8 hover:border-rose-400 hover:shadow-2xl hover:shadow-rose-50 transition-all flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Thermometer size={24} /></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-rose-400">°C</span>
                         </div>
                         <input type="text" value={formData.vitals?.temp} onChange={(e) => handleVitalsChange('temp', e.target.value)} placeholder="00.0" className="w-full bg-transparent text-slate-900 font-black text-4xl outline-none placeholder:text-slate-100 text-center" />
                         <p className="text-center mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Core Temp</p>
                      </div>

                      <div className="group relative bg-white rounded-3xl border-2 border-slate-100 p-8 hover:border-rose-400 hover:shadow-2xl hover:shadow-rose-50 transition-all flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Wind size={24} /></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-rose-400">%</span>
                         </div>
                         <input type="text" inputMode="numeric" value={formData.vitals?.spo2} onChange={(e) => handleVitalsChange('spo2', e.target.value)} placeholder="00" className="w-full bg-transparent text-slate-900 font-black text-4xl outline-none placeholder:text-slate-100 text-center" />
                         <p className="text-center mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Oxygen Sat</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                <h3 className="flex items-center gap-3 text-indigo-600 font-black mb-10 text-xl uppercase tracking-widest border-l-4 border-indigo-500 pl-4">
                  2. Clinical History <span className="text-slate-400 font-medium lowercase text-sm">(Optional)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <History size={14} className="text-indigo-400" /> Past Medical History
                    </label>
                    <textarea 
                      value={formData.medicalHistory} 
                      onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                      placeholder="Known chronic conditions (Diabetes, Hypertension, etc.)..."
                      className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm transition-all resize-none shadow-inner min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Stethoscope size={14} className="text-indigo-400" /> Surgical History
                    </label>
                    <textarea 
                      value={formData.surgeries} 
                      onChange={(e) => handleInputChange('surgeries', e.target.value)}
                      placeholder="Past operations, procedures, or hospitalizations..."
                      className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm transition-all resize-none shadow-inner min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Pill size={14} className="text-indigo-400" /> Current Medications
                    </label>
                    <textarea 
                      value={formData.medications} 
                      onChange={(e) => handleInputChange('medications', e.target.value)}
                      placeholder="List of prescriptions, dosage, and frequency..."
                      className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm transition-all resize-none shadow-inner min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Users size={14} className="text-indigo-400" /> Family Medical History
                    </label>
                    <textarea 
                      value={formData.familyHistory} 
                      onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                      placeholder="Relevant genetic or hereditary conditions in first-degree relatives..."
                      className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800 text-sm transition-all resize-none shadow-inner min-h-[120px]"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-3 text-orange-600 font-black mb-10 text-xl uppercase tracking-widest border-l-4 border-orange-500 pl-4">
                  3. Reason for Presentation <span className="text-orange-500">*</span>
                </h3>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Chief Complaint / Narrative of Symptoms <span className="text-rose-500">*</span></label>
                  <textarea rows={4} value={formData.chiefComplaint} onChange={(e) => handleInputChange('chiefComplaint', e.target.value)} className="w-full px-8 py-7 rounded-[2.5rem] border border-slate-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none resize-none bg-slate-50 text-slate-900 font-bold text-xl leading-relaxed shadow-inner" placeholder="Detailed symptoms, onset, and severity..." />
                </div>
              </section>
            </div>
            
            <div className="pt-20 border-t border-slate-50 flex flex-col items-center gap-8">
               <button onClick={runAITriage} disabled={!isFormValid() || loading} className={`w-full max-w-2xl py-10 rounded-[3rem] font-black text-3xl transition-all flex items-center justify-center gap-6 shadow-2xl ${isFormValid() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-2' : 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100 shadow-none'}`}>
                 {loading ? <Loader2 className="animate-spin" size={36} /> : <BrainCircuit size={36} />}
                 {loading ? 'Analyzing Clinical Profile...' : 'Authorize AI Risk Assessment'}
               </button>
            </div>
          </div>
        )}

        {currentView === 'TRIAGE_RESULT' && aiTriage && (
          <div className="p-16 space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between border-b border-slate-50 pb-12">
              <div className="flex items-center gap-8 text-indigo-600">
                <div className="p-6 bg-indigo-50 rounded-[2rem] shadow-sm"><BrainCircuit size={48} /></div>
                <div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight">AI Appraisal</h2>
                  <p className="text-slate-500 font-bold text-xl mt-1">Intelligent Risk Categorization</p>
                </div>
              </div>
              <div className={`px-16 py-6 rounded-[3rem] font-black text-4xl tracking-tighter shadow-xl border-4 ${TRIAGE_LABELS[aiTriage.level].color}`}>
                {TRIAGE_LABELS[aiTriage.level].label}
              </div>
            </div>
            <div className="bg-slate-50 p-16 rounded-[3.5rem] border border-slate-100 shadow-inner">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Clinical Risk Analysis</h3>
              <p className="text-4xl text-slate-800 leading-[1.2] font-medium italic">"{aiTriage.justification}"</p>
            </div>
            <div className="flex justify-center">
              <button onClick={runEnhancedScreening} disabled={loading} className="w-full max-w-2xl bg-indigo-600 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-indigo-100">
                {loading ? <Loader2 className="animate-spin" /> : <ClipboardList size={32} />} Run Advanced Screening
              </button>
            </div>
          </div>
        )}

        {currentView === 'SCREENING' && (
          <div className="p-16 space-y-14 animate-in slide-in-from-right-16 duration-700">
            <div className="flex items-center gap-8 text-indigo-600 border-b border-slate-50 pb-12">
              <div className="p-6 bg-indigo-50 rounded-[2rem] shadow-sm"><ClipboardList size={40} /></div>
              <div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight">Refined Inquiries</h2>
                <p className="text-slate-500 font-bold text-xl mt-1">Contextual diagnostic screening protocol <span className="text-rose-500">*</span></p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-10">
              {screening.map((q, i) => (
                <div key={i} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-md transition-all flex flex-col gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-lg shadow-indigo-100">0{i+1}</div>
                    <p className="text-slate-800 font-bold text-2xl leading-snug pt-1">{q}</p>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-6 top-6 text-indigo-300 group-focus-within:text-indigo-500 transition-colors">
                      <MessageSquareText size={24} />
                    </div>
                    <textarea value={screeningAnswers[i]} onChange={(e) => updateScreeningAnswer(i, e.target.value)} rows={3} placeholder="Enter specific patient response here..." className="w-full pl-16 pr-8 py-6 rounded-3xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-700 text-lg transition-all resize-none shadow-inner" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => { if (isScreeningValid) { setCurrentView('FINAL'); setStep(4); } }} 
                disabled={!isScreeningValid}
                className={`w-full py-12 rounded-[3.5rem] font-black text-3xl transition-all flex items-center justify-center gap-4 ${isScreeningValid ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-2xl shadow-teal-100 hover:-translate-y-2' : 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100'}`}
              >
                Submit Clinical Package
              </button>
            </div>
          </div>
        )}

        {currentView === 'FINAL' && (
          <div className="p-24 text-center space-y-12 animate-in fade-in scale-95 duration-700">
            <div className="w-40 h-40 bg-teal-50 text-teal-600 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner mb-8">
              <CheckCircle2 size={96} />
            </div>
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Handoff Validated</h2>
            <div className="max-w-2xl mx-auto p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 text-left shadow-sm">
               <p className="text-slate-900 font-black text-2xl mb-3">Case Ready for Distribution</p>
               <p className="text-slate-500 font-bold text-lg leading-relaxed">The patient's clinical file has been encrypted and synced with the provider's active workstation queue.</p>
            </div>
            <button onClick={finalizePatient} className="w-full max-w-lg bg-teal-600 text-white py-10 rounded-[3rem] font-black text-3xl hover:bg-teal-700 shadow-2xl shadow-teal-100 transform hover:scale-105 active:scale-95 transition-all">
              Initialize Route
            </button>
          </div>
        )}
      </div>
    </div>
  );
};