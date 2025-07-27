import { Text, View, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles } from '../styles/commonStyles';

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
          <Icon name="rifle" size={80} style={{ marginBottom: 20 }} />
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
                style={buttonStyles.accent}
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