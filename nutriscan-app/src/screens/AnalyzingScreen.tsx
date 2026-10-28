import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '../constants/theme';
import { Sparkles, Scan, ShieldCheck, HeartHandshake } from 'lucide-react-native';

const STEPS = [
  'Đang quét & bóc tách chữ từ bao bì...',
  'Đang tra cứu cơ sở dữ liệu phụ gia INS / E-code...',
  'Đang kiểm tra chỉ số an toàn cho trẻ nhỏ...',
  'Đang hoàn tất bảng khuyến nghị dinh dưỡng...',
];

const NUTRITION_TIPS = [
  '💡 Bạn có biết? Axit Citric (E330) là chất điều chua tự nhiên từ chanh, hoàn toàn an toàn cho bé.',
  '⚠️ Phẩm màu Tartrazine (E102) và Sunset Yellow (E110) có thể làm tăng mức độ hiếu động ở trẻ nhỏ.',
  '🌱 Nhóm thực phẩm NOVA 1 là thực phẩm tự nhiên tốt nhất cho sự phát triển của não bộ trẻ.',
  '🔍 Chú ý đường ẩn: Siro ngô cao Fructose (HFCS) và Maltodextrin thường làm bé nghiện ngọt.',
];

export const AnalyzingScreen: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tipIndex] = useState(() => Math.floor(Math.random() * NUTRITION_TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Radar Animation Center Box */}
      <View style={styles.radarWrapper}>
        <View style={styles.outerCircle}>
          <View style={styles.middleCircle}>
            <View style={styles.innerCircle}>
              <Scan size={36} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Pulsing indicator */}
        <ActivityIndicator size="large" color="#10B981" style={styles.loader} />
      </View>

      {/* Status Progress */}
      <View style={styles.statusBox}>
        <View style={styles.stepTitleRow}>
          <Sparkles size={16} color="#34D399" />
          <Text style={styles.stepTitle}>AI ĐANG PHÂN TÍCH</Text>
        </View>

        <Text style={styles.currentStepText}>{STEPS[currentStepIndex]}</Text>

        {/* 4 dots progress bar */}
        <View style={styles.progressBar}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStepIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Helpful Tip Footer */}
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>{NUTRITION_TIPS[tipIndex]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  radarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  loader: {
    position: 'absolute',
  },
  statusBox: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 1,
  },
  currentStepText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 44,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  progressDotActive: {
    backgroundColor: '#10B981',
  },
  tipCard: {
    marginTop: 48,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  tipText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
