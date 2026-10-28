import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NovaGroup } from '../types/nutrition';
import { THEME } from '../constants/theme';
import { Factory, Leaf, Sparkles, ChefHat } from 'lucide-react-native';

interface Props {
  group: NovaGroup;
}

export const NovaBadge: React.FC<Props> = ({ group }) => {
  let color = THEME.colors.novaGroup1;
  let title = 'NOVA 1: Tự nhiên';
  let desc = 'Nguyên bản hoặc chế biến tối thiểu';
  let Icon = Leaf;

  if (group === 2) {
    color = THEME.colors.novaGroup2;
    title = 'NOVA 2: Sơ chế';
    desc = 'Nguyên liệu nấu ăn qua xử lý nhẹ';
    Icon = ChefHat;
  } else if (group === 3) {
    color = THEME.colors.novaGroup3;
    title = 'NOVA 3: Đã chế biến';
    desc = 'Có thêm đường, muối hoặc dầu';
    Icon = Sparkles;
  } else if (group === 4) {
    color = THEME.colors.novaGroup4;
    title = 'NOVA 4: Siêu chế biến';
    desc = 'Nhiều phụ gia công nghiệp, ít dinh dưỡng gốc';
    Icon = Factory;
  }

  return (
    <View style={[styles.container, { borderColor: color, backgroundColor: `${color}15` }]}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Icon size={14} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  desc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
});
