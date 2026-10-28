import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FoodAdditive } from '../types/nutrition';
import { THEME } from '../constants/theme';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Info } from 'lucide-react-native';

interface Props {
  additive: FoodAdditive;
}

export const AdditiveItem: React.FC<Props> = ({ additive }) => {
  const [expanded, setExpanded] = useState(false);

  let riskColor = THEME.colors.green;
  let riskLabel = 'An toàn';
  let Icon = CheckCircle;

  if (additive.risk_level === 'LOW_RISK') {
    riskColor = '#84CC16'; // Lime
    riskLabel = 'Rủi ro thấp';
    Icon = Info;
  } else if (additive.risk_level === 'MODERATE_RISK') {
    riskColor = THEME.colors.yellow;
    riskLabel = 'Cần thận trọng';
    Icon = AlertCircle;
  } else if (additive.risk_level === 'HAZARDOUS') {
    riskColor = THEME.colors.red;
    riskLabel = 'Nguy hại cho trẻ';
    Icon = AlertCircle;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
      style={[styles.container, expanded && styles.containerExpanded]}
    >
      <View style={styles.header}>
        <View style={styles.leftInfo}>
          <View style={[styles.codeBadge, { backgroundColor: `${riskColor}20`, borderColor: riskColor }]}>
            <Text style={[styles.codeText, { color: riskColor }]}>{additive.code}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.nameText} numberOfLines={1}>
              {additive.name}
            </Text>
            <Text style={styles.groupText}>{additive.group}</Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <View style={[styles.riskTag, { backgroundColor: `${riskColor}15` }]}>
            <Icon size={12} color={riskColor} />
            <Text style={[styles.riskText, { color: riskColor }]}>{riskLabel}</Text>
          </View>
          {expanded ? (
            <ChevronUp size={16} color={THEME.colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={THEME.colors.textSecondary} />
          )}
        </View>
      </View>

      {expanded && (
        <View style={styles.detailBox}>
          <Text style={styles.explanationText}>
            💡 <Text style={styles.boldText}>Tác động sức khỏe: </Text>
            {additive.short_explanation}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerExpanded: {
    borderColor: THEME.colors.border,
    backgroundColor: '#243347',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
  },
  nameText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  groupText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  explanationText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#38BDF8',
  },
});
