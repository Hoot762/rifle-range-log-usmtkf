
import { Text, View, SafeAreaView, Image, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors, spacing, borderRadius, shadows, typography } from '../styles/commonStyles';
import { supabase } from './integrations/supabase/client';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  console.log('HomeScreen rendered');

  useEffect(() => {
    // Get current user info
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        console.log('Current user:', user.email);
      }
    };

    getCurrentUser();
  }, []);

  const navigateToAddEntry = () => {
    console.log('Navigating to add entry screen');
    router.push('/add-entry');
  };

  const navigateToViewEntries = () => {
    console.log('Navigating to view entries screen');
    router.push('/view-entries');
  };

  const navigateToLoadData = () => {
    console.log('Navigating to load data screen');
    router.push('/load-data');
  };

  const navigateToDopeCards = () => {
    console.log('DOPE button clicked - attempting navigation to dope-cards');
    try {
      router.push('/dope-cards');
      console.log('Navigation to dope-cards initiated successfully');
    } catch (error) {
      console.error('Error navigating to dope-cards:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('Signing out user');
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } else {
              console.log('Successfully signed out');
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.heroSection}>
            <View style={styles.targetImageContainer}>
              <Image 
                source={require('../assets/images/0c6f758e-3623-49b9-8253-850b43db8407.png')}
                style={styles.targetImage}
                resizeMode="cover"
              />
            </View>
            
            <Text style={styles.title}>Rifle Range Logger</Text>
            <Text style={styles.subtitle}>
              Track your rifle range data including scope settings, distances, and scores.
            </Text>

            {userEmail && (
              <View style={styles.userBadge}>
                <Text style={styles.userInfo}>
                  Welcome, {userEmail}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Main Actions Grid */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsGrid}>
            <View style={styles.actionCard}>
              <Icon name="add-circle" size={32} style={styles.actionIcon} />
              <Text style={styles.actionTitle}>Add Entry</Text>
              <Text style={styles.actionDescription}>Record new range session</Text>
              <Button
                text="Add New Entry"
                onPress={navigateToAddEntry}
                style={styles.actionButton}
              />
            </View>
            
            <View style={styles.actionCard}>
              <Icon name="list" size={32} style={styles.actionIcon} />
              <Text style={styles.actionTitle}>View Entries</Text>
              <Text style={styles.actionDescription}>Browse your sessions</Text>
              <Button
                text="View Entries"
                onPress={navigateToViewEntries}
                variant="secondary"
                style={styles.actionButton}
              />
            </View>
            
            <View style={styles.actionCard}>
              <Icon name="target" size={32} style={styles.actionIcon} />
              <Text style={styles.actionTitle}>DOPE Cards</Text>
              <Text style={styles.actionDescription}>Manage rifle data</Text>
              <Button
                text="DOPE Cards"
                onPress={navigateToDopeCards}
                style={[styles.actionButton, { backgroundColor: colors.dopeButton }]}
              />
            </View>
            
            <View style={styles.actionCard}>
              <Icon name="download" size={32} style={styles.actionIcon} />
              <Text style={styles.actionTitle}>Backup</Text>
              <Text style={styles.actionDescription}>Export & import data</Text>
              <Button
                text="Backup/Restore"
                onPress={navigateToLoadData}
                style={[styles.actionButton, { backgroundColor: colors.warning }]}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            text="Sign Out"
            onPress={handleLogout}
            variant="ghost"
            style={styles.signOutButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
  },
  targetImageContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.lg,
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  userBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  userInfo: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 0,
  },
  actionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  actionIcon: {
    marginBottom: spacing.md,
    color: colors.accent,
  },
  actionTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  actionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actionButton: {
    width: '100%',
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  signOutButton: {
    borderColor: colors.error,
    borderWidth: 1,
  },
});
