import { View } from 'react-native';

import { CalloutStrong, CalloutText, WebCallout, type CalloutTone } from '@components/history';

import { styles } from '../styles';
import type { KycState } from '../types';

/** The `kycState` → `{ tone, body }` mapping, driven by `computeKycState` /
 *  `computeReadinessHeadline` upstream in `useKycPayouts`. Renders nothing
 *  when there's nothing to say (there never isn't, in practice — every
 *  `KycState` branch has a callout — but the screen still guards on `null`
 *  to match the original's `stateCallout | null` shape). */
export const StateCallout = ({
  kycState,
  rejectionReason,
  adminMessage,
}: {
  kycState: KycState;
  rejectionReason?: string | null;
  adminMessage?: string | null;
}) => {
  const stateCallout: { tone: CalloutTone; body: React.ReactNode } | null =
    kycState === 'approved'
      ? {
          tone: 'green',
          body: (
            <CalloutText>
              <CalloutStrong>Verified:</CalloutStrong> Your KYC has been approved by our team.
              Payouts to your bank account are enabled, and your details are locked as read-only
              for compliance.
            </CalloutText>
          ),
        }
      : kycState === 'rejected'
        ? {
            tone: 'red',
            body: (
              <>
                <CalloutText>
                  <CalloutStrong>Rejected:</CalloutStrong>{' '}
                  {rejectionReason || 'Our team found an issue with your submission.'} Please
                  review and resubmit the affected section(s) below.
                </CalloutText>
                {adminMessage ? (
                  <View style={styles.calloutSecondPara}>
                    <CalloutText>{adminMessage}</CalloutText>
                  </View>
                ) : null}
              </>
            ),
          }
        : kycState === 'under_review'
          ? {
              tone: 'gold',
              body: (
                <CalloutText>
                  <CalloutStrong>Under review:</CalloutStrong> All sections are complete and your
                  KYC has been sent for verification. We&apos;ll notify you once our team has
                  reviewed it — usually within 24–48 hours.
                </CalloutText>
              ),
            }
          : {
              tone: 'gold',
              body: (
                <>
                  <CalloutText>
                    <CalloutStrong>Why we ask for this:</CalloutStrong> Indian payment regulations
                    require verified identity and bank details before we can release creator
                    earnings to a bank account. Tap a section below to expand it.
                  </CalloutText>
                  <View style={styles.calloutSecondPara}>
                    <CalloutText>
                      Verification is usually reviewed within 24–48 hours. Your documents are
                      encrypted and only used for payout compliance — never shown on your public
                      profile.
                    </CalloutText>
                  </View>
                </>
              ),
            };

  if (!stateCallout) return null;

  return (
    <WebCallout tone={stateCallout.tone} icon="shield-check">
      {stateCallout.body}
    </WebCallout>
  );
};
