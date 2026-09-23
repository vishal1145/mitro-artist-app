import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ScrollView, TextInput } from 'react-native';

import type { ArtistConversationSummary, PrivateMessageItem } from '@app-types/api';

import type { Entry } from './threadFormatting';

export interface UseChatThreadResult {
  fan: string;
  firstName: string;
  avatarUrl: string | undefined;

  messages: PrivateMessageItem[];
  entries: Entry[];
  loading: boolean;
  draft: string;
  sending: boolean;
  error: string | null;
  replyingTo: PrivateMessageItem | null;
  editing: PrivateMessageItem | null;
  actionTarget: PrivateMessageItem | null;
  forwardOpen: boolean;
  forwardingId: string | null;
  optionsOpen: boolean;
  otherConvos: ArtistConversationSummary[];

  scrollRef: MutableRefObject<ScrollView | null>;
  inputRef: MutableRefObject<TextInput | null>;

  setDraft: Dispatch<SetStateAction<string>>;
  setActionTarget: Dispatch<SetStateAction<PrivateMessageItem | null>>;
  setForwardOpen: Dispatch<SetStateAction<boolean>>;
  setOptionsOpen: Dispatch<SetStateAction<boolean>>;

  goBack: () => void;
  startReply: (m: PrivateMessageItem) => void;
  startEdit: (m: PrivateMessageItem) => void;
  cancelMode: () => void;
  handleCopy: (m: PrivateMessageItem) => Promise<void>;
  confirmDeleteForEveryone: (m: PrivateMessageItem) => void;
  confirmDeleteForMe: (m: PrivateMessageItem) => void;
  confirmDeleteChat: () => void;
  openForward: (m: PrivateMessageItem) => void;
  forwardTo: (c: ArtistConversationSummary) => Promise<void>;
  handleSend: () => Promise<void>;
}
