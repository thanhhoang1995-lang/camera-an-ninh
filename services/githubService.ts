
import { Camera, GitHubSettings } from "../types";

export const syncCamerasWithGitHub = async (settings: GitHubSettings, localCameras: Camera[]): Promise<Camera[]> => {
  if (!settings.token || !settings.gistId) {
    throw new Error("Chưa cấu hình GitHub Gist");
  }

  const headers = {
    'Authorization': `token ${settings.token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  // 1. Fetch current Gist content
  const response = await fetch(`https://api.github.com/gists/${settings.gistId}`, { headers });
  if (!response.ok) throw new Error("Không thể kết nối GitHub");

  const gist = await response.json();
  const serverContent = gist.files['cameras.json']?.content || '[]';
  const serverCameras: Camera[] = JSON.parse(serverContent);

  // 2. Merge logic (latest updatedAt wins)
  const map = new Map<string, Camera>();
  serverCameras.forEach(c => map.set(c.id, c));
  localCameras.forEach(lc => {
    const sc = map.get(lc.id);
    if (!sc || (lc.updatedAt || 0) >= (sc.updatedAt || 0)) {
      map.set(lc.id, lc);
    }
  });

  const mergedCameras = Array.from(map.values());

  // 3. Update Gist
  const patchResponse = await fetch(`https://api.github.com/gists/${settings.gistId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      files: {
        'cameras.json': { content: JSON.stringify(mergedCameras) }
      }
    })
  });

  if (!patchResponse.ok) throw new Error("Lỗi khi cập nhật Gist");

  return mergedCameras;
};
