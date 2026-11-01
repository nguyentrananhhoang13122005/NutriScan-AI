import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { NutritionResult } from '../types/nutrition';
import { TrafficLightBadge } from './TrafficLightBadge';
import { X, Trophy, AlertTriangle, CheckCircle2, Scale } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  items: NutritionResult[];
}

export const CompareModal: React.FC<Props> = ({ visible, onClose, items }) => {
  if (items.length < 2) return null;

  const [itemA, itemB] = items;
  const winner =
    itemA.health_score > itemB.health_score
      ? 'A'
      : itemB.health_score > itemA.health_score
      ? 'B'
      : 'TIE';

  const hazardousCount = (item: NutritionResult) =>
    item.additives.filter(
      (a) => a.risk_level === 'HAZARDOUS' || a.risk_level === 'MODERATE_RISK'
    ).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Scale size={20} color="#10B981" />
              <Text style={styles.headerTitle}>So Sánh 2 Sản Phẩm</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Winner Banner */}
            <View style={styles.winnerBanner}>
              <Trophy size={20} color="#FBBF24" />
              <View style={{ flex: 1 }}>
                <Text style={styles.winnerLabel}>LỰA CHỌN TỐT HƠN CHO GIA ĐÌNH</Text>
                <Text style={styles.winnerName} numberOfLines={2}>
                  {winner === 'A'
                    ? `${itemA.product_name} (+${itemA.health_score - itemB.health_score} điểm)`
                    : winner === 'B'
                    ? `${itemB.product_name} (+${itemB.health_score - itemA.health_score} điểm)`
                    : 'Hai sản phẩm có điểm sức khỏe tương đương'}
                </Text>
              </View>
            </View>

            {/* 2 Columns Header: Product Info & Score */}
            <View style={styles.columnsRow}>
              {[itemA, itemB].map((item, idx) => {
                const isWinner = (idx === 0 && winner === 'A') || (idx === 1 && winner === 'B');
                return (
                  <View
                    key={item.id}
                    style={[styles.colCard, isWinner && styles.colCardWinner]}
                  >
                    {isWinner && (
                      <View style={styles.bestTag}>
                        <Text style={styles.bestTagText}>★ TỐT HƠN</Text>
                      </View>
                    )}

                    {item.image_uri ? (
                      <Image source={{ uri: item.image_uri }} style={styles.thumb} />
                    ) : null}

                    <Text style={styles.prodName} numberOfLines={2}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.brandName} numberOfLines={1}>
                      {item.brand_name || item.category}
                    </Text>

                    <View style={{ marginVertical: 10 }}>
                      <TrafficLightBadge
                        trafficLight={item.traffic_light}
                        score={item.health_score}
                        size="md"
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Comparison Rows */}
            <View style={styles.tableCard}>
              {/* Row 1: NOVA Group */}
              <View style={styles.metricBlock}>
                <Text style={styles.metricTitle}>Độ chế biến công nghiệp (NOVA)</Text>
                <View style={styles.metricValuesRow}>
                  <View style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricValue,
                        itemA.nova_group <= 2 ? styles.goodText : itemA.nova_group === 4 && styles.badText,
                      ]}
                    >
                      NOVA {itemA.nova_group}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricValue,
                        itemB.nova_group <= 2 ? styles.goodText : itemB.nova_group === 4 && styles.badText,
                      ]}
                    >
                      NOVA {itemB.nova_group}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 2: Child Safety */}
              <View style={styles.metricBlock}>
                <Text style={styles.metricTitle}>Độ an toàn cho trẻ nhỏ</Text>
                <View style={styles.metricValuesRow}>
                  <View style={styles.metricCell}>
                    {itemA.child_warning.is_safe_for_kids ? (
                      <View style={styles.inlineTag}>
                        <CheckCircle2 size={14} color="#22C55E" />
                        <Text style={styles.goodText}>An toàn</Text>
                      </View>
                    ) : (
                      <View style={styles.inlineTag}>
                        <AlertTriangle size={14} color="#EF4444" />
                        <Text style={styles.badText}>Hạn chế (&ge;{itemA.child_warning.min_recommended_age_years}t)</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    {itemB.child_warning.is_safe_for_kids ? (
                      <View style={styles.inlineTag}>
                        <CheckCircle2 size={14} color="#22C55E" />
                        <Text style={styles.goodText}>An toàn</Text>
                      </View>
                    ) : (
                      <View style={styles.inlineTag}>
                        <AlertTriangle size={14} color="#EF4444" />
                        <Text style={styles.badText}>Hạn chế (&ge;{itemB.child_warning.min_recommended_age_years}t)</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Row 3: Additives */}
              <View style={styles.metricBlock}>
                <Text style={styles.metricTitle}>Tổng số Phụ gia (E / INS)</Text>
                <View style={styles.metricValuesRow}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricValue}>{itemA.additives.length} chất</Text>
                    <Text style={styles.subMetric}>
                      ({hazardousCount(itemA)} chất cần lưu ý/tránh)
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricValue}>{itemB.additives.length} chất</Text>
                    <Text style={styles.subMetric}>
                      ({hazardousCount(itemB)} chất cần lưu ý/tránh)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 4: Hidden Sugars */}
              <View style={styles.metricBlock}>
                <Text style={styles.metricTitle}>Đường ẩn phát hiện</Text>
                <View style={styles.metricValuesRow}>
                  <View style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricValueSmall,
                        itemA.hidden_sugars_detected.length === 0 ? styles.goodText : styles.warnText,
                      ]}
                    >
                      {itemA.hidden_sugars_detected.length === 0
                        ? 'Không có'
                        : itemA.hidden_sugars_detected.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricValueSmall,
                        itemB.hidden_sugars_detected.length === 0 ? styles.goodText : styles.warnText,
                      ]}
                    >
                      {itemB.hidden_sugars_detected.length === 0
                        ? 'Không có'
                        : itemB.hidden_sugars_detected.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 5: Bad Fats */}
              <View style={[styles.metricBlock, { borderBottomWidth: 0 }]}>
                <Text style={styles.metricTitle}>Dầu chiên / Chất béo xấu</Text>
                <View style={styles.metricValuesRow}>
                  <View style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricValueSmall,
                        itemA.bad_fats_detected.length === 0 ? styles.goodText : styles.badText,
                      ]}
                    >
                      {itemA.bad_fats_detected.length === 0
                        ? 'Không có'
                        : itemA.bad_fats_detected.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text
                      style={[
                        styles.metricValueSmall,
                        itemB.bad_fats_detected.length === 0 ? styles.goodText : styles.badText,
                      ]}
                    >
                      {itemB.bad_fats_detected.length === 0
                        ? 'Không có'
                        : itemB.bad_fats_detected.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#1E293B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  winnerLabel: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  winnerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  colCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
  },
  colCardWinner: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  bestTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  bestTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#0F172A',
  },
  prodName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 36,
  },
  brandName: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  tableCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  metricBlock: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  metricTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricValueSmall: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  subMetric: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  inlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  goodText: {
    color: '#22C55E',
    fontWeight: '700',
    fontSize: 13,
  },
  warnText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },
  badText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
});

