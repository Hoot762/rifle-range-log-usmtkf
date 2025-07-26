import { useState } from 'react';
import Icon from '../components/Icon';
import { Text, View, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Button from '../components/Button';
import * as FileSystem from 'expo-file-system';

interface RangeEntry {
  id: string;
  entryName: string;
  date: string;
  rifleName: string;
  rifleCalibber: string;
  distance: string;
  elevationMOA: string;
  windageMOA: string;
  notes: string;
  score?: string;
  shotScores?: string[];
  bullGrainWeight?: string;
  targetImageUri?: string;
  timestamp: number;
}

interface ImportEntry extends RangeEntry {
  targetImageBase64?: string;
}

interface ImportData {
  exportDate?: string;
  totalEntries?: number;
  entries: ImportEntry[];
}

export default function LoadDataScreen() {
  console.log('LoadDataScreen rendered');

  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const saveBase64Image = async (base64Data: string, entryId: string): Promise<string> => {
    try {
      console.log(`Saving base64 image for entry: ${entryId}, data length: ${base64Data.length}`);
      
      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Invalid base64 data');
      }

      // Create photos directory if it doesn't exist
      const photosDir = FileSystem.documentDirectory + 'photos/';
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
        console.log('Created photos directory');
      }

      // Generate filename for the imported image
      const filename = `imported_${entryId}_${Date.now()}.jpg`;
      const destinationUri = photosDir + filename;

      // Clean the base64 data (remove any data URL prefix if present)
      let cleanBase64 = base64Data;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
      }

      // Save the base64 data as an image file
      await FileSystem.writeAsStringAsync(destinationUri, cleanBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify the file was created
      const fileInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!fileInfo.exists) {
        throw new Error('Failed to create image file');
      }

      console.log(`Image saved successfully to: ${destinationUri}, size: ${fileInfo.size} bytes`);
      return destinationUri;
    } catch (error) {
      console.error('Error saving base64 image:', error);
      throw error;
    }
  };

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
        timestamp: Date.now() - 86400000,
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
        timestamp: Date.now() - 172800000,
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

    setIsImporting(true);

    try {
      // First, validate that the JSON is parseable
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        Alert.alert('Error', 'Invalid JSON format. Please check your data and try again.');
        return;
      }
      
      let entriesToImport: ImportEntry[] = [];

      // Handle both old format (direct array) and new format (with metadata)
      if (Array.isArray(parsedData)) {
        entriesToImport = parsedData;
        console.log('Importing data in old format (direct array)');
      } else if (parsedData.entries && Array.isArray(parsedData.entries)) {
        entriesToImport = parsedData.entries;
        console.log(`Importing data in new format, exported on: ${parsedData.exportDate}`);
        console.log(`Expected entries: ${parsedData.totalEntries}, actual entries: ${entriesToImport.length}`);
      } else {
        Alert.alert('Error', 'Invalid JSON format. Expected an array of entries or export data object.');
        return;
      }

      if (entriesToImport.length === 0) {
        Alert.alert('Error', 'No entries found in the JSON data.');
        return;
      }

      console.log(`Processing ${entriesToImport.length} entries for import...`);

      // Process entries and handle images
      const processedEntries: RangeEntry[] = [];
      let imagesProcessed = 0;
      let imagesFailed = 0;

      for (let i = 0; i < entriesToImport.length; i++) {
        const entry = entriesToImport[i];
        console.log(`Processing entry ${i + 1}/${entriesToImport.length}: ${entry.entryName || entry.id}`);

        // Validate required fields
        if (!entry.id || !entry.rifleName || !entry.date) {
          console.log(`Skipping invalid entry: missing required fields`);
          continue;
        }

        const processedEntry: RangeEntry = {
          id: entry.id,
          entryName: entry.entryName || `Entry ${entry.rifleName || 'Unknown'}`,
          date: entry.date,
          rifleName: entry.rifleName,
          rifleCalibber: entry.rifleCalibber || '',
          distance: entry.distance || '',
          elevationMOA: entry.elevationMOA || '',
          windageMOA: entry.windageMOA || '',
          notes: entry.notes || '',
          timestamp: entry.timestamp || Date.now(),
          ...(entry.score && { score: entry.score }),
          ...(entry.shotScores && Array.isArray(entry.shotScores) && { shotScores: entry.shotScores }),
          ...(entry.bullGrainWeight && { bullGrainWeight: entry.bullGrainWeight })
        };

        // Handle image import
        if (entry.targetImageBase64) {
          try {
            console.log(`Importing image for entry: ${entry.entryName || entry.id}`);
            const savedImageUri = await saveBase64Image(entry.targetImageBase64, entry.id);
            processedEntry.targetImageUri = savedImageUri;
            imagesProcessed++;
            console.log(`Successfully imported image for entry: ${entry.entryName || entry.id}`);
          } catch (error) {
            console.error(`Failed to import image for entry ${entry.id}:`, error);
            imagesFailed++;
            // Continue without the image
            processedEntry.targetImageUri = undefined;
          }
        }

        processedEntries.push(processedEntry);
      }

      if (processedEntries.length === 0) {
        Alert.alert('Error', 'No valid entries found in the JSON data.');
        return;
      }

      // Get existing entries and merge
      const existingData = await AsyncStorage.getItem('rangeEntries');
      const existingEntries: RangeEntry[] = existingData ? JSON.parse(existingData) : [];
      
      // Combine existing and new entries, avoiding duplicates by ID
      const existingIds = new Set(existingEntries.map(entry => entry.id));
      const newEntries = processedEntries.filter(entry => !existingIds.has(entry.id));
      const duplicateCount = processedEntries.length - newEntries.length;
      
      if (newEntries.length === 0) {
        Alert.alert('Info', 'All entries in the JSON data already exist. No new entries were imported.');
        return;
      }

      const allEntries = [...existingEntries, ...newEntries];

      await AsyncStorage.setItem('rangeEntries', JSON.stringify(allEntries));
      
      let message = `Successfully imported ${newEntries.length} new entries`;
      if (imagesProcessed > 0) {
        message += ` with ${imagesProcessed} photos`;
      }
      if (imagesFailed > 0) {
        message += ` (${imagesFailed} photos failed to import)`;
      }
      if (duplicateCount > 0) {
        message += `. ${duplicateCount} duplicate entries were skipped`;
      }
      message += '!';
      
      Alert.alert('Success', message);
      setJsonInput('');
      console.log(`Import completed: ${newEntries.length} new entries, ${imagesProcessed} images processed, ${imagesFailed} images failed, ${duplicateCount} duplicates skipped`);
    } catch (error) {
      console.error('Error importing JSON:', error);
      Alert.alert('Error', 'Import failed. Please check your data and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const clearAllData = async () => {
    console.log('Clearing all data...');
    
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all range entries and photos? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage data
              await AsyncStorage.removeItem('rangeEntries');
              
              // Delete all photos in the photos directory
              const photosDir = FileSystem.documentDirectory + 'photos/';
              const dirInfo = await FileSystem.getInfoAsync(photosDir);
              if (dirInfo.exists) {
                await FileSystem.deleteAsync(photosDir);
                console.log('Deleted photos directory');
              }
              
              Alert.alert('Success', 'All data and photos cleared successfully!');
              console.log('All data and photos cleared');
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
          <Text style={commonStyles.subtitle}>Import from JSON</Text>
          <Text style={commonStyles.text}>
            Paste JSON data from a previous export to restore your entries and photos.
          </Text>
          
          {isImporting && (
            <View style={{ 
              backgroundColor: colors.secondary, 
              borderRadius: 8, 
              padding: 15, 
              marginBottom: 15,
              alignItems: 'center'
            }}>
              <Text style={[commonStyles.text, { 
                fontSize: 14, 
                color: colors.text,
                marginBottom: 0
              }]}>
                Importing data and photos... Please wait
              </Text>
            </View>
          )}
          
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
            placeholder="Paste your JSON export data here..."
            placeholderTextColor={colors.grey}
            multiline
            returnKeyType="done"
            editable={!isImporting}
          />
          
          <Button
            text={isImporting ? "Importing..." : "Import Data"}
            onPress={loadFromJson}
            style={[buttonStyles.primary, {
              opacity: isImporting ? 0.6 : 1
            }]}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Clear All Data</Text>
          <Text style={[commonStyles.text, { color: colors.error }]}>
            Warning: This will permanently delete all your range entries and photos.
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