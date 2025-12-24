
export enum CameraStatus {
  ONLINE = 'online',
  OFFLINE = 'offline'
}

export interface Camera {
  id: string;
  name: string;
  ip: string;
  address: string;
  lat: number;
  lng: number;
  status: CameraStatus;
  videoUrl?: string;
  updatedAt: number;
  lastCheckAt?: number;
  isChecking?: boolean;
  deleted?: boolean;
}

export interface GitHubSettings {
  token: string;
  gistId: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  sources?: { uri: string; title: string }[];
}
