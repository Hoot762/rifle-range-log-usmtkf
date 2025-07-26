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
  timestamp: number;
}

export default function LoadDataScreen() {
  console.log('LoadDataScreen rendered');

  const [jsonData, setJsonData] = useState('');

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
        timestamp: Date.now() - 86400000,
      },
      {
        id: '2',
        date: '2024-01-20',
        rifleName: 'AR-15',
        rifleCalibber: '5.56 NATO',
        distance: '200 yards',
        elevationMOA: '4.0',
        windageMOA: '-0.5',
        notes: 'Adjusted for longer distance',
        timestamp: Date.now() - 43200000,
      },
      {
        id: '3',
        date: '2024-01-22',
        rifleName: 'Savage 110',
        rifleCalibber: '.270 Winchester',
        distance: '300 yards',
        elevationMOA: '6.25',
        windageMOA: '1.0',
        notes: 'Long range practice session',
        timestamp: Date.now(),
      },
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
    console.log('Loading data from JSON...');
    
    if (!jsonData.trim()) {
      Alert.alert('Error', 'Please enter JSON data to load');
      return;
    }

    try {
      const parsedData = JSON.parse(jsonData);
      
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'JSON data must be an array of entries');
        return;
      }

      // Validate the structure of each entry
      const validEntries = parsedData.filter((entry: any) => {
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
          <Text style={commonStyles.text}>
            Load sample data or import from JSON format
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Sample Data</Text>
          <Text style={commonStyles.text}>
            Load some sample range entries to get started with the app.
          </Text>
          <View style={commonStyles.buttonContainer}>
            <Button
              text="Load Sample Data"
              onPress={loadSampleData}
              style={buttonStyles.primary}
            />
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Import from JSON</Text>
          <Text style={commonStyles.text}>
            Paste JSON data below to import your range entries.
          </Text>
          
          <Text style={commonStyles.label}>JSON Data</Text>
          <TextInput
            style={[commonStyles.input, { height: 120, textAlignVertical: 'top' }]}
            value={jsonData}
            onChangeText={setJsonData}
            placeholder='[{"id":"1","date":"2024-01-15","rifleName":"Example Rifle",...}]'
            placeholderTextColor={colors.grey}
            multiline
          />
          
          <View style={commonStyles.buttonContainer}>
            <Button
              text="Import JSON Data"
              onPress={loadFromJson}
              style={buttonStyles.accent}
            />
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Clear Data</Text>
          <Text style={commonStyles.text}>
            Remove all stored range entries from the app.
          </Text>
          <View style={commonStyles.buttonContainer}>
            <Button
              text="Clear All Data"
              onPress={clearAllData}
              style={buttonStyles.backButton}
            />
          </View>
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