import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInput';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { normalizeUsername, isUsernameTaken } from '../services/usernameService';

// Edit Profile screen - allows users to update their information
const EditProfile = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [uid, setUid] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setUid(user.uid);
      setEmail(user.email || '');

      // Fetch user data from Firestore
      firestore()
        .collection('users')
        .doc(user.uid)
        .get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            setName(data.name || '');
            setLastName(data.lastName || '');
            setUsername(data.username || '');
            setOriginalUsername(data.username || '');
          }
        })
        .catch(error => {
          if (__DEV__) {
            console.error('[EditProfile] Failed to fetch user data:', error);
          }
        });
    }
  }, []);

  // Update profile information
  const handleUpdateProfile = async () => {
    const newUsernameNormalized = normalizeUsername(username);
    const currentUsernameNormalized = normalizeUsername(originalUsername);

    if (!name.trim() || !lastName.trim() || !newUsernameNormalized) {
      Alert.alert(t('validation.required'), t('validation.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      // Check if username is taken by another user (only if changed)
      if (newUsernameNormalized !== currentUsernameNormalized) {
        const taken = await isUsernameTaken(newUsernameNormalized);
        if (taken) {
          Alert.alert(t('validation.required'), t('validation.usernameTaken'));
          setLoading(false);
          return;
        }
      }

      // Update user document in Firestore
      await firestore().collection('users').doc(uid).update({
        name: name.trim(),
        lastName: lastName.trim(),
        username: newUsernameNormalized,
      });

      setOriginalUsername(newUsernameNormalized);
      setUsername(newUsernameNormalized);

      Alert.alert(t('editProfile.successTitle'), t('editProfile.successMessage'));
    } catch (error) {
      if (__DEV__) {
        console.error('[EditProfile] Update error:', error);
      }
      Alert.alert(t('editProfile.errorTitle'), t('editProfile.usernameError'));
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('validation.required'), t('validation.fillPasswordFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('validation.weakPassword'));
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);

      // Re-authenticate user
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);

      Alert.alert(t('common.success'), t('editProfile.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      let errorMessage = t('validation.unknownError');

      if (error.code === 'auth/wrong-password') {
        errorMessage = t('validation.currentPasswordWrong');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('validation.newPasswordWeak');
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('validation.recentLoginRequired');
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete account (GDPR compliance)
  const handleDeleteAccount = () => {
    Alert.alert(
      t('editProfile.deleteAccount'),
      t('editProfile.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('editProfile.deleteForever'),
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.prompt(
      t('editProfile.confirmDeletion'),
      t('editProfile.typeDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('editProfile.confirm'),
          style: 'destructive',
          onPress: async (text) => {
            if (text === 'DELETE' || text === 'ELIMINAR' || text === 'EXCLUIR' || text === 'SUPPRIMER') {
              await performAccountDeletion();
            } else {
              Alert.alert(t('editProfile.cancelled'), t('editProfile.pleaseTypeDelete'));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const performAccountDeletion = async () => {
    setLoading(true);
    try {
      const user = auth().currentUser;
      const usernameKey = normalizeUsername(originalUsername || username);

      // Delete user items from Firestore
      const itemsSnapshot = await firestore()
        .collection('items')
        .where('uid', '==', uid)
        .get();

      const batch = firestore().batch();
      itemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // Delete user document
      batch.delete(firestore().collection('users').doc(uid));

      // Delete username index
      if (usernameKey) {
        batch.delete(getUsernameDocRef(usernameKey));
      }

      await batch.commit();

      // Delete Firebase Auth account
      await user.delete();

      Alert.alert(t('editProfile.accountDeleted'), t('editProfile.accountDeletedMessage'));
    } catch (error) {
      let errorMessage = t('validation.unknownError');

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('validation.recentLoginRequired');
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    expandIcon: {
      fontSize: 24,
      color: colors.textSecondary,
      fontWeight: '300',
    },
    nameRow: {
      flexDirection: 'row',
    },
    nameGap: {
      width: 12,
    },
    halfInput: {
      flex: 1,
    },
    disabledInput: {
      backgroundColor: colors.border + '40',
      color: colors.textMuted,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: -12,
      marginBottom: 16,
    },
    saveButton: {
      marginTop: 8,
    },
    dangerSection: {
      borderColor: colors.error + '40',
    },
    dangerText: {
      color: colors.error,
    },
    dangerWarning: {
      fontSize: 14,
      color: colors.error,
      marginBottom: 16,
      lineHeight: 20,
    },
    deleteButton: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('editProfile.profileInfo')}</Text>

          <View style={styles.nameRow}>
            <TextInput
              label={t('editProfile.firstName')}
              value={name}
              onChangeText={setName}
              style={styles.halfInput}
            />
            <View style={styles.nameGap} />
            <TextInput
              label={t('editProfile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              style={styles.halfInput}
            />
          </View>

          <TextInput
            label={t('editProfile.username')}
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            autoCapitalize="none"
          />

          <TextInput
            label={t('editProfile.email')}
            value={email}
            editable={false}
            style={styles.disabledInput}
          />
          <Text style={styles.hint}>{t('editProfile.emailHint')}</Text>

          <Button
            title={t('editProfile.saveChanges')}
            onPress={handleUpdateProfile}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          />
        </View>

        {/* Change Password Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text style={styles.sectionTitle}>{t('editProfile.changePassword')}</Text>
            <Text style={styles.expandIcon}>{showPasswordSection ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <>
              <PasswordInput
                label={t('editProfile.currentPassword')}
                placeholder={t('editProfile.currentPasswordPlaceholder')}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <PasswordInput
                label={t('editProfile.newPassword')}
                placeholder={t('editProfile.newPasswordPlaceholder')}
                value={newPassword}
                onChangeText={setNewPassword}
                showStrength={true}
              />

              <PasswordInput
                label={t('editProfile.confirmPassword')}
                placeholder={t('editProfile.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Button
                title={t('editProfile.changePassword')}
                onPress={handleChangePassword}
                loading={loading}
                disabled={loading}
              />
            </>
          )}
        </View>

        {/* Delete Account Section */}
        <View style={[styles.section, styles.dangerSection]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowDeleteSection(!showDeleteSection)}
          >
            <Text style={[styles.sectionTitle, styles.dangerText]}>{t('editProfile.deleteAccount')}</Text>
            <Text style={styles.expandIcon}>{showDeleteSection ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showDeleteSection && (
            <>
              <Text style={styles.dangerWarning}>
                {t('editProfile.deleteWarning')}
              </Text>

              <Button
                title={t('editProfile.deleteMyAccount')}
                onPress={handleDeleteAccount}
                variant="secondary"
                style={styles.deleteButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;
