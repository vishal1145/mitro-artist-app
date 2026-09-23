import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ScrollView } from 'react-native';

import type { FunWheelSpinOrder, RewardOrder } from '@services/api/liveDeliveryApi';
import type { BroadcastActivityItem } from '@app-types/broadcast';

export interface UsePrivateCallSessionResult {
  fanName: string;
  ratePerMin: number;

  status: 'connecting' | 'connected';
  elapsed: number;
  remoteUid: number | null;
  remoteVideoOn: boolean;
  remoteAudioOn: boolean;
  cost: { minute: number; total: number };
  activity: BroadcastActivityItem[];
  pendingRewards: RewardOrder[];
  pendingSpins: FunWheelSpinOrder[];
  fulfillingId: string | null;
  micOn: boolean;
  camOn: boolean;
  videoKey: number;
  panel: 'activity' | null;
  isFullscreen: boolean;
  manageOpen: boolean;
  peerReconnecting: boolean;
  /** The artist's OWN link dropped — the backend is told so billing pauses. */
  selfReconnecting: boolean;
  confirmingEnd: boolean;
  ending: boolean;
  endingNotice: string | null;
  errorBanner: string | null;
  videoAvailable: boolean;

  pendingCount: number;
  connected: boolean;
  fanVideoLive: boolean;

  feedRef: MutableRefObject<ScrollView | null>;

  setPanel: Dispatch<SetStateAction<'activity' | null>>;
  setIsFullscreen: Dispatch<SetStateAction<boolean>>;
  setManageOpen: Dispatch<SetStateAction<boolean>>;
  setConfirmingEnd: Dispatch<SetStateAction<boolean>>;

  endCall: () => Promise<void>;
  fulfillReward: (o: RewardOrder) => Promise<void>;
  fulfillSpin: (s: FunWheelSpinOrder) => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
}
