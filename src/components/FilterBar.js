import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, getCategoryIcon, getCategoryColor } from '../constants/categories';

export const FilterBar = ({
  statusFilter,
  categoryFilter,
  onStatusFilterChange,
  onCategoryFilterChange,
  showCategories = false,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Status filters with translated labels
  const STATUS_FILTERS = [
    { id: 'all', label: t('dashboard.all'), icon: 'list' },
    { id: 'overdue', label: t('dashboard.overdue'), icon: 'alert-circle' },
    { id: 'soon', label: t('dashboard.dueSoon'), icon: 'clock' },
    { id: 'ok', label: t('dashboard.ok'), icon: 'check-circle' },
  ];

  const styles = StyleSheet.create({
    statusFilters: {
      flexDirection: 'row',
      marginBottom: showCategories ? 12 : 0,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    filterChipTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    categoryFilters: {
      marginBottom: 12,
    },
  });

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilters}
      >
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              statusFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => onStatusFilterChange(filter.id)}
          >
            <Icon
              name={filter.icon}
              size={16}
              color={statusFilter === filter.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilters}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              categoryFilter === null && styles.filterChipActive,
            ]}
            onPress={() => onCategoryFilterChange(null)}
          >
            <Icon
              name="grid"
              size={16}
              color={categoryFilter === null ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                categoryFilter === null && styles.filterChipTextActive,
              ]}
            >
              {t('dashboard.all')}
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                categoryFilter === category.id && styles.filterChipActive,
              ]}
              onPress={() => onCategoryFilterChange(category.id)}
            >
              <Icon
                name={getCategoryIcon(category.id)}
                size={16}
                color={categoryFilter === category.id ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === category.id && styles.filterChipTextActive,
                ]}
              >
                {t(`categories.${category.id}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
