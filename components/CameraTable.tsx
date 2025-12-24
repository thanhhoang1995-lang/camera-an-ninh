
import React from 'react';
import { Camera, CameraStatus } from '../types';

interface CameraTableProps {
  cameras: Camera[];
  onEdit: (cam: Camera) => void;
  onDelete: (id: string) => void;
  onFocus: (cam: Camera) => void;
}

const CameraTable: React.FC<CameraTableProps> = ({ cameras, onEdit, onDelete, onFocus }) => {
  const formatTime = (ts?: number) => {
    if (!ts) return 'Chưa kiểm tra';
    return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Tên</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700 hidden md:table-cell">IP</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700 hidden lg:table-cell">Kiểm tra lúc</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {cameras.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Không tìm thấy camera nào</td>
            </tr>
          ) : (
            cameras.map((cam) => (
              <tr 
                key={cam.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onFocus(cam)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{cam.name}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[120px] md:max-w-none">{cam.address}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell font-mono text-xs">{cam.ip}</td>
                <td className="px-4 py-3">
                  {cam.isChecking ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 animate-pulse">
                      <i className="bi bi-arrow-repeat animate-spin mr-1.5"></i>
                      Đang check...
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      cam.status === CameraStatus.ONLINE 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        cam.status === CameraStatus.ONLINE ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-red-500'
                      }`}></span>
                      {cam.status === CameraStatus.ONLINE ? 'Online' : 'Offline'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">
                  {formatTime(cam.lastCheckAt)}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(cam); }}
                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors inline-flex"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  {/* Nút xóa chỉ hiển thị trên máy tính (màn hình md trở lên) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(cam.id); }}
                    className="hidden md:inline-flex text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
