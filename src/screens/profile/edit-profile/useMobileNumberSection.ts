import { useEffect, useState } from 'react';

import {
  useSendChangePhoneOtpMutation,
  useVerifyChangePhoneOtpMutation,
} from '@hooks/useProfileMutations';
import type { ArtistProfile } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { showPopupToast } from '@utils/toast';

import { isValidNationalPhone, isValidOtp, nationalDigits } from './schema';
import type { UseMobileNumberSectionResult } from './types';

/** Mobile-number change flow: phone/OTP state, resync on profile change,
 *  send/verify handlers. Mirrors the section that used to live inline in
 *  `MobileNumberSection`. */
export const useMobileNumberSection = (
  profile?: ArtistProfile,
): UseMobileNumberSectionResult => {
  const [phone, setPhone] = useState(() => nationalDigits(profile?.phone));
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const sendOtp = useSendChangePhoneOtpMutation();
  const verifyOtp = useVerifyChangePhoneOtpMutation();

  useEffect(() => {
    setPhone(nationalDigits(profile?.phone));
    // `nationalDigits` is a stable pure helper; only the profile matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  /** Compare the digits, not the formatting — the server's prefix may vary. */
  const unchanged = phone.length === 10 && phone === nationalDigits(profile?.phone);

  const handleSendPhoneOtp = async () => {
    // The server validates a bare 10-digit Indian number — send the national
    // digits only, NOT a "+91"-prefixed value (that fails the 10-digit check).
    if (!isValidNationalPhone(phone)) {
      showPopupToast('Enter a valid 10-digit mobile number.', 'error');
      return;
    }
    try {
      await sendOtp.mutateAsync({ newPhone: phone });
      setPhoneOtpStep(true);
      showPopupToast('OTP sent to new mobile number.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!isValidOtp(phoneOtp)) return;
    try {
      await verifyOtp.mutateAsync({ newPhone: phone, otp: phoneOtp });
      setPhoneOtpStep(false);
      setPhoneOtp('');
      showPopupToast('Phone number updated successfully.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  return {
    phone,
    phoneOtpStep,
    phoneOtp,
    setPhoneOtp,
    onChangePhone: (v: string) => setPhone(v.replace(/\D/g, '').slice(0, 10)),
    unchanged,
    isSendingOtp: sendOtp.isPending,
    isVerifyingOtp: verifyOtp.isPending,
    handleSendPhoneOtp: () => void handleSendPhoneOtp(),
    handleVerifyPhoneOtp: () => void handleVerifyPhoneOtp(),
    cancelOtpStep: () => {
      setPhoneOtpStep(false);
      setPhoneOtp('');
    },
  };
};
