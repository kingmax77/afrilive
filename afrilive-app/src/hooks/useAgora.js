// Agora removed — replaced with expo-camera (seller) and animated gradient (buyer).
// This stub preserves the export shape so any remaining imports don't crash.

export const ROLE_BROADCASTER = 1;
export const ROLE_AUDIENCE = 2;

const useAgora = () => ({
  engine: null,
  isConnected: false,
  isConnecting: false,
  remoteUids: [],
  localUid: 0,
  isSimulated: true,
  connectionQuality: 4,
  switchCamera: () => {},
  toggleMute: () => {},
  toggleCamera: () => {},
  cleanup: () => {},
});

export default useAgora;
