import { View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from '../styles';
import type { Step } from '../types';

/**
 * `.kyc-step` + `.kyc-dot` + `.kyc-line`.
 *
 * Web sets `flex-wrap: wrap`, which drops Bank onto a second row at phone
 * width. Here the four steps stay on ONE row instead: the dots and connectors
 * hold their size and the labels take the squeeze, so a narrow screen ellipses
 * "Aadhaar" rather than breaking the run in half.
 */
export const Stepper = ({ steps, firstPending }: { steps: Step[]; firstPending: number }) => (
  <View style={styles.stepper}>
    {steps.map((step, i) => {
      const current = !step.done && i === firstPending;
      return (
        <View key={step.key} style={styles.stepperRun}>
          <View style={styles.step}>
            <View
              style={[
                styles.dot,
                step.done ? styles.dotDone : null,
                current ? styles.dotCurrent : null,
              ]}
            >
              {step.done ? (
                <LucideIcon name="check" size={rf(12)} color={webColors.onGreenDeep} />
              ) : (
                <Text
                  style={[styles.dotNum, current ? styles.dotNumCurrent : null]}
                >{`${i + 1}`}</Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.stepLbl,
                step.done ? styles.stepLblDone : null,
                current ? styles.stepLblCurrent : null,
              ]}
            >
              {step.label}
            </Text>
          </View>
          {i < steps.length - 1 ? (
            <View style={[styles.line, step.done ? styles.lineDone : null]} />
          ) : null}
        </View>
      );
    })}
  </View>
);
