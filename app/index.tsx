
import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, Image, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import Button from '../components/Button';
import { supabase } from './integrations/supabase/client';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('HomeScreen rendered');

  useEffect(() => {
    // Get current user info with error handling
    const getCurrentUser = async () => {
      try {
        console.log('Getting current user...');
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
        } else if (user) {
          setUserEmail(user.email);
          console.log('Current user:', user.email);
        } else {
          console.log('No user found');
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure everything is initialized
    setTimeout(getCurrentUser, 100);
  }, []);

  const navigateToAddEntry = () => {
    try {
      console.log('Navigating to add entry screen');
      router.push('/add-entry');
    } catch (error) {
      console.error('Error navigating to add-entry:', error);
      Alert.alert('Navigation Error', 'Failed to navigate to Add Entry screen');
    }
  };

  const navigateToViewEntries = () => {
    try {
      console.log('Navigating to view entries screen');
      router.push('/view-entries');
    } catch (error) {
      console.error('Error navigating to view-entries:', error);
      Alert.alert('Navigation Error', 'Failed to navigate to View Entries screen');
    }
  };

  const navigateToLoadData = () => {
    try {
      console.log('Navigating to load data screen');
      router.push('/load-data');
    } catch (error) {
      console.error('Error navigating to load-data:', error);
      Alert.alert('Navigation Error', 'Failed to navigate to Load Data screen');
    }
  };

  const navigateToDopeCards = () => {
    try {
      console.log('DOPE button clicked - attempting navigation to dope-cards');
      router.push('/dope-cards');
      console.log('Navigation to dope-cards initiated successfully');
    } catch (error) {
      console.error('Error navigating to dope-cards:', error);
      Alert.alert('Navigation Error', 'Failed to navigate to DOPE Cards screen');
    }
  };

  const handleLogout = async () => {
    try {
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
              try {
                console.log('Signing out user');
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error('Error signing out:', error);
                  Alert.alert('Error', 'Failed to sign out. Please try again.');
                } else {
                  console.log('Successfully signed out');
                  router.replace('/login');
                }
              } catch (error) {
                console.error('Error during logout:', error);
                Alert.alert('Error', 'An unexpected error occurred during logout');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing logout alert:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.wrapper}>
        <View style={commonStyles.container}>
          <View style={commonStyles.content}>
            <Text style={commonStyles.title}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  try {
    return (
    <SafeAreaView style={commonStyles.wrapper}>
      <View style={commonStyles.container}>
        <View style={commonStyles.content}>
          {/* Target image in circular container */}
          <View style={styles.targetImageContainer}>
            <Image 
              source={require('../assets/images/0c6f758e-3623-49b9-8253-850b43db8407.png')}
              style={styles.targetImage}
              resizeMode="cover"
              onError={(error) => {
                console.error('Image load error:', error);
              }}
              onLoad={() => console.log('Image loaded successfully')}
            />
          </View>
          
          <Text style={commonStyles.title}>Rifle Range Logger</Text>
          <Text style={commonStyles.text}>
            Track your rifle range data including scope settings, distances, and scores.
          </Text>

          {userEmail && (
            <Text style={styles.userInfo}>
              Welcome, {userEmail}
            </Text>
          )}
          
          <View style={commonStyles.section}>
            <View style={commonStyles.buttonContainer}>
              <Button
                text="Add New Entry"
                onPress={navigateToAddEntry}
                style={buttonStyles.primary}
              />
            </View>
            
            <View style={commonStyles.buttonContainer}>
              <Button
                text="View Entries"
                onPress={navigateToViewEntries}
                style={buttonStyles.secondary}
              />
            </View>
            
            <View style={commonStyles.buttonContainer}>
              <Button
                text="DOPE"
                onPress={navigateToDopeCards}
                style={buttonStyles.dopeButton}
                textStyle={{ color: colors.text }}
              />
            </View>
            
            <View style={commonStyles.buttonContainer}>
              <Button
                text="Backup/Restore"
                onPress={navigateToLoadData}
                style={buttonStyles.accent}
              />
            </View>

            <View style={commonStyles.buttonContainer}>
              <Button
                text="Sign Out"
                onPress={handleLogout}
                style={buttonStyles.backButton}
                textStyle={styles.logoutText}
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
    );
  } catch (error) {
    console.error('Error rendering HomeScreen:', error);
    return (
      <SafeAreaView style={commonStyles.wrapper}>
        <View style={commonStyles.container}>
          <View style={commonStyles.content}>
            <Text style={commonStyles.title}>Home Screen Error</Text>
            <Text style={commonStyles.text}>
              Something went wrong loading the home screen.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  targetImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: colors.border,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)',
    elevation: 6,
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 20,
    opacity: 0.8,
    textAlign: 'center',
  },
  logoutText: {
    color: colors.background,
  },
});
