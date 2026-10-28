import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from './src/store/useAppStore';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { THEME } from './src/constants/theme';
import { Camera, History, User } from 'lucide-react-native';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    isAnalyzing,
    currentScan,
    loadInitialData,
  } = useAppStore();

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Dynamic Screen Flow */}
        <View style={styles.mainContent}>
          {isAnalyzing ? (
            <AnalyzingScreen />
          ) : currentScan ? (
            <ResultScreen />
          ) : (
            <>
              {activeTab === 'scan' && <ScannerScreen />}
              {activeTab === 'history' && <HistoryScreen />}
              {activeTab === 'profile' && <ProfileScreen />}
            </>
          )}
        </View>

        {/* Bottom Tab Bar (Only visible when not analyzing and not in detailed result) */}
        {!isAnalyzing && !currentScan && (
          <View style={styles.tabBar}>
            {/* Tab 1: Scan */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('scan')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIconBox,
                  activeTab === 'scan' && styles.tabIconBoxActive,
                ]}
              >
                <Camera
                  size={20}
                  color={activeTab === 'scan' ? '#10B981' : '#94A3B8'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'scan' && styles.tabLabelActive,
                ]}
              >
                Quét Nhãn
              </Text>
            </TouchableOpacity>

            {/* Tab 2: History */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIconBox,
                  activeTab === 'history' && styles.tabIconBoxActive,
                ]}
              >
                <History
                  size={20}
                  color={activeTab === 'history' ? '#10B981' : '#94A3B8'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'history' && styles.tabLabelActive,
                ]}
              >
                Lịch Sử
              </Text>
            </TouchableOpacity>

            {/* Tab 3: Profile */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIconBox,
                  activeTab === 'profile' && styles.tabIconBoxActive,
                ]}
              >
                <User
                  size={20}
                  color={activeTab === 'profile' ? '#10B981' : '#94A3B8'}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'profile' && styles.tabLabelActive,
                ]}
              >
                Hồ Sơ
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mainContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
  },
  tabIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#10B981',
    fontWeight: '700',
  },
});
