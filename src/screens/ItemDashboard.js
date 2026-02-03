import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import deleteItems from '../services/deleteItems';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { getCategoryIcon, getCategoryColor } from '../constants/categories';

const ItemDashboard = () => {
  const { colors } = useTheme();
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
        console.error('Error fetching items in real-time:', error);
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

    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
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
      'Delete Item',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const result = await deleteItems(item.id);
            if (!result.success) {
              Alert.alert('Error', 'Failed to delete item. Please try again.');
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

  // Menu for Edit/Delete
  const showItemMenu = (item) => {
    Alert.alert(
      item.name,
      'Select an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditItem(item) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(item) },
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
      padding: 16,
      backgroundColor: colors.background,
    },
    settingsButton: {
      position: 'absolute',
      top: 60,
      right: 16,
      padding: 8,
      zIndex: 10,
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
      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Icon name="settings" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Total items: {items.length}</Text>
        {nextMaintenanceItem && (
          <Text style={styles.summaryText}>
            Next maintenance: {nextMaintenanceItem.name} – {formatMaintenanceDate(nextMaintenanceItem)}
          </Text>
        )}
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
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
          {showCategoryFilter ? 'Hide' : 'Show'} Categories
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
                ? 'No items match your filters'
                : 'No items yet'}
            </Text>
            <Text style={styles.emptyHint}>
              {searchQuery || statusFilter !== 'all' || categoryFilter
                ? 'Try adjusting your search or filters'
                : 'Tap + to add your first item'}
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
                <Text style={styles.itemDetail}>Last: {dayjs(item.lastMaintenanceDate).format('MMM D, YYYY')}</Text>
                <Text style={styles.itemDetail}>Next: {formatMaintenanceDate(item)}</Text>
                <Text style={styles.itemDetail}>Frequency: {item.frequency} days</Text>
                {item.notes ? <Text style={styles.itemDetail}>Notes: {item.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => showItemMenu(item)} style={styles.menuButton}>
                <Icon name="more-vertical" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Item button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddItem')}
      >
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ItemDashboard;

