import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native';
import Icon from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import Button from '../components/Button';

interface RangeEntry {
  id: string;
  date: string;
  rifleName: string;
  rifleCalibber: string;
  distance: string;
  elevationMOA: string;
  windageMOA: string;
  notes: string;
  score?: string;
  targetImageUri?: string;
  timestamp: number;
}

export default function LoadDataScreen() {
  console.log('LoadDataScreen rendered');

  const [jsonInput, setJsonInput] = useState('');

  const loadSampleData = async () => {
    console.log('Loading sample data...');
    
    const sampleEntries: RangeEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        rifleName: 'Remington 700',
        rifleCalibber: '.308 Winchester',
        distance: '100 yards',
        elevationMOA: '2.5',
        windageMOA: '0.75',
        notes: 'Good grouping, slight wind from left',
        score: '95/100',
        timestamp: Date.now() - 86400000,
      },
      {
        id: '2',
        date: '2024-01-10',
        rifleName: 'AR-15',
        rifleCalibber: '5.56 NATO',
        distance: '200 yards',
        elevationMOA: '4.0',
        windageMOA: '1.25',
        notes: 'Testing new scope, need to adjust windage',
        score: '87/100',
        timestamp: Date.now() - 172800000,
      },
      {
        id: '3',
        date: '2024-01-05',
        rifleName: 'Savage 110',
        rifleCalibber: '.270 Winchester',
        distance: '300 yards',
        elevationMOA: '6.5',
        windageMOA: '0.5',
        notes: 'Long range practice, excellent conditions',
        score: '180/200',
        timestamp: Date.now() - 259200000,
      }
    ];

    try {
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(sampleEntries));
      console.log('Sample data loaded successfully');
      Alert.alert('Success', 'Sample data loaded successfully!');
    } catch (error) {
      console.error('Error loading sample data:', error);
      Alert.alert('Error', 'Failed to load sample data');
    }
  };

  const loadFromJson = async () => {
    console.log('Loading data from JSON input...');
    
    if (!jsonInput.trim()) {
      Alert.alert('Error', 'Please enter JSON data');
      return;
    }

    try {
      const parsedData = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'JSON data must be an array of entries');
        return;
      }

      // Validate the structure of each entry
      const validEntries = parsedData.filter(entry => {
        return entry.id && entry.date && entry.rifleName && 
               entry.distance && entry.elevationMOA && entry.windageMOA;
      });

      if (validEntries.length === 0) {
        Alert.alert('Error', 'No valid entries found in JSON data');
        return;
      }

      await AsyncStorage.setItem('rangeEntries', JSON.stringify(validEntries));
      console.log(`Loaded ${validEntries.length} entries from JSON`);
      
      Alert.alert(
        'Success', 
        `Loaded ${validEntries.length} entries from JSON data!`
      );
      setJsonInput('');
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Alert.alert('Error', 'Invalid JSON format. Please check your data.');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all range entries? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('rangeEntries');
              console.log('All data cleared');
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const goBack = () => {
    console.log('Going back to home screen');
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Icon name="download" size={60} style={{ marginBottom: 10 }} />
          <Text style={commonStyles.title}>Load Data</Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Sample Data</Text>
          <Text style={[commonStyles.text, { marginBottom: 15, textAlign: 'left' }]}>
            Load some sample range entries to get started with the app.
          </Text>
          <Button
            text="Load Sample Data"
            onPress={loadSampleData}
            style={buttonStyles.primary}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Import from JSON</Text>
          <Text style={[commonStyles.text, { marginBottom: 15, textAlign: 'left' }]}>
            Paste JSON data exported from another device or backup.
          </Text>
          
          <Text style={commonStyles.label}>JSON Data</Text>
          <TextInput
            style={[commonStyles.input, { height: 120, textAlignVertical: 'top' }]}
            value={jsonInput}
            onChangeText={setJsonInput}
            placeholder="Paste your JSON data here..."
            placeholderTextColor={colors.grey}
            multiline
          />
          
          <Button
            text="Import Data"
            onPress={loadFromJson}
            style={buttonStyles.accent}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Clear All Data</Text>
          <Text style={[commonStyles.text, { marginBottom: 15, textAlign: 'left' }]}>
            Remove all stored range entries from this device.
          </Text>
          <Button
            text="Clear All Data"
            onPress={clearAllData}
            style={buttonStyles.backButton}
          />
        </View>

        <View style={commonStyles.buttonContainer}>
          <Button
            text="Back"
            onPress={goBack}
            style={buttonStyles.backButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}