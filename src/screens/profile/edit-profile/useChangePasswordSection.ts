import { useState } from 'react';

import { useChangePasswordMutation } from '@hooks/useProfileMutations';
import { getErrorMessage } from '@utils/errorHandler';
import { showPopupToast } from '@utils/toast';

import { getPasswordRules } from './schema';
import type { UseChangePasswordSectionResult } from './types';

/** Change-password accordion: field state, validation rules, save/cancel. */
export const useChangePasswordSection = (): UseChangePasswordSectionResult => {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changePassword = useChangePasswordMutation();

  const passRules = getPasswordRules(newPassword);

  const resetFields = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || newPassword !== confirmPassword) return;
    try {
      await changePassword.mutateAsync({ oldPassword, newPassword, confirmPassword });
      resetFields();
      showPopupToast('Password updated successfully.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const disabled =
    changePassword.isPending ||
    !oldPassword ||
    !newPassword ||
    newPassword !== confirmPassword ||
    !passRules.every((r) => r.ok);

  return {
    open,
    toggleOpen: () => setOpen((o) => !o),
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showOld,
    toggleShowOld: () => setShowOld((s) => !s),
    showNew,
    toggleShowNew: () => setShowNew((s) => !s),
    showConfirm,
    toggleShowConfirm: () => setShowConfirm((s) => !s),
    passRules,
    handleUpdatePassword: () => void handleUpdatePassword(),
    isPending: changePassword.isPending,
    disabled,
    handleCancel: () => {
      resetFields();
      setOpen(false);
    },
  };
};
