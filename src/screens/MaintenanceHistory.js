import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import { getMaintenanceHistory } from '../services/maintenanceHistory';
import HistoryCard from '../components/HistoryCard';

// Screen showing maintenance history for a specific item
const MaintenanceHistory = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const { item } = route.params;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [item.id]);

  const loadHistory = async () => {
    setLoading(true);
    const result = await getMaintenanceHistory(item.id);
    if (result.success) {
      setHistory(result.history);
    }
    setLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyHint: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    itemInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    itemName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    itemFrequency: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const totalCompletions = history.length;
  const nextDue = dayjs(item.lastMaintenanceDate).add(item.frequency, 'day');
  const daysUntilNext = nextDue.diff(dayjs(), 'day');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Item Info Header */}
        <View style={styles.itemInfo}>
          <View style={styles.itemIcon}>
            <Icon name="tool" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemFrequency}>
              {t('dashboard.frequency')} {item.frequency} {t('dashboard.days')}
            </Text>
          </View>
        </View>

        {/* Stats Card - Only Total Completions and Days Until Next */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCompletions}</Text>
              <Text style={styles.statLabel}>{t('history.totalCompletions')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                daysUntilNext < 0 && { color: colors.error },
                daysUntilNext >= 0 && daysUntilNext <= 7 && { color: colors.warning },
              ]}>
                {daysUntilNext < 0 ? Math.abs(daysUntilNext) : daysUntilNext}
              </Text>
              <Text style={styles.statLabel}>
                {daysUntilNext < 0 ? t('history.daysOverdue') : t('history.daysUntilNext')}
              </Text>
            </View>
          </View>
        </View>

        {/* History Section */}
        <Text style={styles.sectionTitle}>{t('history.timeline')}</Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon
              name="clock"
              size={48}
              color={colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>{t('history.noHistory')}</Text>
            <Text style={styles.emptyHint}>{t('history.noHistoryHint')}</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(historyItem) => historyItem.id}
            renderItem={({ item: record, index }) => (
              <HistoryCard
                record={record}
                isFirst={index === 0}
                onNoteUpdated={(recordId, newNote) => {
                  setHistory(prev =>
                    prev.map(h =>
                      h.id === recordId ? { ...h, notes: newNote } : h
                    )
                  );
                }}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MaintenanceHistory;
