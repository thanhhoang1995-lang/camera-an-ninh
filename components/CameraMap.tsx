
import React, { useEffect, useRef } from 'react';
import { Camera, CameraStatus } from '../types';

// Declare L for Leaflet global access
declare const L: any;

interface CameraMapProps {
  cameras: Camera[];
  isPinMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onViewLive: (id: string) => void;
  focusedCamera?: Camera | null;
}

const CameraMap: React.FC<CameraMapProps> = ({ cameras, isPinMode, onMapClick, onViewLive, focusedCamera }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const userMarkerLayer = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstance.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([11.9404, 108.4583], 14);

      // Enhanced Google Maps Tiles URL
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        opacity: 1
      }).addTo(map);

      // Custom controls position
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);
      userMarkerLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;

      // Click handling
      map.on('click', (e: any) => {
        window.dispatchEvent(new CustomEvent('leaflet-map-clicked', { 
          detail: { lat: e.latlng.lat, lng: e.latlng.lng } 
        }));
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Sync click events with Pin Mode
  useEffect(() => {
    const handleMapClick = (e: any) => {
      if (isPinMode) {
        onMapClick(e.detail.lat, e.detail.lng);
      }
    };
    window.addEventListener('leaflet-map-clicked', handleMapClick);
    return () => window.removeEventListener('leaflet-map-clicked', handleMapClick);
  }, [isPinMode, onMapClick]);

  // Update Markers dynamically
  useEffect(() => {
    if (!markersLayer.current || !mapInstance.current) return;

    markersLayer.current.clearLayers();

    cameras.filter(c => !c.deleted).forEach(cam => {
      const color = cam.status === CameraStatus.ONLINE ? '#22c55e' : '#ef4444';
      const shadowColor = cam.status === CameraStatus.ONLINE ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.3)';
      
      const customIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div class="marker-pulse" style="background-color: ${shadowColor};"></div>
            <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); position: relative; z-index: 2;"></div>
          </div>
        `,
        className: 'custom-marker-wrapper',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: customIcon });

      const popupNode = L.DomUtil.create('div', 'p-2 min-w-[180px]');
      popupNode.innerHTML = `
        <div class="space-y-1.5">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full ${cam.status === CameraStatus.ONLINE ? 'bg-green-500' : 'bg-red-500'}"></div>
            <p class="font-bold text-slate-800 text-sm leading-tight">${cam.name}</p>
          </div>
          <p class="text-[10px] font-medium text-slate-500 leading-normal">${cam.address}</p>
          <div class="pt-2">
            <button id="view-btn-${cam.id}" class="w-full bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md flex items-center justify-center">
              <i class="bi bi-play-circle-fill mr-1.5"></i> XEM TRỰC TIẾP
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupNode);
      
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-btn-${cam.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onViewLive(cam.id);
            marker.closePopup();
          };
        }
      });

      markersLayer.current.addLayer(marker);
    });
  }, [cameras, onViewLive]);

  // Focus Map with smooth transition and User Marker
  useEffect(() => {
    if (focusedCamera && mapInstance.current) {
      mapInstance.current.flyTo([focusedCamera.lat, focusedCamera.lng], 17, {
        duration: 1.25,
        easeLinearity: 0.25
      });

      // Nếu ID là USER_LOCATION, render một marker đặc biệt màu xanh dương
      if (focusedCamera.id === 'USER_LOCATION' && userMarkerLayer.current) {
        userMarkerLayer.current.clearLayers();
        const userIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-center;">
              <div class="marker-pulse" style="background-color: rgba(59, 130, 246, 0.4);"></div>
              <div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); position: relative; z-index: 5;"></div>
            </div>
          `,
          className: 'user-marker-wrapper',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        
        const userMarker = L.marker([focusedCamera.lat, focusedCamera.lng], { icon: userIcon });
        
        const userPopupNode = L.DomUtil.create('div', 'p-2 min-w-[150px]');
        userPopupNode.innerHTML = `
          <div class="text-center">
            <button id="add-at-loc-btn" class="w-full bg-green-600 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-lg flex items-center justify-center">
              <i class="bi bi-plus-circle-fill mr-2"></i> THÊM CAMERA TẠI ĐÂY
            </button>
          </div>
        `;
        
        userMarker.bindPopup(userPopupNode);
        userMarkerLayer.current.addLayer(userMarker);
        
        userMarker.on('popupopen', () => {
          const btn = document.getElementById('add-at-loc-btn');
          if (btn) {
            btn.onclick = () => {
              onMapClick(focusedCamera.lat, focusedCamera.lng);
              userMarker.closePopup();
            };
          }
        });

        userMarker.openPopup();
      }
    }
  }, [focusedCamera, onMapClick]);

  // Cursor change based on mode
  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = isPinMode ? 'crosshair' : '';
    }
  }, [isPinMode]);

  return <div ref={mapContainerRef} id="map-container" className="animate-in fade-in duration-700" />;
};

export default CameraMap;
