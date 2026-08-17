import { memo, useMemo } from 'react';
import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { colors, typography, type TypographyVariant } from '@theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: keyof typeof colors;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
}

/**
 * Themed Text primitive. All app text goes through this so typography and
 * color stay tokenized (no inline font sizes or color literals downstream).
 */
const TextComponent = ({
  variant = 'body',
  color = 'textPrimary',
  align,
  weight,
  style,
  children,
  ...rest
}: TextProps) => {
  const dynamicStyle = useMemo<TextStyle>(() => {
    const next: TextStyle = { color: colors[color] };
    if (align) {
      next.textAlign = align;
    }
    if (weight) {
      next.fontWeight = weight;
    }
    return next;
  }, [color, align, weight]);

  return (
    <RNText style={[typography[variant], dynamicStyle, style]} {...rest}>
      {children}
    </RNText>
  );
};

export const Text = memo(TextComponent);
