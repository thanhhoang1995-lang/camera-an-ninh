
import React from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, colorClass }) => {
  return (
    <div className={`flex items-center p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md ${colorClass}`}>
      <div className={`p-2.5 sm:p-3 rounded-xl mr-3 sm:mr-4 bg-opacity-10 shrink-0 ${colorClass.replace('text-', 'bg-')}`}>
        <i className={`bi ${icon} text-lg sm:text-xl`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
