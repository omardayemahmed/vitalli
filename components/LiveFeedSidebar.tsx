
import React from 'react';
import { Patient, PatientStatus, TriageLevel } from '../types';
import { Activity, Users, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { TRIAGE_LABELS } from '../constants';

interface LiveFeedSidebarProps {
  patients: Patient[];
}

export const LiveFeedSidebar: React.FC<LiveFeedSidebarProps> = ({ patients }) => {
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status !== PatientStatus.DISCHARGED && p.status !== PatientStatus.STABILIZED_HOME).length,
    red: patients.filter(p => p.triageLevel === TriageLevel.RED).length,
    orange: patients.filter(p => p.triageLevel === TriageLevel.ORANGE).length,
    green: patients.filter(p => p.triageLevel === TriageLevel.GREEN).length,
    physicianQueue: patients.filter(p => p.status === PatientStatus.PHYSICIAN_QUEUE).length,
    erQueue: patients.filter(p => p.status === PatientStatus.ER_QUEUE).length,
    admitted: patients.filter(p => p.status === PatientStatus.ADMITTED).length,
  };

  return (
    <div className="w-80 bg-white border-l h-full flex flex-col shadow-2xl">
      <div className="p-6 border-b bg-slate-50">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest">
          <Activity size={18} className="text-indigo-600" /> Live Hospital Census
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Metrics</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
              <p className="text-2xl font-black">{stats.active}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Active Cases</p>
            </div>
            <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg">
              <p className="text-2xl font-black">{stats.total}</p>
              <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-tighter">Total Intake</p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Patient Distribution</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Clock size={14} /></div>
                <span className="text-xs font-bold text-slate-700">Physician Queue</span>
              </div>
              <span className="font-black text-slate-900">{stats.physicianQueue}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><AlertCircle size={14} /></div>
                <span className="text-xs font-bold text-slate-700">ER Emergency</span>
              </div>
              <span className="font-black text-rose-600">{stats.erQueue}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><MapPin size={14} /></div>
                <span className="text-xs font-bold text-slate-700">Inpatient Ward</span>
              </div>
              <span className="font-black text-slate-900">{stats.admitted}</span>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Clinical Severity</p>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black">
                <span className="text-rose-600">CRITICAL (RED)</span>
                <span>{stats.red}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-600 h-full transition-all" style={{ width: `${(stats.red / (stats.active || 1)) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black">
                <span className="text-orange-500">URGENT (ORANGE)</span>
                <span>{stats.orange}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full transition-all" style={{ width: `${(stats.orange / (stats.active || 1)) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black">
                <span className="text-teal-600">STABLE (GREEN)</span>
                <span>{stats.green}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all" style={{ width: `${(stats.green / (stats.active || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Alerts</p>
          <div className="space-y-3">
            {patients.slice(-3).reverse().map(p => (
              <div key={p.id} className="text-[10px] p-3 rounded-lg border border-slate-100 bg-white shadow-sm flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1 ${TRIAGE_LABELS[p.triageLevel || TriageLevel.GREEN].dot}`} />
                <div>
                  <p className="font-black text-slate-900">{p.name}</p>
                  <p className="text-slate-500 font-medium">Arrived @ {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-6 border-t bg-slate-50">
        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">
          <Activity size={12} /> System Synchronized
        </div>
      </div>
    </div>
  );
};
