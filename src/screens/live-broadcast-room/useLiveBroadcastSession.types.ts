import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ScrollView } from 'react-native';

import type { FunWheelSpinOrder, RewardOrder } from '@services/api/liveDeliveryApi';
import type { BroadcastActivityItem, BroadcastViewer } from '@app-types/broadcast';

export interface UseLiveBroadcastSessionResult {
  /** From the `sessionConfig` route param — the artist's chosen title, shown
   *  verbatim on the START SHOW confirmation screen. */
  displayTitle: string;
  /** Shown in the live header — overridden from the persisted record on
   *  rejoin so the real title/category still show. */
  liveTitle: string;
  liveCategory: string | undefined;

  status: 'ready' | 'starting' | 'live';
  awaitingConfirm: boolean;
  elapsed: number;
  viewerCount: number;
  peakViewer: number;
  activity: BroadcastActivityItem[];
  viewers: BroadcastViewer[];
  pendingRewards: RewardOrder[];
  pendingSpins: FunWheelSpinOrder[];
  fulfillingId: string | null;
  chatText: string;
  sendingChat: boolean;
  micOn: boolean;
  camOn: boolean;
  videoKey: number;
  panel: 'chat' | 'viewers' | null;
  isFullscreen: boolean;
  statsOpen: boolean;
  manageOpen: boolean;
  removingId: string | null;
  confirmingEnd: boolean;
  isEnding: boolean;
  errorBanner: string | null;
  videoAvailable: boolean;

  sessionEarnings: number;
  sessionGifts: number;
  pendingCount: number;

  chatRef: MutableRefObject<ScrollView | null>;

  setChatText: Dispatch<SetStateAction<string>>;
  setPanel: Dispatch<SetStateAction<'chat' | 'viewers' | null>>;
  setIsFullscreen: Dispatch<SetStateAction<boolean>>;
  setStatsOpen: Dispatch<SetStateAction<boolean>>;
  setManageOpen: Dispatch<SetStateAction<boolean>>;
  setConfirmingEnd: Dispatch<SetStateAction<boolean>>;

  handleSendChat: () => Promise<void>;
  fulfillReward: (order: RewardOrder) => Promise<void>;
  fulfillSpin: (spin: FunWheelSpinOrder) => Promise<void>;
  removeViewer: (v: BroadcastViewer) => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  endBroadcast: () => Promise<void>;
  goBack: () => void;
  onStartShow: () => void;
}
