
import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus, TriageLevel } from '../types';
import { Search, Filter, Calendar, ChevronRight, User, ArrowUpRight, CheckCircle2, Clock, AlertCircle, History as HistoryIcon, Ticket } from 'lucide-react';
import { TRIAGE_LABELS } from '../constants';

interface HistoryPlatformProps {
  patients: Patient[];
}

export const HistoryPlatform: React.FC<HistoryPlatformProps> = ({ patients }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.queueNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [patients, search, statusFilter]);

  const getStatusIcon = (status: PatientStatus) => {
    switch (status) {
      case PatientStatus.DISCHARGED:
      case PatientStatus.STABILIZED_HOME:
        return <CheckCircle2 size={16} className="text-teal-500" />;
      case PatientStatus.ADMITTED:
        return <ArrowUpRight size={16} className="text-indigo-500" />;
      case PatientStatus.ER_QUEUE:
        return <AlertCircle size={16} className="text-rose-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  const statusLabel = (status: PatientStatus) => {
    return status.replace('_', ' ');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Archives</h2>
          <p className="text-slate-500 font-medium text-lg">Central repository for all processed patient files.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name, Ticket, or MRN..." 
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {['ALL', 'DISCHARGED', 'ADMITTED', 'ER_QUEUE'].map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ticket</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Triage</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Condition</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date/Time</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">MRN: {p.id} • {p.age}Y • {p.sex}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {p.queueNumber ? (
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Ticket size={14} />
                        <span className="font-black text-xs">{p.queueNumber}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No Ticket</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${TRIAGE_LABELS[p.triageLevel || TriageLevel.GREEN].color}`}>
                      {TRIAGE_LABELS[p.triageLevel || TriageLevel.GREEN].label}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-700 line-clamp-1 italic max-w-xs">"{p.chiefComplaint}"</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(p.status)}
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{statusLabel(p.status)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{new Date(p.timestamp).toLocaleDateString()}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-32 text-center text-slate-300">
              <HistoryIcon size={64} className="mx-auto mb-6 opacity-20" />
              <p className="text-2xl font-black italic tracking-tight">No matching records in archives</p>
              <p className="text-sm font-bold uppercase tracking-[0.2em] mt-2 opacity-50">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
