import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { THEME } from '../constants/theme';
import { DEFAULT_PROFILES } from '../constants/mockData';
import {
  User,
  Baby,
  Heart,
  Shield,
  Check,
  AlertCircle,
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react-native';

const ALLERGY_OPTIONS = [
  'Đậu phộng',
  'Sữa (Lactose)',
  'Gluten (Lúa mì)',
  'Đậu nành',
  'Hải sản',
  'Trứng gà',
];

const CONCERN_OPTIONS = [
  'Tránh đường ẩn (HFCS, Maltodextrin)',
  'Giảm muối & Bột ngọt (E621)',
  'Tránh dầu cọ tinh luyện',
  'Tránh phẩm màu nhân tạo',
  'Hạn chế chất béo chuyển hóa (Trans-fat)',
];

const AGE_OPTIONS = [
  { label: 'Dưới 1 tuổi', value: 0.5 },
  { label: '1 - 3 tuổi', value: 2 },
  { label: '3 - 6 tuổi', value: 4 },
  { label: 'Trên 6 tuổi', value: 7 },
];

export const ProfileScreen: React.FC = () => {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    updateProfile,
    resetProfilesToDefault,
    clearAllHistory,
  } = useAppStore();

  const [customName, setCustomName] = useState(activeProfile?.name || '');

  React.useEffect(() => {
    if (activeProfile?.name) {
      setCustomName(activeProfile.name);
    }
  }, [activeProfile?.id, activeProfile?.name]);

  if (!activeProfile) return null;

  // Chuyển đổi đối tượng quét (Trẻ nhỏ / Người lớn / Mẹ bầu)
  const handleSelectTargetGroup = (group: 'CHILD' | 'ADULT' | 'PREGNANT') => {
    let matchedProfile = profiles.find((p) => p.target_group === group);

    if (matchedProfile) {
      setActiveProfile(matchedProfile.id);
      setCustomName(matchedProfile.name);
    } else {
      // Nếu chưa có, cập nhật hồ sơ hiện tại sang nhóm mới
      const defaultName =
        group === 'CHILD'
          ? 'Bé yêu (Trẻ nhỏ)'
          : group === 'PREGNANT'
          ? 'Mẹ bầu & Cho con bú'
          : 'Bản thân (Người lớn)';

      const updated = {
        ...activeProfile,
        target_group: group,
        name: defaultName,
        child_age_years: group === 'CHILD' ? (activeProfile.child_age_years || 2) : undefined,
        strict_child_mode: group === 'CHILD' || group === 'PREGNANT',
      };
      updateProfile(updated);
      setCustomName(defaultName);
    }
  };

  // Đổi độ tuổi cho bé
  const handleSelectAge = (ageYears: number) => {
    updateProfile({
      ...activeProfile,
      child_age_years: ageYears,
    });
  };

  // Cập nhật tên tùy chỉnh (biệt danh của bé hoặc tên người lớn)
  const handleSaveName = () => {
    const trimmed = customName.trim();
    if (trimmed && trimmed !== activeProfile.name) {
      updateProfile({
        ...activeProfile,
        name: trimmed,
      });
    }
  };

  const handleToggleAllergy = (allergy: string) => {
    const current = [...activeProfile.allergies];
    const index = current.indexOf(allergy);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(allergy);
    }
    updateProfile({ ...activeProfile, allergies: current });
  };

  const handleToggleConcern = (concern: string) => {
    const current = [...activeProfile.special_concerns];
    const index = current.indexOf(concern);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(concern);
    }
    updateProfile({ ...activeProfile, special_concerns: current });
  };

  const handleToggleStrictMode = (val: boolean) => {
    updateProfile({ ...activeProfile, strict_child_mode: val });
  };

  // Xóa toàn bộ lịch sử quét
  const handleClearHistory = () => {
    Alert.alert(
      'Xóa sạch lịch sử quét',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử quét trên thiết bị này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            Alert.alert('Thành công', 'Đã dọn sạch toàn bộ lịch sử quét.');
          },
        },
      ]
    );
  };

  // Đặt lại hồ sơ mặc định
  const handleResetDefaults = () => {
    Alert.alert(
      'Khôi phục mặc định',
      'Bạn có muốn đặt lại cấu hình cảnh báo và đối tượng về mặc định ban đầu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt lại',
          onPress: async () => {
            await resetProfilesToDefault();
            setCustomName(DEFAULT_PROFILES[0].name);
            Alert.alert('Hoàn tất', 'Đã khôi phục cài đặt mặc định.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ Sơ & Tiêu Chuẩn Quét</Text>
        <Text style={styles.headerSubtitle}>
          Cá nhân hóa cảnh báo phụ gia, dị ứng và chế độ bảo vệ sức khỏe
        </Text>
      </View>

      {/* Mục 1: Chọn Chế độ / Đối tượng đang quét */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chế Độ Quét & Đối Tượng Ưu Tiên</Text>

        <View style={styles.targetGrid}>
          {/* Card 1: Trẻ nhỏ */}
          <TouchableOpacity
            style={[
              styles.targetCard,
              activeProfile.target_group === 'CHILD' && styles.targetCardActive,
            ]}
            onPress={() => handleSelectTargetGroup('CHILD')}
            activeOpacity={0.7}
          >
            <View style={styles.targetHeader}>
              <View
                style={[
                  styles.targetIconBox,
                  activeProfile.target_group === 'CHILD' && styles.targetIconBoxActive,
                ]}
              >
                <Baby
                  size={22}
                  color={activeProfile.target_group === 'CHILD' ? '#10B981' : '#94A3B8'}
                />
              </View>
              {activeProfile.target_group === 'CHILD' && (
                <View style={styles.activeCheck}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.targetTitle,
                activeProfile.target_group === 'CHILD' && styles.targetTitleActive,
              ]}
            >
              Con nhỏ / Trẻ em
            </Text>
            <Text style={styles.targetSub}>
              Khắt khe với phẩm màu hóa học, phụ gia E-number & đường
            </Text>
          </TouchableOpacity>

          {/* Card 2: Bản thân / Người lớn */}
          <TouchableOpacity
            style={[
              styles.targetCard,
              activeProfile.target_group === 'ADULT' && styles.targetCardActive,
            ]}
            onPress={() => handleSelectTargetGroup('ADULT')}
            activeOpacity={0.7}
          >
            <View style={styles.targetHeader}>
              <View
                style={[
                  styles.targetIconBox,
                  activeProfile.target_group === 'ADULT' && styles.targetIconBoxActive,
                ]}
              >
                <User
                  size={22}
                  color={activeProfile.target_group === 'ADULT' ? '#10B981' : '#94A3B8'}
                />
              </View>
              {activeProfile.target_group === 'ADULT' && (
                <View style={styles.activeCheck}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.targetTitle,
                activeProfile.target_group === 'ADULT' && styles.targetTitleActive,
              ]}
            >
              Bản thân (Người lớn)
            </Text>
            <Text style={styles.targetSub}>
              Ăn lành mạnh, giảm đường ẩn, muối & dầu mỡ công nghiệp
            </Text>
          </TouchableOpacity>

          {/* Card 3: Mẹ bầu */}
          <TouchableOpacity
            style={[
              styles.targetCard,
              activeProfile.target_group === 'PREGNANT' && styles.targetCardActive,
            ]}
            onPress={() => handleSelectTargetGroup('PREGNANT')}
            activeOpacity={0.7}
          >
            <View style={styles.targetHeader}>
              <View
                style={[
                  styles.targetIconBox,
                  activeProfile.target_group === 'PREGNANT' && styles.targetIconBoxActive,
                ]}
              >
                <Heart
                  size={22}
                  color={activeProfile.target_group === 'PREGNANT' ? '#10B981' : '#94A3B8'}
                />
              </View>
              {activeProfile.target_group === 'PREGNANT' && (
                <View style={styles.activeCheck}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.targetTitle,
                activeProfile.target_group === 'PREGNANT' && styles.targetTitleActive,
              ]}
            >
              Mẹ bầu & Cho con bú
            </Text>
            <Text style={styles.targetSub}>
              Bảo vệ thai kỳ, loại trừ phụ gia chống chỉ định & cafein
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cấu hình chi tiết khi chọn Chế độ Trẻ nhỏ */}
        {activeProfile.target_group === 'CHILD' && (
          <View style={styles.childConfigBox}>
            <Text style={styles.subConfigLabel}>Độ tuổi của bé:</Text>
            <View style={styles.ageChipsRow}>
              {AGE_OPTIONS.map((opt) => {
                const isSelected =
                  (opt.value <= 1 && (activeProfile.child_age_years || 2) <= 1) ||
                  (opt.value > 1 && opt.value <= 3 && (activeProfile.child_age_years || 2) > 1 && (activeProfile.child_age_years || 2) <= 3) ||
                  (opt.value > 3 && opt.value <= 6 && (activeProfile.child_age_years || 2) > 3 && (activeProfile.child_age_years || 2) <= 6) ||
                  (opt.value > 6 && (activeProfile.child_age_years || 2) > 6);

                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.ageChip, isSelected && styles.ageChipActive]}
                    onPress={() => handleSelectAge(opt.value)}
                  >
                    <Text style={[styles.ageChipText, isSelected && styles.ageChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Đổi tên / biệt danh cho bé */}
            <View style={styles.nameRow}>
              <Text style={styles.nameInputLabel}>Tên / Biệt danh bé:</Text>
              <View style={styles.nameInputWrap}>
                <TextInput
                  style={styles.nameInput}
                  value={customName}
                  onChangeText={setCustomName}
                  onBlur={handleSaveName}
                  placeholder="Ví dụ: Bé Bo, Con yêu..."
                  placeholderTextColor="#64748B"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Mục 2: Chế độ Bảo vệ Trẻ em (Khắt khe) */}
      <View style={styles.section}>
        <View style={styles.toggleCard}>
          <View style={styles.toggleIconCircle}>
            <Shield size={20} color="#10B981" />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Chế độ Bảo vệ Nghiêm ngặt</Text>
            <Text style={styles.toggleSub}>
              Tự động cảnh báo đỏ và hạ điểm mạnh tay mọi món có phẩm màu nhân tạo (E102, E110, E129...), chất làm ngọt nhân tạo hoặc phụ gia có nguy cơ kích ứng.
            </Text>
          </View>
          <Switch
            value={activeProfile.strict_child_mode}
            onValueChange={handleToggleStrictMode}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Mục 3: Cảnh Báo Dị Ứng */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Cảnh Báo Dị Ứng (Tự động soi nhãn)</Text>
          <Text style={styles.sectionBadge}>
            {activeProfile.allergies.length > 0
              ? `${activeProfile.allergies.length} dị ứng đã chọn`
              : 'Chưa chọn'}
          </Text>
        </View>
        <Text style={styles.sectionDesc}>
          Nếu bao bì có chứa thành phần bạn chọn, NutriScan AI sẽ gióng chuông cảnh báo đỏ ngay trên đầu kết quả.
        </Text>
        <View style={styles.chipsWrap}>
          {ALLERGY_OPTIONS.map((allergy) => {
            const isSelected = activeProfile.allergies.includes(allergy);
            return (
              <TouchableOpacity
                key={allergy}
                style={[styles.chip, isSelected && styles.chipAllergySelected]}
                onPress={() => handleToggleAllergy(allergy)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {isSelected ? `⚠️ ${allergy}` : allergy}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Mục 4: Mối Quan Tâm Dinh Dưỡng */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Mối Quan Tâm Dinh Dưỡng Đặc Biệt</Text>
          <Text style={styles.sectionBadge}>
            {activeProfile.special_concerns.length > 0
              ? `${activeProfile.special_concerns.length} mục tiêu`
              : 'Chưa chọn'}
          </Text>
        </View>
        <View style={styles.chipsWrap}>
          {CONCERN_OPTIONS.map((concern) => {
            const isSelected = activeProfile.special_concerns.includes(concern);
            return (
              <TouchableOpacity
                key={concern}
                style={[styles.chip, isSelected && styles.chipConcernSelected]}
                onPress={() => handleToggleConcern(concern)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {isSelected ? `✓ ${concern}` : concern}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Mục 5: Quản lý dữ liệu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quản Lý Dữ Liệu</Text>
        <View style={styles.dataActionsBox}>
          <TouchableOpacity style={styles.actionRowBtn} onPress={handleClearHistory}>
            <View style={styles.actionIconBoxDanger}>
              <Trash2 size={16} color="#EF4444" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitleDanger}>Xóa toàn bộ lịch sử quét</Text>
              <Text style={styles.actionSub}>Dọn sạch danh sách các món ăn đã lưu trên máy</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionRowBtn} onPress={handleResetDefaults}>
            <View style={styles.actionIconBox}>
              <RotateCcw size={16} color="#94A3B8" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Khôi phục cài đặt hồ sơ mặc định</Text>
              <Text style={styles.actionSub}>Đặt lại đối tượng quét và bộ lọc dị ứng tiêu chuẩn</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mục 6: Tiêu chuẩn Khoa học & Công nghệ */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Sparkles size={18} color="#34D399" />
            <Text style={styles.infoTitle}>Tiêu Chuẩn Đánh Giá Khoa Học</Text>
          </View>
          <Text style={styles.infoDesc}>
            NutriScan AI tích hợp hệ thống kiểm duyệt dinh dưỡng đa tầng:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              🌿 <Text style={styles.boldText}>Chuẩn NOVA 1 - 4:</Text> Phân loại mức độ can thiệp công nghiệp và chế biến thực phẩm (Ultra-processed).
            </Text>
            <Text style={styles.bulletItem}>
              👶 <Text style={styles.boldText}>Tiêu chuẩn Nhi khoa Quốc tế:</Text> Bóc tách các chất bảo quản, phụ gia E/INS và phẩm màu ảnh hưởng hành vi, tiêu hóa của trẻ nhỏ.
            </Text>
            <Text style={styles.bulletItem}>
              ⚖️ <Text style={styles.boldText}>Thông tư 24/2019/TT-BYT:</Text> Đối chiếu danh mục và hàm lượng phụ gia được phép lưu hành tại Việt Nam.
            </Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <AlertCircle size={16} color="#64748B" />
        <Text style={styles.disclaimerText}>
          NutriScan AI v2.0 • Được thiết kế để bảo vệ sức khỏe cả gia đình.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionBadge: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  targetGrid: {
    gap: 10,
  },
  targetCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  targetCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetIconBoxActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  targetTitleActive: {
    color: '#FFFFFF',
  },
  targetSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  childConfigBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  subConfigLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  ageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ageChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  ageChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  ageChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  nameInputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  nameInputWrap: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    height: 36,
    justifyContent: 'center',
  },
  nameInput: {
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipAllergySelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipConcernSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dataActionsBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 14,
  },
  actionIconBoxDanger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitleDanger: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  actionTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  actionSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '800',
  },
  infoDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  boldText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});
