import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { THEME } from '../constants/theme';
import { TrafficLightBadge } from '../components/TrafficLightBadge';
import { NutritionResult, TrafficLight } from '../types/nutrition';
import { Search, Trash2, Calendar, ChevronRight, Inbox } from 'lucide-react-native';

export const HistoryScreen: React.FC = () => {
  const { history, viewScanDetail, deleteHistoryItem, clearAllHistory, setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLight, setFilterLight] = useState<TrafficLight | 'ALL'>('ALL');

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

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => viewScanDetail(item)}
      >
        <View style={styles.cardMain}>
          <TrafficLightBadge trafficLight={item.traffic_light} score={item.health_score} size="sm" />

          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product_name}
            </Text>
            {item.brand_name && <Text style={styles.brandName}>{item.brand_name}</Text>}

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

        {/* Child warning badge if hazardous */}
        {!item.child_warning.is_safe_for_kids && (
          <View style={styles.childHazardBadge}>
            <Text style={styles.childHazardText}>⚠️ Không khuyến nghị cho trẻ nhỏ</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lịch Sử Quét</Text>
          <Text style={styles.headerSubtitle}>
            {history.length > 0
              ? `Đã lưu ${history.length} sản phẩm trên máy`
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
              Tất cả
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
              🟢 An toàn
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
              🟡 Lưu ý
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
              🔴 Cần tránh
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
    paddingBottom: 12,
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
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
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
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
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
    fontSize: 12,
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
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
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
    gap: 12,
  },
  deleteBtn: {
    padding: 6,
  },
  childHazardBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  childHazardText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
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
