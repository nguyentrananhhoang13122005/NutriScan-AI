import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { THEME } from '../constants/theme';
import { TrafficLightBadge } from '../components/TrafficLightBadge';
import { NovaBadge } from '../components/NovaBadge';
import { AdditiveItem } from '../components/AdditiveItem';
import { AlternativesCard } from '../components/AlternativesCard';
import { ShareCardModal } from '../components/ShareCardModal';
import {
  ArrowLeft,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Candy,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';

export const ResultScreen: React.FC = () => {
  const { currentScan, clearCurrentScan, activeProfile } = useAppStore();
  const [shareModalVisible, setShareModalVisible] = useState(false);

  if (!currentScan) return null;

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBtn} onPress={clearCurrentScan}>
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.navBtnText}>Quét lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => setShareModalVisible(true)}
        >
          <Share2 size={16} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>Tạo Thẻ Chia Sẻ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Identity */}
        <View style={styles.productHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentScan.category}</Text>
          </View>
          <Text style={styles.productTitle}>{currentScan.product_name}</Text>
          {currentScan.brand_name && (
            <Text style={styles.brandTitle}>Thương hiệu: {currentScan.brand_name}</Text>
          )}
        </View>

        {/* Score & Badges Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <TrafficLightBadge
              trafficLight={currentScan.traffic_light}
              score={currentScan.health_score}
              size="lg"
            />
          </View>
          <Text style={styles.summaryText}>{currentScan.summary}</Text>
          <View style={styles.novaWrapper}>
            <NovaBadge group={currentScan.nova_group} />
          </View>
        </View>

        {/* Child & Personal Alert Card */}
        {!currentScan.child_warning.is_safe_for_kids ? (
          <View style={styles.dangerAlertBox}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={18} color="#EF4444" />
              <Text style={styles.alertHeaderTitle}>CẢNH BÁO CHO TRẺ EM</Text>
            </View>
            <Text style={styles.alertBodyText}>
              {currentScan.child_warning.danger_reason}
            </Text>
            <Text style={styles.ageAdvice}>
              Khuyến nghị độ tuổi tối thiểu: Từ {currentScan.child_warning.min_recommended_age_years} tuổi trở lên
            </Text>
          </View>
        ) : (
          <View style={styles.safeAlertBox}>
            <View style={styles.alertHeader}>
              <CheckCircle2 size={18} color="#22C55E" />
              <Text style={[styles.alertHeaderTitle, { color: '#22C55E' }]}>
                AN TOÀN CHO TRẺ EM
              </Text>
            </View>
            <Text style={[styles.alertBodyText, { color: '#DCFCE7' }]}>
              {currentScan.child_warning.danger_reason}
            </Text>
          </View>
        )}

        {/* Hidden Sugars & Bad Fats Spotter */}
        {(currentScan.hidden_sugars_detected.length > 0 ||
          currentScan.bad_fats_detected.length > 0 ||
          currentScan.allergens_detected.length > 0) && (
          <View style={styles.spotterSection}>
            <Text style={styles.sectionTitle}>Chỉ số Cần Lưu Ý</Text>

            {/* Hidden Sugars */}
            {currentScan.hidden_sugars_detected.length > 0 && (
              <View style={styles.warningRow}>
                <Candy size={16} color="#F59E0B" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningLabel}>Đường ẩn phát hiện:</Text>
                  <Text style={styles.warningTags}>
                    {currentScan.hidden_sugars_detected.join(' • ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Bad Fats */}
            {currentScan.bad_fats_detected.length > 0 && (
              <View style={styles.warningRow}>
                <Flame size={16} color="#EF4444" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningLabel}>Dầu chiên / Chất béo xấu:</Text>
                  <Text style={styles.warningTags}>
                    {currentScan.bad_fats_detected.join(' • ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Allergens */}
            {currentScan.allergens_detected.length > 0 && (
              <View style={styles.warningRow}>
                <ShieldCheck size={16} color="#38BDF8" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningLabel}>Chất gây dị ứng:</Text>
                  <Text style={styles.warningTags}>
                    {currentScan.allergens_detected.join(', ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Healthy Alternatives / Swaps */}
        <AlternativesCard alternatives={currentScan.healthy_alternatives} />

        {/* Additives Breakdown List */}
        <View style={styles.additivesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Phụ gia & Hóa chất bóc tách ({currentScan.additives.length})
            </Text>
          </View>

          {currentScan.additives.length === 0 ? (
            <View style={styles.emptyAdditives}>
              <CheckCircle2 size={24} color="#10B981" />
              <Text style={styles.emptyAdditivesText}>
                Tuyệt vời! Không phát hiện phụ gia hóa chất tổng hợp nào.
              </Text>
            </View>
          ) : (
            currentScan.additives.map((additive, index) => (
              <AdditiveItem key={index} additive={additive} />
            ))
          )}
        </View>

        {/* Actionable Advice */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>💡 Khuyến nghị Khẩu phần:</Text>
          <Text style={styles.adviceBody}>{currentScan.actionable_advice}</Text>
        </View>

        {/* Medical Disclaimer */}
        <Text style={styles.disclaimerText}>
          ⚠️ Lưu ý: Kết quả phân tích mang tính tham khảo khoa học dựa trên tiêu chuẩn Codex & Bộ Y tế, không thay thế chẩn đoán hoặc phác đồ dinh dưỡng từ bác sĩ chuyên khoa.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Share Card Modal */}
      <ShareCardModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        scan={currentScan}
        profile={activeProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  navBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
  },
  productHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  categoryText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    marginBottom: 12,
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  novaWrapper: {
    width: '100%',
  },
  dangerAlertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 16,
  },
  safeAlertBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertHeaderTitle: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  alertBodyText: {
    color: '#FECACA',
    fontSize: 13,
    lineHeight: 18,
  },
  ageAdvice: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  spotterSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  warningContent: {
    flex: 1,
  },
  warningLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  warningTags: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  additivesSection: {
    marginBottom: 16,
  },
  emptyAdditives: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyAdditivesText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  adviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  adviceTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  adviceBody: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
