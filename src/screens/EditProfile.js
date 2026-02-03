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

// Edit Profile screen - allows users to update their information
const EditProfile = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [uid, setUid] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
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
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
        });
    }
  }, []);

  // Update profile information
  const handleUpdateProfile = async () => {
    if (!name.trim() || !lastName.trim() || !username.trim()) {
      Alert.alert('Required Fields', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // Check if username is taken by another user
      const usersRef = firestore().collection('users');
      const usernameQuery = await usersRef
        .where('username', '==', username)
        .limit(1)
        .get();

      if (!usernameQuery.empty && usernameQuery.docs[0].id !== uid) {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another.');
        setLoading(false);
        return;
      }

      // Update Firestore
      await firestore().collection('users').doc(uid).update({
        name,
        lastName,
        username,
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
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

      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to change password. Please try again.';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again before changing your password.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete account (GDPR compliance)
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.prompt(
      'Confirm Deletion',
      'Type DELETE to confirm account deletion:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async (text) => {
            if (text === 'DELETE') {
              await performAccountDeletion();
            } else {
              Alert.alert('Cancelled', 'Please type DELETE to confirm.');
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

      // Delete user items from Firestore
      const itemsSnapshot = await firestore()
        .collection('items')
        .where('uid', '==', uid)
        .get();

      const batch = firestore().batch();
      itemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Delete user document
      await firestore().collection('users').doc(uid).delete();

      // Delete Firebase Auth account
      await user.delete();

      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      let errorMessage = 'Failed to delete account. Please try again.';

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again before deleting your account.';
      }

      Alert.alert('Error', errorMessage);
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
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.nameRow}>
            <TextInput
              label="First Name"
              value={name}
              onChangeText={setName}
              style={styles.halfInput}
            />
            <View style={styles.nameGap} />
            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.halfInput}
            />
          </View>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            label="Email"
            value={email}
            editable={false}
            style={styles.disabledInput}
          />
          <Text style={styles.hint}>Email cannot be changed for security reasons.</Text>

          <Button
            title="Save Changes"
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
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Text style={styles.expandIcon}>{showPasswordSection ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <>
              <PasswordInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                showStrength={true}
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Button
                title="Change Password"
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
            <Text style={[styles.sectionTitle, styles.dangerText]}>Delete Account</Text>
            <Text style={styles.expandIcon}>{showDeleteSection ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showDeleteSection && (
            <>
              <Text style={styles.dangerWarning}>
                Warning: This action is permanent and cannot be undone. All your items and data will be deleted.
              </Text>

              <Button
                title="Delete My Account"
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
