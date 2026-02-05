import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import deleteItems from '../services/deleteItems';
import updateItems from '../services/updateItems';
import { updateNotifications } from '../services/notificationService';
import { addMaintenanceRecord } from '../services/maintenanceHistory';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { getCategoryIcon, getCategoryColor } from '../constants/categories';
import { useTranslation } from 'react-i18next';

const ItemDashboard = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [uid, setUid] = useState(null);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const navigation = useNavigation();

  // Get current user UID
  useEffect(() => {
    const user = auth().currentUser;
    if (user) setUid(user.uid);
  }, []);

  // Real-time listener for user items
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('items')
      .where('uid', '==', uid)
      .onSnapshot(snapshot => {
        const userItems = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const rawDate = data.lastMaintenanceDate;
          const jsDate = rawDate && rawDate.toDate ? rawDate.toDate() : rawDate;
          userItems.push({
            id: doc.id,
            ...data,
            lastMaintenanceDate: jsDate
          });
        });
        setItems(userItems);
      }, error => {
        // Error fetching items - handled silently
      });

    return unsubscribe;
  }, [uid]);

  // Calculate the next maintenance date of an item
  const nextMaintenanceDate = (item) => {
    const lastMaintenance = dayjs(item.lastMaintenanceDate);
    return lastMaintenance.add(item.frequency, 'day');
  };

  // Format maintenance date in human-readable format
  const formatMaintenanceDate = (item) => {
    const nextDate = nextMaintenanceDate(item);
    const daysUntil = nextDate.diff(dayjs(), 'day');

    if (daysUntil < 0) return t('dashboard.overdueBy', { days: Math.abs(daysUntil) });
    if (daysUntil === 0) return t('dashboard.dueToday');
    if (daysUntil === 1) return t('dashboard.dueTomorrow');
    if (daysUntil <= 7) return t('dashboard.dueInDays', { days: daysUntil });
    return nextDate.format('MMM D, YYYY');
  };

  // Get card styling based on urgency
  const getCardStyle = (item) => {
    const nextDate = nextMaintenanceDate(item);
    const daysUntil = nextDate.diff(dayjs(), 'day');

    if (daysUntil < 0) {
      return { borderLeftColor: colors.overdueBorder, backgroundColor: colors.overdueBackground };
    }
    if (daysUntil <= 7) {
      return { borderLeftColor: colors.soonBorder, backgroundColor: colors.soonBackground };
    }
    return { borderLeftColor: colors.normalBorder, backgroundColor: colors.normalBackground };
  };

  // Get status of an item (for filtering)
  const getItemStatus = (item) => {
    const nextDate = nextMaintenanceDate(item);
    const daysUntil = nextDate.diff(dayjs(), 'day');

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'soon';
    return 'ok';
  };

  // Filter and search items
  const filteredItems = useMemo(() => {
    let result = items;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => getItemStatus(item) === statusFilter);
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Sort by next maintenance date
    result.sort((a, b) => {
      const dateA = nextMaintenanceDate(a);
      const dateB = nextMaintenanceDate(b);
      return dateA.diff(dateB);
    });

    return result;
  }, [items, searchQuery, statusFilter, categoryFilter]);

  // Delete item
  const handleDeleteItem = (item) => {
    Alert.alert(
      t('dashboard.deleteItem'),
      t('dashboard.deleteConfirm', { name: item.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive', onPress: async () => {
            const result = await deleteItems(item.id);
            if (!result.success) {
              Alert.alert(t('common.error'), t('addItem.addError'));
            }
          }
        },
      ]
    );
  };

  // Edit item
  const handleEditItem = (item) => {
    navigation.navigate('AddItem', { item });
  };

  // Mark maintenance as complete - updates lastMaintenanceDate to today and records history
  const handleMarkComplete = (item) => {
    Alert.alert(
      t('dashboard.markComplete'),
      t('dashboard.markCompleteConfirm', { name: item.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('dashboard.markComplete'),
          onPress: async () => {
            try {
              const today = new Date();
              const result = await updateItems(item.id, {
                lastMaintenanceDate: today,
              });

              if (result.success) {
                // Record in maintenance history - ensure uid is available
                if (uid) {
                  const historyResult = await addMaintenanceRecord(item.id, uid, '');
                  if (!historyResult.success) {
                    // History recording failed but item was updated - continue
                  }
                }

                // Update notifications with new schedule
                try {
                  await updateNotifications({
                    ...item,
                    lastMaintenanceDate: today,
                  });
                } catch (notifError) {
                  // Notification update failed - non-critical
                }

                Alert.alert(
                  t('dashboard.maintenanceCompleted'),
                  t('dashboard.maintenanceCompletedMessage', {
                    name: item.name,
                    days: item.frequency,
                  })
                );
              } else {
                Alert.alert(t('common.error'), t('addItem.updateError'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('addItem.updateError'));
            }
          },
        },
      ]
    );
  };

  // View maintenance history for an item
  const handleViewHistory = (item) => {
    navigation.navigate('MaintenanceHistory', { item });
  };

  // Menu for Edit/Delete/Mark Complete/View History
  const showItemMenu = (item) => {
    Alert.alert(
      item.name,
      t('dashboard.selectAction'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('dashboard.markComplete'), onPress: () => handleMarkComplete(item) },
        { text: t('dashboard.viewHistory'), onPress: () => handleViewHistory(item) },
        { text: t('common.edit'), onPress: () => handleEditItem(item) },
        { text: t('common.delete'), style: 'destructive', onPress: () => handleDeleteItem(item) },
      ]
    );
  };

  // Find next maintenance item
  const nextMaintenanceItem = items.reduce((next, item) => {
    if (!next) return item;
    const itemNextDate = nextMaintenanceDate(item);
    const nextNextDate = nextMaintenanceDate(next);
    return itemNextDate.isBefore(nextNextDate) ? item : next;
  }, null);

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    summaryCard: {
      padding: 16,
      backgroundColor: colors.secondary,
      borderRadius: 8,
      marginBottom: 16
    },
    summaryText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    toggleCategoriesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginBottom: 12,
    },
    toggleCategoriesText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
      marginLeft: 4,
    },
    itemCard: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    itemName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginRight: 8,
    },
    categoryBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemDetail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    menuButton: {
      padding: 4,
    },
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    completeButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    addButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 30,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    addButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyHint: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Row - Title + History + Settings */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('dashboard.title')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('AllMaintenanceHistory')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="clock" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{t('dashboard.totalItems')} {items.length}</Text>
        {nextMaintenanceItem && (
          <Text style={styles.summaryText}>
            {t('dashboard.nextMaintenance')} {nextMaintenanceItem.name} – {formatMaintenanceDate(nextMaintenanceItem)}
          </Text>
        )}
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder={t('dashboard.searchPlaceholder')}
      />

      {/* Filter Bar */}
      <FilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        showCategories={showCategoryFilter}
      />

      {/* Toggle Category Filter */}
      <TouchableOpacity
        style={styles.toggleCategoriesButton}
        onPress={() => setShowCategoryFilter(!showCategoryFilter)}
      >
        <Icon
          name={showCategoryFilter ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.primary}
        />
        <Text style={styles.toggleCategoriesText}>
          {showCategoryFilter ? t('dashboard.hideCategories') : t('dashboard.showCategories')}
        </Text>
      </TouchableOpacity>

      {/* Item list */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all' || categoryFilter
                ? t('dashboard.noItemsMatch')
                : t('dashboard.noItemsYet')}
            </Text>
            <Text style={styles.emptyHint}>
              {searchQuery || statusFilter !== 'all' || categoryFilter
                ? t('dashboard.adjustFilters')
                : t('dashboard.tapToAdd')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { borderLeftWidth: 4, ...getCardStyle(item) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.category && (
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                      <Icon
                        name={getCategoryIcon(item.category)}
                        size={12}
                        color={getCategoryColor(item.category)}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.itemDetail}>{t('dashboard.last')} {dayjs(item.lastMaintenanceDate).format('MMM D, YYYY')}</Text>
                <Text style={styles.itemDetail}>{t('dashboard.nextLabel')} {formatMaintenanceDate(item)}</Text>
                <Text style={styles.itemDetail}>{t('dashboard.frequency')} {item.frequency} {t('dashboard.days')}</Text>
                {item.notes ? <Text style={styles.itemDetail}>{t('dashboard.notes')} {item.notes}</Text> : null}
                {/* Quick Mark Complete button for overdue or due soon items */}
                {(getItemStatus(item) === 'overdue' || getItemStatus(item) === 'soon') && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleMarkComplete(item)}
                  >
                    <Icon name="check-circle" size={14} color="white" />
                    <Text style={styles.completeButtonText}>{t('dashboard.markComplete')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => showItemMenu(item)} style={styles.menuButton}>
                <Icon name="more-vertical" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      </View>

      {/* Add Item button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddItem')}
      >
        <Text style={styles.addButtonText}>{t('dashboard.addItem')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ItemDashboard;

