import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { updateMaintenanceNote } from '../services/maintenanceHistory';

dayjs.extend(relativeTime);

// Card component displaying a single maintenance history entry with editable notes
const HistoryCard = ({ record, isFirst = false, onNoteUpdated }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(record.notes || '');
  const [saving, setSaving] = useState(false);

  const formattedDate = dayjs(record.completedAt).format('MMMM D, YYYY');
  const timeAgo = dayjs(record.completedAt).fromNow();

  // Save note to Firestore
  const handleSaveNote = async () => {
    if (saving) return;

    setSaving(true);
    const result = await updateMaintenanceNote(record.id, noteText);
    setSaving(false);

    if (result.success) {
      setIsEditing(false);
      // Notify parent to refresh if needed
      if (onNoteUpdated) {
        onNoteUpdated(record.id, noteText);
      }
      Alert.alert(t('history.noteUpdated'), t('history.noteUpdatedMessage'));
    } else {
      Alert.alert(t('common.error'), t('validation.unknownError'));
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setNoteText(record.notes || '');
    setIsEditing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    timeline: {
      width: 40,
      alignItems: 'center',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: isFirst ? colors.success : colors.border,
      borderWidth: 2,
      borderColor: isFirst ? colors.success : colors.border,
    },
    dotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'white',
    },
    line: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border,
      marginTop: 4,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isFirst ? colors.success + '40' : colors.border,
      marginLeft: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    dateContainer: {
      flex: 1,
    },
    date: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    timeAgo: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    checkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '500',
      marginLeft: 4,
    },
    notesSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    notesLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    notesTouchable: {
      minHeight: 40,
    },
    notes: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    noNotes: {
      fontSize: 14,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    editContainer: {
      marginTop: 8,
    },
    textInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
      gap: 8,
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    saveButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 14,
      color: 'white',
      fontWeight: '600',
      marginLeft: 4,
    },
    editIcon: {
      position: 'absolute',
      right: 0,
      top: 0,
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Timeline indicator */}
      <View style={styles.timeline}>
        <View style={[styles.dot, isFirst && { backgroundColor: colors.success }]}>
          {isFirst && <View style={styles.dotInner} />}
        </View>
        <View style={styles.line} />
      </View>

      {/* Card content */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
          <View style={styles.checkContainer}>
            <Icon name="check-circle" size={16} color={colors.success} />
            <Text style={styles.checkText}>{t('history.completed')}</Text>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.textInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t('history.notePlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                autoFocus
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSaveNote}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon name="check" size={14} color="white" />
                      <Text style={styles.saveButtonText}>{t('history.saveNote')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.notesTouchable}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.notesLabel}>
                  {record.notes ? t('history.editNote') : t('history.addNote')}
                </Text>
                <Icon name="edit-2" size={14} color={colors.textMuted} />
              </View>
              {record.notes ? (
                <Text style={styles.notes}>{record.notes}</Text>
              ) : (
                <Text style={styles.noNotes}>{t('history.noNotes')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default HistoryCard;
