import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Share } from 'react-native';
import { NutritionResult, UserProfile } from '../types/nutrition';
import { THEME } from '../constants/theme';
import { TrafficLightBadge } from './TrafficLightBadge';
import { X, Share2, ShieldAlert } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  scan: NutritionResult | null;
  profile: UserProfile | null;
}

export const ShareCardModal: React.FC<Props> = ({ visible, onClose, scan, profile }) => {
  if (!scan) return null;

  const handleShare = async () => {
    try {
      const statusEmoji =
        scan.traffic_light === 'GREEN' ? '🟢 AN TOÀN' : scan.traffic_light === 'YELLOW' ? '🟡 CẦN LƯU Ý' : '🔴 HẠN CHẾ DÙNG';
      const additivesList =
        scan.additives.length > 0
          ? scan.additives.map((a) => `${a.code} (${a.name})`).join(', ')
          : 'Không phát hiện phụ gia tổng hợp';

      const message = [
        `🥑 KẾT QUẢ SOI NHÃN NUTRISCAN AI`,
        `📦 Sản phẩm: ${scan.product_name}${scan.brand_name ? ` (${scan.brand_name})` : ''}`,
        `📊 Điểm sức khỏe: ${scan.health_score}/100 — ${statusEmoji} (NOVA ${scan.nova_group})`,
        `👶 Đánh giá: ${scan.child_warning.danger_reason}`,
        `🧪 Phụ gia (${scan.additives.length}): ${additivesList}`,
        `💡 Khuyến nghị: ${scan.actionable_advice}`,
      ].join('\n');

      await Share.share({
        title: `Đánh giá dinh dưỡng: ${scan.product_name}`,
        message,
      });
    } catch (e) {
      Alert.alert('Thông báo', 'Không thể mở bảng chia sẻ trên thiết bị này.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Thẻ Chia Sẻ Cảnh Báo (9:16)</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* The Share Card Itself */}
          <View style={styles.card}>
            {/* Branding Top */}
            <View style={styles.branding}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>🥑 NutriScan AI</Text>
              </View>
              <Text style={styles.scanDate}>
                {new Date(scan.timestamp).toLocaleDateString('vi-VN')}
              </Text>
            </View>

            {/* Product Title */}
            <Text style={styles.productName}>{scan.product_name}</Text>
            {scan.brand_name && <Text style={styles.brandName}>{scan.brand_name}</Text>}

            {/* Score & Traffic Light */}
            <View style={styles.scoreRow}>
              <TrafficLightBadge trafficLight={scan.traffic_light} score={scan.health_score} size="lg" />
            </View>

            {/* Child Warning Box if any */}
            {!scan.child_warning.is_safe_for_kids ? (
              <View style={styles.warningBox}>
                <View style={styles.warningHead}>
                  <ShieldAlert size={16} color="#EF4444" />
                  <Text style={styles.warningHeadText}>LƯU Ý ĐẶC BIỆT CHO TRẺ EM</Text>
                </View>
                <Text style={styles.warningReason}>{scan.child_warning.danger_reason}</Text>
              </View>
            ) : (
              <View style={styles.safeBox}>
                <Text style={styles.safeText}>✅ Đạt tiêu chuẩn an toàn dinh dưỡng cho trẻ nhỏ</Text>
              </View>
            )}

            {/* Key Additives flagged */}
            {scan.additives.length > 0 && (
              <View style={styles.additivesSummary}>
                <Text style={styles.additivesTitle}>Phụ gia phát hiện ({scan.additives.length} chất):</Text>
                <View style={styles.chipRow}>
                  {scan.additives.slice(0, 4).map((add, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chip,
                        add.risk_level === 'HAZARDOUS' && styles.chipDanger,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          add.risk_level === 'HAZARDOUS' && styles.chipTextDanger,
                        ]}
                      >
                        {add.code}
                      </Text>
                    </View>
                  ))}
                  {scan.additives.length > 4 && (
                    <Text style={styles.moreChip}>+{scan.additives.length - 4}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Footer Prompt */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerNote}>
                Quét nhanh bằng ứng dụng NutriScan AI • Vì sức khỏe gia đình
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Lưu & Chia Sẻ Ảnh Lên Zalo / Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#334155',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  branding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  logoText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '800',
  },
  scanDate: {
    color: '#94A3B8',
    fontSize: 11,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandName: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  scoreRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginVertical: 12,
  },
  warningHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningHeadText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  warningReason: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 16,
  },
  safeBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginVertical: 12,
    alignItems: 'center',
  },
  safeText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },
  additivesSummary: {
    marginTop: 8,
  },
  additivesTitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipDanger: {
    backgroundColor: '#EF4444',
  },
  chipText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextDanger: {
    color: '#FFFFFF',
  },
  moreChip: {
    color: '#94A3B8',
    fontSize: 11,
  },
  cardFooter: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  footerNote: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
  },
  shareBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
