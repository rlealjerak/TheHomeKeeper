import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getRecentMaintenance } from '../services/maintenanceHistory';
import { getCategoryIcon, getCategoryColor } from '../constants/categories';

dayjs.extend(relativeTime);

// Screen showing all maintenance history across all items
const AllMaintenanceHistory = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [history, setHistory] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalCompletions, setTotalCompletions] = useState(0);

  useEffect(() => {
    loadAllHistory();
  }, []);

  const loadAllHistory = async () => {
    setLoading(true);
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get all user's items first to map itemId to item data
      const itemsSnapshot = await firestore()
        .collection('items')
        .where('uid', '==', user.uid)
        .get();

      const itemsMap = {};
      itemsSnapshot.forEach(doc => {
        const data = doc.data();
        itemsMap[doc.id] = {
          id: doc.id,
          name: data.name,
          category: data.category,
          frequency: data.frequency,
        };
      });
      setItems(itemsMap);

      // Get all maintenance history (increased limit for all history)
      const result = await getRecentMaintenance(user.uid, 100);
      if (result.success) {
        setHistory(result.history);
        setTotalCompletions(result.history.length);
      }
    } catch (error) {
      // Error loading history
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
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 32,
      fontWeight: '700',
      color: 'white',
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 4,
      textAlign: 'center',
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
    historyCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    itemCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardDate: {
      alignItems: 'flex-end',
    },
    dateText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    timeAgo: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    notesContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    notesText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    checkBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    checkText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '500',
      marginLeft: 4,
    },
  });

  // Render a single history item with item info
  const renderHistoryItem = ({ item: record }) => {
    const itemData = items[record.itemId];
    if (!itemData) return null;

    const categoryColor = getCategoryColor(itemData.category);
    const categoryIcon = getCategoryIcon(itemData.category);
    const formattedDate = dayjs(record.completedAt).format('MMM D, YYYY');
    const timeAgo = dayjs(record.completedAt).fromNow();

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => navigation.navigate('MaintenanceHistory', { item: { ...itemData, lastMaintenanceDate: record.completedAt } })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '20' }]}>
            <Icon name={categoryIcon} size={18} color={categoryColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.itemName}>{itemData.name}</Text>
            <Text style={styles.itemCategory}>
              {t(`categories.${itemData.category}`) || itemData.category}
            </Text>
          </View>
          <View style={styles.cardDate}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>

        <View style={styles.checkBadge}>
          <Icon name="check-circle" size={14} color={colors.success} />
          <Text style={styles.checkText}>{t('history.completed')}</Text>
        </View>

        {record.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>
              "{record.notes}"
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCompletions}</Text>
              <Text style={styles.statLabel}>{t('history.allTotalCompletions')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.keys(items).length}</Text>
              <Text style={styles.statLabel}>{t('history.itemsTracked')}</Text>
            </View>
          </View>
        </View>

        {/* History Section */}
        <Text style={styles.sectionTitle}>{t('history.recentActivity')}</Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon
              name="clock"
              size={48}
              color={colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>{t('history.noHistory')}</Text>
            <Text style={styles.emptyHint}>{t('history.allNoHistoryHint')}</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default AllMaintenanceHistory;
