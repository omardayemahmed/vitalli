
import React from 'react';
import { Patient, TriageLevel } from '../types';
import { TRIAGE_LABELS } from '../constants';
import { Clock, User, AlertCircle, Baby } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick: (p: Patient) => void;
  active?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick, active }) => {
  const triage = patient.triageLevel ? TRIAGE_LABELS[patient.triageLevel] : null;

  return (
    <div 
      onClick={() => onClick(patient)}
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
        active ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 text-lg">{patient.name}</h3>
        {triage && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${triage.color}`}>
            {triage.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <User size={14} /> {patient.age}y
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} /> {new Date(patient.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {patient.isPregnant && (
          <div className="flex items-center gap-1 text-pink-600 font-medium">
            <Baby size={14} /> Pregnant
          </div>
        )}
        {patient.age >= 75 && (
          <div className="flex items-center gap-1 text-indigo-600 font-medium">
            <AlertCircle size={14} /> Elderly
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-sm text-slate-700 line-clamp-1 italic">
          "{patient.chiefComplaint}"
        </p>
      </div>
    </div>
  );
};
