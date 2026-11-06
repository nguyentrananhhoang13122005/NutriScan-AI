import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrafficLight } from '../types/nutrition';
import { THEME } from '../constants/theme';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react-native';

interface Props {
  trafficLight: TrafficLight;
  score: number;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'row' | 'column';
  showLabel?: boolean;
}

export const TrafficLightBadge: React.FC<Props> = ({
  trafficLight,
  score,
  size = 'md',
  layout,
  showLabel = true,
}) => {
  let bgColor = THEME.colors.green;
  let label = 'TỐT / AN TOÀN';
  let Icon = ShieldCheck;

  if (trafficLight === 'YELLOW') {
    bgColor = THEME.colors.yellow;
    label = 'CẦN LƯU Ý';
    Icon = AlertTriangle;
  } else if (trafficLight === 'RED') {
    bgColor = THEME.colors.red;
    label = 'HẠN CHẾ DÙNG';
    Icon = AlertOctagon;
  }

  const isLg = size === 'lg';
  const isSm = size === 'sm';
  const isColumn = layout ? layout === 'column' : isLg;

  return (
    <View
      style={[
        styles.container,
        isColumn && styles.containerColumn,
        isSm && styles.containerSm,
      ]}
    >
      {/* Vòng tròn điểm số */}
      <View
        style={[
          styles.circle,
          { backgroundColor: bgColor },
          isLg && styles.circleLg,
          isSm && styles.circleSm,
        ]}
      >
        <Text
          style={[
            styles.scoreText,
            isLg && styles.scoreTextLg,
            isSm && styles.scoreTextSm,
          ]}
        >
          {score}
        </Text>
        <Text
          style={[
            styles.maxScore,
            isLg && styles.maxScoreLg,
            isSm && styles.maxScoreSm,
          ]}
        >
          /100
        </Text>
      </View>

      {/* Nhãn trạng thái */}
      {showLabel && (
        <View
          style={[
            styles.badge,
            isSm && styles.badgeSm,
            { backgroundColor: `${bgColor}20`, borderColor: bgColor },
          ]}
        >
          <Icon size={isSm ? 11 : 14} color={bgColor} />
          <Text
            style={[
              styles.badgeText,
              { color: bgColor },
              isSm && styles.badgeTextSm,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  containerColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  containerSm: {
    gap: 6,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circleLg: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  circleSm: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 22,
  },
  scoreTextLg: {
    fontSize: 32,
    lineHeight: 34,
  },
  scoreTextSm: {
    fontSize: 15,
    lineHeight: 17,
  },
  maxScore: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '600',
  },
  maxScoreLg: {
    fontSize: 12,
  },
  maxScoreSm: {
    fontSize: 9,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    maxWidth: '100%',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  badgeTextSm: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
