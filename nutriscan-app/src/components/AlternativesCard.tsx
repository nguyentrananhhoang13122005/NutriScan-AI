import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HealthyAlternative } from '../types/nutrition';
import { THEME } from '../constants/theme';
import { Sparkles, ArrowRight } from 'lucide-react-native';

interface Props {
  alternatives: HealthyAlternative[];
}

export const AlternativesCard: React.FC<Props> = ({ alternatives }) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconTitle}>
          <Sparkles size={18} color="#34D399" />
          <Text style={styles.headerTitle}>Gợi ý Lựa chọn Lành mạnh hơn</Text>
        </View>
        <Text style={styles.subtitle}>Sạch hơn, ít phụ gia & dinh dưỡng hơn</Text>
      </View>

      <View style={styles.list}>
        {alternatives.map((item, index) => (
          <View key={index} style={styles.itemBox}>
            <View style={styles.itemTop}>
              <View style={styles.checkCircle}>
                <ArrowRight size={12} color="#10B981" />
              </View>
              <Text style={styles.itemName}>{item.suggestion_name}</Text>
            </View>
            <Text style={styles.whyBetterText}>🌱 {item.why_better}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginVertical: 12,
  },
  header: {
    marginBottom: 12,
  },
  iconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  itemBox: {
    backgroundColor: THEME.colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  whyBetterText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
    paddingLeft: 28,
  },
});
