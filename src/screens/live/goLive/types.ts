export interface UseGoLiveSetupResult {
  videoAvailable: boolean;

  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  highlightedPrice: string;
  setHighlightedPrice: (value: string) => void;

  cameraOn: boolean;
  micOn: boolean;
  ready: boolean;
  videoKey: number;
  activeRewards: number | null;

  toggleCamera: () => void;
  toggleMic: () => void;

  priceValid: boolean;
  canGoLive: boolean;
  goLive: () => void;
  caption: string;

  devicesReady: boolean;
}
