import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { ArtistProfile } from '@app-types/api';

import { C } from '../colors';
import { styles } from '../styles';
import { useMobileNumberSection } from '../useMobileNumberSection';
import { FieldLabel, FieldRow } from './Field';

export const MobileNumberSection = ({ profile }: { profile?: ArtistProfile }) => {
  const {
    phone,
    phoneOtpStep,
    phoneOtp,
    setPhoneOtp,
    onChangePhone,
    unchanged,
    isSendingOtp,
    isVerifyingOtp,
    handleSendPhoneOtp,
    handleVerifyPhoneOtp,
    cancelOtpStep,
  } = useMobileNumberSection(profile);

  return (
    <View style={styles.field}>
      <FieldLabel>Mobile Number</FieldLabel>
      <FieldRow icon="phone">
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="Mobile Number"
          placeholderTextColor={C.dim}
          value={phone}
          editable={!phoneOtpStep}
          onChangeText={onChangePhone}
        />
      </FieldRow>
      <View style={styles.saveBarRight}>
        {!phoneOtpStep ? (
          <Pressable
            style={[
              styles.btnGhostSm,
              isSendingOtp || unchanged ? { opacity: 0.6 } : null,
            ]}
            onPress={handleSendPhoneOtp}
            disabled={isSendingOtp || unchanged}
          >
            <Text style={styles.btnGhostSmText}>{isSendingOtp ? 'Sending...' : 'Change'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.btnGhostSm} onPress={cancelOtpStep}>
            <Text style={styles.btnGhostSmText}>Cancel</Text>
          </Pressable>
        )}
      </View>
      {phoneOtpStep ? (
        <View style={[styles.field, { marginTop: 10 }]}>
          <FieldLabel>Enter 6-digit OTP</FieldLabel>
          <FieldRow icon="lock">
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={C.dim}
              value={phoneOtp}
              onChangeText={setPhoneOtp}
            />
          </FieldRow>
          <View style={styles.saveBarRight}>
            <Pressable
              style={[
                styles.btnPrimarySm,
                isVerifyingOtp || phoneOtp.length !== 6 ? { opacity: 0.6 } : null,
              ]}
              onPress={handleVerifyPhoneOtp}
              disabled={isVerifyingOtp || phoneOtp.length !== 6}
            >
              <LinearGradient
                colors={[C.pink, C.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimarySmFill}
              >
                <Text style={styles.btnPrimaryText}>
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};
