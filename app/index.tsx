import { Text, View, SafeAreaView, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';

export default function HomeScreen() {
  console.log('HomeScreen rendered');

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
            />
          </View>
          
          <Text style={commonStyles.title}>Rifle Range Logger</Text>
          <Text style={commonStyles.text}>
            Track your rifle range data including scope settings, distances, and scores.
          </Text>
          
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
                text="Load Data"
                onPress={navigateToLoadData}
                style={buttonStyles.accent}
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
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
});