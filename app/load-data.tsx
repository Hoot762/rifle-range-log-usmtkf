import { useState } from 'react';
import Icon from '../components/Icon';
import { Text, View, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Button from '../components/Button';

interface RangeEntry {
  id: string;
  entryName: string; // Added entry name field
  date: string;
  rifleName: string;
  rifleCalibber: string;
  distance: string;
  elevationMOA: string;
  windageMOA: string;
  notes: string;
  score?: string;
  shotScores?: number[];
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
        entryName: 'Morning Practice Session',
        date: '2024-01-15',
        rifleName: 'Remington 700',
        rifleCalibber: '.308 Winchester',
        distance: '100 yards',
        elevationMOA: '2.5',
        windageMOA: '0.75',
        notes: 'Good conditions, light wind from the east',
        score: '95',
        bullGrainWeight: '168 gr',
        timestamp: Date.now() - 86400000, // 1 day ago
      },
      {
        id: '2',
        entryName: 'Competition Round 1',
        date: '2024-01-14',
        rifleName: 'AR-15 Custom',
        rifleCalibber: '5.56 NATO',
        distance: '200 yards',
        elevationMOA: '3.25',
        windageMOA: '1.0',
        notes: 'Competition day, moderate wind conditions',
        score: '88',
        bullGrainWeight: '77 gr',
        timestamp: Date.now() - 172800000, // 2 days ago
      }
    ];

    try {
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(sampleEntries));
      Alert.alert('Success', 'Sample data loaded successfully!');
      console.log('Sample data loaded');
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
      
      // Validate that it's an array
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'JSON data must be an array of entries');
        return;
      }

      // Add entryName field to entries that don't have it (for backward compatibility)
      const updatedData = parsedData.map((entry: any) => ({
        ...entry,
        entryName: entry.entryName || `Entry ${entry.rifleName || 'Unknown'}`,
      }));

      await AsyncStorage.setItem('rangeEntries', JSON.stringify(updatedData));
      Alert.alert('Success', `Loaded ${updatedData.length} entries successfully!`);
      setJsonInput('');
      console.log(`Loaded ${updatedData.length} entries from JSON`);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Alert.alert('Error', 'Invalid JSON format. Please check your data.');
    }
  };

  const clearAllData = async () => {
    console.log('Clearing all data...');
    
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
              Alert.alert('Success', 'All data cleared successfully!');
              console.log('All data cleared');
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
            Load some sample range entries to get started with the app.
          </Text>
          <Button
            text="Load Sample Data"
            onPress={loadSampleData}
            style={buttonStyles.accent}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Load from JSON</Text>
          <Text style={commonStyles.text}>
            Paste JSON data from a previous export to restore your entries.
          </Text>
          
          <Text style={commonStyles.label}>JSON Data:</Text>
          <TextInput
            style={[commonStyles.input, { 
              height: 120, 
              textAlignVertical: 'top',
              fontFamily: 'monospace',
              fontSize: 12
            }]}
            value={jsonInput}
            onChangeText={setJsonInput}
            placeholder="Paste your JSON data here..."
            placeholderTextColor={colors.grey}
            multiline
            returnKeyType="done"
          />
          
          <Button
            text="Load from JSON"
            onPress={loadFromJson}
            style={buttonStyles.primary}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Clear All Data</Text>
          <Text style={[commonStyles.text, { color: colors.error }]}>
            Warning: This will permanently delete all your range entries.
          </Text>
          <Button
            text="Clear All Data"
            onPress={clearAllData}
            style={[buttonStyles.backButton, { backgroundColor: colors.error }]}
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