import { Text, View, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  shotScores?: number[]; // Optional
  bullGrainWeight?: string;
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
        notes: 'Good conditions, light wind from the east',
        score: '95/100',
        shotScores: [9, 10, 8, 9, 10, 9, 8, 10, 9, 8],
        bullGrainWeight: '168 gr',
        timestamp: Date.now() - 86400000,
      },
      {
        id: '2',
        date: '2024-01-20',
        rifleName: 'AR-15 Custom',
        rifleCalibber: '5.56 NATO',
        distance: '200 yards',
        elevationMOA: '4.0',
        windageMOA: '1.25',
        notes: 'Windy conditions, had to adjust for crosswind',
        score: '87/100',
        bullGrainWeight: '77 gr',
        timestamp: Date.now() - 43200000,
      },
      {
        id: '3',
        date: '2024-01-25',
        rifleName: 'Savage 110',
        rifleCalibber: '.30-06 Springfield',
        distance: '300 yards',
        elevationMOA: '6.25',
        windageMOA: '0.5',
        notes: 'Perfect weather, excellent visibility',
        score: '92/100',
        shotScores: [8, 9, 10, 9, 8, 10, 9, 9],
        bullGrainWeight: '180 gr',
        timestamp: Date.now() - 21600000,
      }
    ];

    try {
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(sampleEntries));
      console.log('Sample data loaded successfully');
      Alert.alert('Success', 'Sample data loaded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
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
        `Loaded ${validEntries.length} entries from JSON data!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Alert.alert('Error', 'Invalid JSON format. Please check your data.');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all range entries? This cannot be undone.',
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
          <Text style={commonStyles.text}>
            Load sample range entries to test the app functionality.
          </Text>
          <Button
            text="Load Sample Data"
            onPress={loadSampleData}
            style={buttonStyles.primary}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Load from JSON</Text>
          <Text style={commonStyles.text}>
            Paste JSON data containing your range entries below:
          </Text>
          
          <TextInput
            style={[commonStyles.input, { 
              height: 120, 
              textAlignVertical: 'top',
              fontFamily: 'monospace',
              fontSize: 12
            }]}
            value={jsonInput}
            onChangeText={setJsonInput}
            placeholder='[{"id":"1","date":"2024-01-15","rifleName":"My Rifle",...}]'
            placeholderTextColor={colors.grey}
            multiline
          />
          
          <Button
            text="Load from JSON"
            onPress={loadFromJson}
            style={buttonStyles.accent}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Clear Data</Text>
          <Text style={commonStyles.text}>
            Remove all stored range entries from the app.
          </Text>
          <Button
            text="Clear All Data"
            onPress={clearAllData}
            style={buttonStyles.error}
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