
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CameraMap from './components/CameraMap';
import CameraTable from './components/CameraTable';
import StatsCard from './components/StatsCard';
import { Camera, CameraStatus, GitHubSettings, UptimePoint } from './types';
import { STORAGE_KEYS } from './constants';
import { syncCamerasWithGitHub } from './services/githubService';
import { analyzeSystemSecurity } from './services/geminiService';

const App: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CameraStatus | 'all'>('all');
  const [isPinMode, setIsPinMode] = useState(false);
  const [focusedCamera, setFocusedCamera] = useState<Camera | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'multiview'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Settings state
  const [ghSettings, setGhSettings] = useState<GitHubSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GITHUB_SETTINGS);
    return saved ? JSON.parse(saved) : { token: '', gistId: '' };
  });

  const camerasRef = useRef<Camera[]>([]);
  useEffect(() => {
    camerasRef.current = cameras;
  }, [cameras]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      const saved = localStorage.getItem(STORAGE_KEYS.CAMERAS);
      if (saved) {
        setCameras(JSON.parse(saved));
      } else {
        const initial: Camera[] = [
          { id: '1', name: 'Ngã tư Phan Chu Trinh', ip: '192.168.1.10', address: '99 Phan Chu Trinh, P.9, Đà Lạt', lat: 11.9472, lng: 108.4593, status: CameraStatus.ONLINE, updatedAt: Date.now(), lastCheckAt: Date.now(), uptimeHistory: [] },
          { id: '2', name: 'Cổng Phường Lâm Viên', ip: '192.168.1.11', address: 'Phường Lâm Viên, Đà Lạt', lat: 11.9412, lng: 108.4583, status: CameraStatus.OFFLINE, updatedAt: Date.now(), lastCheckAt: Date.now(), uptimeHistory: [] },
        ];
        setCameras(initial);
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(initial));
      }
      setIsInitialLoad(false);
    };
    loadData();
  }, []);

  const checkStatuses = useCallback(async () => {
    const activeCameras = camerasRef.current.filter(c => !c.deleted);
    if (activeCameras.length === 0) return;

    setCameras(prev => prev.map(c => !c.deleted ? { ...c, isChecking: true } : c));

    for (const cam of activeCameras) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
      setCameras(prev => prev.map(c => {
        if (c.id === cam.id) {
          const shouldToggle = Math.random() > 0.98;
          const newStatus = shouldToggle 
            ? (c.status === CameraStatus.ONLINE ? CameraStatus.OFFLINE : CameraStatus.ONLINE)
            : c.status;
          
          const newHistory: UptimePoint[] = [...(c.uptimeHistory || []), { timestamp: Date.now(), status: newStatus }].slice(-30);
          
          return { ...c, status: newStatus, isChecking: false, lastCheckAt: Date.now(), uptimeHistory: newHistory };
        }
        return c;
      }));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(checkStatuses, 60000);
    const timeout = setTimeout(checkStatuses, 3500);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkStatuses]);

  const saveCameras = useCallback((updated: Camera[]) => {
    setCameras(updated);
    localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updated.map(c => ({...c, isChecking: false}))));
  }, []);

  const filteredCameras = useMemo(() => {
    return cameras.filter(c => {
      if (c.deleted) return false;
      const term = searchTerm.toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(term) || c.address.toLowerCase().includes(term) || c.ip.includes(term);
      const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [cameras, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const active = cameras.filter(c => !c.deleted);
    return {
      total: active.length,
      online: active.filter(c => c.status === CameraStatus.ONLINE).length,
      offline: active.filter(c => c.status === CameraStatus.OFFLINE).length,
    };
  }, [cameras]);

  const handleAIAnalysis = async () => {
    setIsAiLoading(true);
    setShowAIModal(true);
    const result = await analyzeSystemSecurity(cameras);
    setAiAnalysisResult(result || '');
    setIsAiLoading(false);
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newCam: Camera = {
      id: `cam_${Date.now()}`,
      name: `Camera mới #${cameras.filter(c => !c.deleted).length + 1}`,
      ip: '192.168.1.xxx',
      address: `Vị trí (Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)})`,
      lat,
      lng,
      status: CameraStatus.ONLINE,
      updatedAt: Date.now(),
      lastCheckAt: Date.now(),
      uptimeHistory: []
    };
    setSelectedCamera(newCam);
    setShowEditModal(true);
    setIsPinMode(false);
  }, [cameras]);

  const handleSaveCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera) return;

    const exists = cameras.find(c => c.id === selectedCamera.id);
    let updated: Camera[];
    if (exists) {
      updated = cameras.map(c => c.id === selectedCamera.id ? { ...selectedCamera, updatedAt: Date.now() } : c);
    } else {
      updated = [...cameras, { ...selectedCamera, updatedAt: Date.now(), lastCheckAt: Date.now(), uptimeHistory: [] }];
    }
    saveCameras(updated);
    setShowEditModal(false);
    setSelectedCamera(null);
  };

  const handleDeleteCamera = (id: string) => {
    if (window.confirm('Xóa thiết bị này khỏi danh sách quản lý?')) {
      const updated = cameras.map(c => c.id === id ? { ...c, deleted: true, updatedAt: Date.now() } : c);
      saveCameras(updated);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
          setFocusedCamera({ 
            id: `USER_LOCATION_${Date.now()}`, 
            lat: newPos.lat, 
            lng: newPos.lng 
          } as any);
        },
        (err) => alert("Không thể lấy vị trí."),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  if (isInitialLoad) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[5000]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${viewMode === 'multiview' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className="glass-effect sticky top-0 z-[1001] border-b border-slate-200 px-4 py-3 safe-top">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <i className="bi bi-camera-reels-fill text-xl"></i>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-slate-900 text-base leading-none">Hệ thống camera</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lâm Viên - Đà Lạt</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode(viewMode === 'dashboard' ? 'multiview' : 'dashboard')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md ${viewMode === 'multiview' ? 'bg-amber-500 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
              <i className={`bi ${viewMode === 'multiview' ? 'bi-grid-fill' : 'bi-grid'} mr-2`}></i>
              <span className="hidden xs:inline">{viewMode === 'multiview' ? 'Thoát Grid' : 'Multi-View'}</span>
            </button>
            <button 
              onClick={handleAIAnalysis}
              className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              <i className="bi bi-magic mr-2"></i>
              <span className="hidden xs:inline">AI Analysis</span>
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-slate-200 shadow-sm transition-all">
              <i className="bi bi-gear-fill text-lg"></i>
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'dashboard' ? (
        <main className="flex-1 container mx-auto p-4 lg:p-6 space-y-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            <div className="col-span-2 md:col-span-1">
              <StatsCard label="Tổng thiết bị" value={stats.total} icon="bi-cpu" colorClass="text-indigo-600 border-indigo-100 bg-white" />
            </div>
            <StatsCard label="Trực tuyến" value={stats.online} icon="bi-broadcast" colorClass="text-green-600 border-green-100 bg-white" />
            <StatsCard label="Ngoại tuyến" value={stats.offline} icon="bi-wifi-off" colorClass="text-red-600 border-red-100 bg-white" />
          </div>

          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-[400px] md:h-[500px] relative">
            <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
              <button 
                onClick={() => setIsPinMode(!isPinMode)}
                className={`p-3.5 rounded-2xl shadow-lg border transition-all ${isPinMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-200'}`}
              >
                <i className={`bi ${isPinMode ? 'bi-pin-map-fill' : 'bi-pin-map'} text-lg`}></i>
              </button>
              <button onClick={handleMyLocation} className="p-3.5 bg-white text-slate-700 rounded-2xl shadow-lg border border-slate-200 transition-all active:scale-95">
                <i className="bi bi-crosshair text-lg"></i>
              </button>
            </div>
            
            <CameraMap 
              cameras={filteredCameras} 
              isPinMode={isPinMode} 
              onMapClick={handleMapClick} 
              onViewLive={(id) => {
                const cam = cameras.find(c => c.id === id);
                if (cam) { setSelectedCamera(cam); setShowVideoModal(true); }
              }}
              focusedCamera={focusedCamera}
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative group">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Tìm camera theo tên, IP, địa chỉ..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setSelectedCamera({ id: `cam_${Date.now()}`, name: '', ip: '192.168.1.xxx', address: '', lat: 11.9404, lng: 108.4583, status: CameraStatus.ONLINE, updatedAt: Date.now(), uptimeHistory: [] });
                    setShowEditModal(true);
                  }}
                  className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center text-sm"
                >
                  <i className="bi bi-plus-lg sm:mr-2"></i> 
                  <span className="hidden sm:inline">Thêm thiết bị</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <CameraTable 
                cameras={filteredCameras} 
                onEdit={(cam) => { setSelectedCamera(cam); setShowEditModal(true); }}
                onDelete={handleDeleteCamera}
                onFocus={setFocusedCamera}
              />
            </div>
          </section>
        </main>
      ) : (
        <main className="flex-1 p-4 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
            {cameras.filter(c => !c.deleted && c.status === CameraStatus.ONLINE).slice(0, 9).map((cam) => (
              <div key={cam.id} className="bg-slate-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl aspect-video relative group">
                {cam.videoUrl ? (
                  <iframe className="w-full h-full" src={cam.videoUrl.includes('youtube.com') ? cam.videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1&mute=1' : cam.videoUrl} title={cam.name} allowFullScreen></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                    <i className="bi bi-camera-video-off text-4xl mb-2"></i>
                    <p className="text-xs font-bold uppercase tracking-widest">No Stream</p>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">{cam.name}</span>
                    </div>
                    <span className="text-[9px] font-mono text-indigo-300 mt-0.5 ml-4">{cam.ip}</span>
                  </div>
                  <button onClick={() => { setSelectedCamera(cam); setShowVideoModal(true); }} className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">
                    <i className="bi bi-arrows-fullscreen text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
            {cameras.filter(c => !c.deleted && c.status === CameraStatus.ONLINE).length === 0 && (
              <div className="col-span-full h-[60vh] flex flex-col items-center justify-center text-slate-500">
                <i className="bi bi-camera-video-off text-6xl mb-4"></i>
                <p className="text-xl font-bold">Không có camera nào đang Online</p>
              </div>
            )}
          </div>
        </main>
      )}

      {showAIModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center space-x-3">
                <i className="bi bi-stars text-2xl"></i>
                <h3 className="text-lg font-bold">AI Security Analysis</h3>
              </div>
              <button onClick={() => setShowAIModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Đang phân tích hệ thống mạng và thiết bị...</p>
                </div>
              ) : (
                <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysisResult}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Phân tích chuyên sâu dựa trên vị trí và hạ tầng IP.</p>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedCamera && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveCamera} className="bg-white rounded-[2.5rem] w-full max-w-xl p-6 sm:p-10 shadow-2xl my-auto animate-in slide-in-from-bottom-8">
            <h3 className="text-2xl font-bold mb-8">Thiết lập thiết bị</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Tên nhận diện</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={selectedCamera.name} onChange={(e) => setSelectedCamera({ ...selectedCamera, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">IP Address</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono" value={selectedCamera.ip} onChange={(e) => setSelectedCamera({ ...selectedCamera, ip: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Status</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={selectedCamera.status} onChange={(e) => setSelectedCamera({ ...selectedCamera, status: e.target.value as CameraStatus })}>
                  <option value={CameraStatus.ONLINE}>Online</option>
                  <option value={CameraStatus.OFFLINE}>Offline</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Vị trí lắp đặt</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={selectedCamera.address} onChange={(e) => setSelectedCamera({ ...selectedCamera, address: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Video Stream URL</label>
                <input type="text" placeholder="YouTube URL, HLS, or RTSP link" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={selectedCamera.videoUrl || ''} onChange={(e) => setSelectedCamera({ ...selectedCamera, videoUrl: e.target.value })} />
              </div>
            </div>
            <div className="pt-10 flex gap-3">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg">Lưu thiết bị</button>
              <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {showVideoModal && selectedCamera && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[4000] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl border border-white/5 animate-in zoom-in-95">
            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/5">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
                <div>
                  <h4 className="font-bold text-white text-base leading-none">{selectedCamera.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 inline-block">LIVE STREAM • IP: {selectedCamera.ip}</span>
                </div>
              </div>
              <button onClick={() => setShowVideoModal(false)} className="bg-white/5 hover:bg-white/10 text-white w-10 h-10 rounded-full transition-all flex items-center justify-center">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {selectedCamera.videoUrl ? (
                <iframe className="w-full h-full border-none" src={selectedCamera.videoUrl.includes('youtube.com') ? selectedCamera.videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1&mute=1' : selectedCamera.videoUrl} title="Live Stream" allowFullScreen></iframe>
              ) : (
                <div className="text-center p-12 opacity-50">
                  <i className="bi bi-camera-video-off text-6xl text-white mb-4 block"></i>
                  <p className="text-white">Không tìm thấy nguồn video cho IP {selectedCamera.ip}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className={`mt-auto py-10 px-4 border-t border-slate-200 text-center safe-bottom ${viewMode === 'multiview' ? 'hidden' : ''}`}>
        <p className="text-slate-300 text-[10px] font-medium uppercase tracking-[0.2em]">Lâm Viên Smart Monitoring System © 2025.</p>
      </footer>
    </div>
  );
};

export default App;
