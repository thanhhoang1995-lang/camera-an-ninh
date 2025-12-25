
import React from 'react';
import { Camera, CameraStatus } from '../types';

interface CameraTableProps {
  cameras: Camera[];
  onEdit: (cam: Camera) => void;
  onDelete: (id: string) => void;
  onFocus: (cam: Camera) => void;
}

const CameraTable: React.FC<CameraTableProps> = ({ cameras, onEdit, onDelete, onFocus }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]">Tên thiết bị</th>
            <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]">Địa chỉ IP</th>
            <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px] hidden md:table-cell text-center">Độ ổn định (24h)</th>
            <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]">Trạng thái</th>
            <th className="px-4 py-4 text-right font-bold text-slate-500 uppercase tracking-widest text-[10px]">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {cameras.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">Không tìm thấy camera nào</td>
            </tr>
          ) : (
            cameras.map((cam) => (
              <tr 
                key={cam.id} 
                className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                onClick={() => onFocus(cam)}
              >
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cam.name}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[150px] md:max-w-none mt-0.5">{cam.address}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 whitespace-nowrap shadow-sm">
                    {cam.ip}
                  </span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="flex items-center justify-center space-x-0.5 h-6">
                    {cam.uptimeHistory?.slice(-20).map((point, idx) => (
                      <div 
                        key={idx}
                        title={`${new Date(point.timestamp).toLocaleString()} - ${point.status}`}
                        className={`w-1.5 h-full rounded-full transition-transform hover:scale-125 ${point.status === CameraStatus.ONLINE ? 'bg-green-400' : 'bg-red-400 opacity-60'}`}
                      />
                    )) || <span className="text-[10px] text-slate-300 italic">Chưa có dữ liệu</span>}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {cam.isChecking ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 animate-pulse">
                      <i className="bi bi-arrow-repeat animate-spin mr-1.5"></i>
                      CHECKING
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      cam.status === CameraStatus.ONLINE 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        cam.status === CameraStatus.ONLINE ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'
                      }`}></span>
                      {cam.status === CameraStatus.ONLINE ? 'Online' : 'Offline'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right space-x-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(cam); }}
                    className="text-indigo-600 hover:bg-indigo-600 hover:text-white p-2 rounded-xl transition-all inline-flex"
                    title="Chỉnh sửa"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(cam.id); }}
                    className="hidden md:inline-flex text-slate-400 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all"
                    title="Xóa"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CameraTable;
