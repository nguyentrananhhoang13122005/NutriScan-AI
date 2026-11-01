import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { TrafficLightBadge } from '../components/TrafficLightBadge';
import { CompareModal } from '../components/CompareModal';
import { NutritionResult, TrafficLight } from '../types/nutrition';
import {
  Search,
  Trash2,
  Calendar,
  ChevronRight,
  Inbox,
  Scale,
  X,
} from 'lucide-react-native';

export const HistoryScreen: React.FC = () => {
  const {
    history,
    viewScanDetail,
    deleteHistoryItem,
    clearAllHistory,
    setActiveTab,
    compareItems,
    toggleCompareItem,
    clearCompareItems,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLight, setFilterLight] = useState<TrafficLight | 'ALL'>('ALL');
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // Thống kê tổng quan giỏ hàng (Health Insights)
  const totalCount = history.length;
  const greenCount = history.filter((i) => i.traffic_light === 'GREEN').length;
  const yellowCount = history.filter((i) => i.traffic_light === 'YELLOW').length;
  const redCount = history.filter((i) => i.traffic_light === 'RED').length;
  const avgScore =
    totalCount > 0
      ? Math.round(history.reduce((sum, item) => sum + item.health_score, 0) / totalCount)
      : 0;

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand_name && item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = filterLight === 'ALL' || item.traffic_light === filterLight;

    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc chắn muốn xóa "${name}" khỏi lịch sử?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteHistoryItem(id),
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Xóa toàn bộ lịch sử',
      'Bạn có chắc chắn muốn xóa toàn bộ danh sách sản phẩm đã lưu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa sạch',
          style: 'destructive',
          onPress: () => clearAllHistory(),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: NutritionResult }) => {
    const dateFormatted = new Date(item.timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isSelectedForCompare = compareItems.some((c) => c.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isSelectedForCompare && styles.cardCompareSelected]}
        activeOpacity={0.7}
        onPress={() => viewScanDetail(item)}
      >
        <View style={styles.cardMain}>
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.itemThumb} />
          ) : null}

          <TrafficLightBadge trafficLight={item.traffic_light} score={item.health_score} size="sm" />

          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product_name}
            </Text>
            {item.brand_name ? <Text style={styles.brandName}>{item.brand_name}</Text> : null}

            <View style={styles.dateRow}>
              <Calendar size={11} color="#64748B" />
              <Text style={styles.dateText}>{dateFormatted}</Text>
            </View>
          </View>

          <View style={styles.actionCol}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.product_name)}
            >
              <Trash2 size={16} color="#94A3B8" />
            </TouchableOpacity>
            <ChevronRight size={18} color="#64748B" />
          </View>
        </View>

        {/* Bottom row: Child Warning + Compare Button */}
        <View style={styles.cardFooterRow}>
          {!item.child_warning.is_safe_for_kids ? (
            <View style={styles.childHazardBadge}>
              <Text style={styles.childHazardText}>⚠️ Hạn chế cho trẻ nhỏ</Text>
            </View>
          ) : (
            <View style={styles.childSafeBadge}>
              <Text style={styles.childSafeText}>✅ An toàn cho bé</Text>
            </View>
          )}

          {totalCount >= 2 && (
            <TouchableOpacity
              style={[
                styles.compareChip,
                isSelectedForCompare && styles.compareChipActive,
              ]}
              onPress={() => toggleCompareItem(item)}
            >
              <Scale
                size={12}
                color={isSelectedForCompare ? '#FFFFFF' : '#38BDF8'}
              />
              <Text
                style={[
                  styles.compareChipText,
                  isSelectedForCompare && styles.compareChipTextActive,
                ]}
              >
                {isSelectedForCompare ? 'Đã chọn so sánh' : 'So sánh'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lịch Sử & Thống Kê</Text>
          <Text style={styles.headerSubtitle}>
            {history.length > 0
              ? `Đã lưu ${history.length} sản phẩm • Chọn 2 món để đặt lên bàn cân`
              : 'Chưa có sản phẩm nào'}
          </Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll}>
            <Trash2 size={14} color="#EF4444" />
            <Text style={styles.clearAllBtnText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 📊 BẢNG THỐNG KÊ SỨC KHỎE GIỎ HÀNG (HEALTH INSIGHTS) */}
      {history.length > 0 && (
        <View style={styles.insightsCard}>
          <View style={styles.insightScoreCol}>
            <Text style={styles.insightAvgValue}>{avgScore}</Text>
            <Text style={styles.insightAvgLabel}>Điểm TB</Text>
          </View>

          <View style={styles.insightDivider} />

          <View style={styles.insightBreakdown}>
            <View style={styles.insightStatItem}>
              <Text style={[styles.insightCount, { color: '#22C55E' }]}>{greenCount}</Text>
              <Text style={styles.insightStatLabel}>🟢 An toàn</Text>
            </View>
            <View style={styles.insightStatItem}>
              <Text style={[styles.insightCount, { color: '#F59E0B' }]}>{yellowCount}</Text>
              <Text style={styles.insightStatLabel}>🟡 Lưu ý</Text>
            </View>
            <View style={styles.insightStatItem}>
              <Text style={[styles.insightCount, { color: '#EF4444' }]}>{redCount}</Text>
              <Text style={styles.insightStatLabel}>🔴 Cần tránh</Text>
            </View>
          </View>
        </View>
      )}

      {/* Search Input */}
      {history.length > 0 && (
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Filter Tabs */}
      {history.length > 0 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterLight === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilterLight('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterLight === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              Tất cả ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterLight === 'GREEN' && styles.filterChipActive]}
            onPress={() => setFilterLight('GREEN')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterLight === 'GREEN' && styles.filterChipTextActive,
              ]}
            >
              🟢 Tốt ({greenCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterLight === 'YELLOW' && styles.filterChipActive]}
            onPress={() => setFilterLight('YELLOW')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterLight === 'YELLOW' && styles.filterChipTextActive,
              ]}
            >
              🟡 Lưu ý ({yellowCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterLight === 'RED' && styles.filterChipActive]}
            onPress={() => setFilterLight('RED')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterLight === 'RED' && styles.filterChipTextActive,
              ]}
            >
              🔴 Tránh ({redCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          compareItems.length > 0 && { paddingBottom: 90 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Inbox size={48} color="#475569" />
            <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
            <Text style={styles.emptySubtitle}>
              Khi bạn chụp ảnh hoặc quét mã vạch bao bì thực phẩm, kết quả phân tích sẽ tự động được lưu lại tại đây để tra cứu khi không có mạng.
            </Text>
            <TouchableOpacity
              style={styles.startScanBtn}
              onPress={() => setActiveTab('scan')}
            >
              <Text style={styles.startScanBtnText}>Quét Sản Phẩm Đầu Tiên Ngay</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Thanh nổi So sánh 2 sản phẩm (Floating Compare Bar) */}
      {compareItems.length > 0 && (
        <View style={styles.floatingCompareBar}>
          <View style={styles.floatingCompareInfo}>
            <Scale size={18} color="#34D399" />
            <Text style={styles.floatingCompareText} numberOfLines={1}>
              {compareItems.length === 1
                ? 'Đã chọn 1/2 món • Hãy chọn thêm 1 món nữa'
                : `Đã chọn 2/2 món sẵn sàng so sánh`}
            </Text>
          </View>

          <View style={styles.floatingCompareActions}>
            {compareItems.length === 2 && (
              <TouchableOpacity
                style={styles.compareNowBtn}
                onPress={() => setCompareModalVisible(true)}
              >
                <Text style={styles.compareNowBtnText}>So Sánh Ngay</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clearCompareBtn} onPress={clearCompareItems}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Compare Modal */}
      <CompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
        items={compareItems}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  clearAllBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  insightsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  insightScoreCol: {
    alignItems: 'center',
    paddingRight: 16,
  },
  insightAvgValue: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: '900',
  },
  insightAvgLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  insightDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#334155',
  },
  insightBreakdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 8,
  },
  insightStatItem: {
    alignItems: 'center',
  },
  insightCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  insightStatLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
    height: 42,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardCompareSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#0F172A',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  brandName: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    color: '#64748B',
    fontSize: 11,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    padding: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  childHazardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  childHazardText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
  },
  childSafeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  childSafeText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
  },
  compareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  compareChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  compareChipText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  compareChipTextActive: {
    color: '#FFFFFF',
  },
  floatingCompareBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingCompareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  floatingCompareText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  floatingCompareActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareNowBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  compareNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  clearCompareBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  startScanBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startScanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
