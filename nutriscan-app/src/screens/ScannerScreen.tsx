import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store/useAppStore';
import {
  Camera as CameraIcon,
  Image as GalleryIcon,
  Zap,
  ZapOff,
  User,
  Sparkles,
  ShieldAlert,
  Barcode,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const RETICLE_WIDTH = width * 0.85;
const RETICLE_HEIGHT = RETICLE_WIDTH * 0.75;
const BARCODE_HEIGHT = RETICLE_WIDTH * 0.48;

export const ScannerScreen: React.FC = () => {
  const { activeProfile, startAnalyze, startBarcodeScan, setActiveTab } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanMode, setScanMode] = useState<'LABEL_AI' | 'BARCODE'>('LABEL_AI');
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const cameraRef = useRef<any>(null);

  // Mở thư viện chọn ảnh
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        startAnalyze(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Lỗi chọn ảnh:', e);
      Alert.alert('Thông báo', 'Không thể mở thư viện ảnh');
    }
  };

  // Xử lý khi quét trúng mã vạch ở chế độ Barcode
  const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (barcodeLocked || scanMode !== 'BARCODE') return;
    const code = scanningResult?.data;
    if (!code) return;

    setBarcodeLocked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const status = await startBarcodeScan(code);
    if (status === 'NOT_FOUND') {
      setScanMode('LABEL_AI');
      setBarcodeLocked(false);
      Alert.alert(
        'Chuyển sang Chụp Nhãn AI',
        `Mã vạch (${code}) chưa có trong bộ nhớ đệm. Đã chuyển sang chế độ Chụp Bảng Thành Phần — bạn hãy bấm nút chụp để AI đọc trực tiếp bao bì nhé!`
      );
    } else {
      setBarcodeLocked(false);
    }
  };

  // Chụp ảnh bằng Camera thật của thiết bị
  const handleCaptureRealPhoto = async () => {
    if (isCapturing) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (cameraRef.current) {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });

        setIsCapturing(false);
        if (photo?.uri) {
          startAnalyze(photo.uri);
          return;
        }
      }

      // Fallback nếu không có ref camera (ví dụ chạy giả lập trên web)
      const demoUri = 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800';
      startAnalyze(demoUri);
    } catch (err) {
      setIsCapturing(false);
      console.warn('Lỗi chụp ảnh camera thật, dùng fallback:', err);
      const demoUri = 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800';
      startAnalyze(demoUri);
    }
  };

  // Màn hình xin quyền Camera nếu chưa được cấp
  if (!permission) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.centerText}>Đang khởi động Camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ShieldAlert size={56} color="#EF4444" />
        <Text style={styles.permissionTitle}>Cần Cấp Quyền Camera</Text>
        <Text style={styles.permissionDesc}>
          NutriScan AI cần quyền truy cập Camera của bạn để chụp và đọc bảng thành phần trên bao bì thực phẩm.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Cho Phép Truy Cập Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
          <GalleryIcon size={18} color="#94A3B8" />
          <Text style={styles.secondaryBtnText}>Hoặc chọn ảnh từ thư viện</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 📷 CAMERA THẬT CHẠY TRỰC TIẾP TOÀN MÀN HÌNH */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={
          scanMode === 'BARCODE'
            ? {
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
              }
            : undefined
        }
        onBarcodeScanned={scanMode === 'BARCODE' && !barcodeLocked ? handleBarcodeScanned : undefined}
      />

      {/* LỚP PHỦ GIAO DIỆN (OVERLAY) */}
      <View style={styles.overlay}>
        {/* Top Area: Profile Badge, Flash & Mode Switcher */}
        <View>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.profileBadge}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              <View style={styles.profileIconCircle}>
                <User size={14} color="#10B981" />
              </View>
              <View>
                <Text style={styles.profileSub}>Đang quét cho</Text>
                <Text style={styles.profileName} numberOfLines={1}>
                  {activeProfile ? activeProfile.name : 'Chưa chọn'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flashButton}
              onPress={() => setFlashOn(!flashOn)}
            >
              {flashOn ? (
                <Zap size={20} color="#FBBF24" />
              ) : (
                <ZapOff size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Thanh chuyển đổi chế độ 2 trong 1: Chụp Nhãn AI vs Quét Mã Vạch */}
          <View style={styles.modeSwitchContainer}>
            <View style={styles.modeSwitchPill}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  scanMode === 'LABEL_AI' && styles.modeBtnActive,
                ]}
                onPress={() => {
                  setScanMode('LABEL_AI');
                  setBarcodeLocked(false);
                }}
              >
                <CameraIcon
                  size={14}
                  color={scanMode === 'LABEL_AI' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    scanMode === 'LABEL_AI' && styles.modeBtnTextActive,
                  ]}
                >
                  Chụp Thành Phần (AI)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  scanMode === 'BARCODE' && styles.modeBtnActive,
                ]}
                onPress={() => {
                  setScanMode('BARCODE');
                  setBarcodeLocked(false);
                }}
              >
                <Barcode
                  size={14}
                  color={scanMode === 'BARCODE' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    scanMode === 'BARCODE' && styles.modeBtnTextActive,
                  ]}
                >
                  Quét Mã Vạch
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Khung ngắm Reticle trong suốt nhìn thẳng ra camera thật */}
        <View style={styles.viewfinderContainer}>
          <View
            style={[
              styles.reticle,
              scanMode === 'BARCODE' && { height: BARCODE_HEIGHT },
            ]}
          >
            {/* 4 góc viền xanh */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {scanMode === 'BARCODE' ? (
              <View style={styles.barcodeGuideWrap}>
                <View style={styles.laserLine} />
                <View style={styles.guideBox}>
                  <Barcode size={22} color="#10B981" />
                  <Text style={styles.guideTitle}>Đưa Mã Vạch Vào Giữa Khung</Text>
                  <Text style={styles.guideSubtitle}>
                    Tự động nhận diện EAN-13 / UPC trong 0.5 giây
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.guideBox}>
                <CameraIcon size={24} color="#38BDF8" />
                <Text style={styles.guideTitle}>Bảng Thành Phần Thực Phẩm</Text>
                <Text style={styles.guideSubtitle}>
                  Căn chỉnh phần chữ thành phần nằm gọn trong khung
                </Text>
              </View>
            )}
          </View>

          {/* Lời khuyên khi chụp */}
          <View style={styles.scanTipPill}>
            <Sparkles size={14} color="#10B981" />
            <Text style={styles.scanTipText}>
              {scanMode === 'LABEL_AI'
                ? 'Chụp rõ chữ để AI đọc phụ gia & cảnh báo chính xác nhất'
                : 'Nếu mã vạch mới chưa có dữ liệu, App sẽ tự chuyển sang chụp AI'}
            </Text>
          </View>
        </View>

        {/* Nút Điều khiển dưới cùng */}
        <View style={styles.bottomControls}>
          {/* Nút thư viện ảnh */}
          <TouchableOpacity style={styles.iconBtn} onPress={pickImage}>
            <GalleryIcon size={24} color="#FFFFFF" />
            <Text style={styles.iconBtnLabel}>Chọn ảnh</Text>
          </TouchableOpacity>

          {/* Nút Bấm Chụp Camera Thật */}
          <TouchableOpacity
            style={styles.shutterOuter}
            activeOpacity={0.7}
            onPress={handleCaptureRealPhoto}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>

          {/* Nút đổi nhanh chế độ */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              setScanMode(scanMode === 'LABEL_AI' ? 'BARCODE' : 'LABEL_AI')
            }
          >
            {scanMode === 'LABEL_AI' ? (
              <>
                <Barcode size={24} color="#FFFFFF" />
                <Text style={styles.iconBtnLabel}>Mã vạch</Text>
              </>
            ) : (
              <>
                <CameraIcon size={24} color="#FFFFFF" />
                <Text style={styles.iconBtnLabel}>Chụp chữ</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'space-between',
  },
  centerBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  centerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 16,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  permissionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    zIndex: 10,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 10,
  },
  profileIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSub: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeSwitchContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  modeSwitchPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  modeBtnActive: {
    backgroundColor: '#10B981',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  reticle: {
    width: RETICLE_WIDTH,
    height: RETICLE_HEIGHT,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#10B981',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  barcodeGuideWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserLine: {
    position: 'absolute',
    width: '88%',
    height: 2,
    backgroundColor: '#EF4444',
    opacity: 0.85,
  },
  guideBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  guideTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  guideSubtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    textAlign: 'center',
  },
  scanTipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scanTipText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  iconBtn: {
    alignItems: 'center',
    gap: 4,
    width: 75,
  },
  iconBtnLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});
