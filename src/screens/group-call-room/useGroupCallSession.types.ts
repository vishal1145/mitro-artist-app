import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ScrollView } from 'react-native';

import type { FunWheelSpinOrder, RewardOrder } from '@services/api/liveDeliveryApi';
import type { GroupCallActivityItem, GroupCallParticipant } from '@app-types/groupCall';

export interface UseGroupCallSessionResult {
  displayTitle: string;
  maxParticipants: number;
  isAudioOnly: boolean;

  status: 'starting' | 'live';
  elapsed: number;
  activity: GroupCallActivityItem[];
  participants: GroupCallParticipant[];
  pending: GroupCallParticipant[];
  connected: GroupCallParticipant[];
  pendingRewards: RewardOrder[];
  pendingSpins: FunWheelSpinOrder[];
  fulfillingId: string | null;
  peak: number;
  chatText: string;
  sendingChat: boolean;
  micOn: boolean;
  camOn: boolean;
  videoKey: number;
  panel: 'chat' | 'participants' | null;
  isFullscreen: boolean;
  statsOpen: boolean;
  manageOpen: boolean;
  busyUserId: string | null;
  confirmingEnd: boolean;
  isEnding: boolean;
  errorBanner: string | null;
  /** OFFLINE gate — the room exists but hasn't been opened yet. */
  awaitingConfirm: boolean;
  startingRoom: boolean;
  videoAvailable: boolean;

  sessionEarnings: number;
  sessionGifts: number;
  pendingCount: number;
  stageCopy: { title: string; hint: string };

  chatRef: MutableRefObject<ScrollView | null>;

  setChatText: Dispatch<SetStateAction<string>>;
  setPanel: Dispatch<SetStateAction<'chat' | 'participants' | null>>;
  setIsFullscreen: Dispatch<SetStateAction<boolean>>;
  setStatsOpen: Dispatch<SetStateAction<boolean>>;
  setManageOpen: Dispatch<SetStateAction<boolean>>;
  setConfirmingEnd: Dispatch<SetStateAction<boolean>>;

  handleSendChat: () => Promise<void>;
  approve: (userId: string) => Promise<void>;
  reject: (userId: string) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  toggleMute: (p: GroupCallParticipant) => Promise<void>;
  fulfillReward: (o: RewardOrder) => Promise<void>;
  fulfillSpin: (s: FunWheelSpinOrder) => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  endCall: () => Promise<void>;
  exitBack: () => void;
  abandonBeforeStart: () => Promise<void>;
  onStartCall: () => void;
}
