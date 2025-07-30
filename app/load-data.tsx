import { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

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

interface ExportData {
  exportDate: string;
  totalEntries: number;
  entries: RangeEntry[];
}

interface ImportData {
  exportDate?: string;
  totalEntries?: number;
  entries: RangeEntry[];
}

export default function LoadDataScreen() {
  console.log('LoadDataScreen rendered');

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadSampleData = async () => {
    console.log('Loading sample data...');
    
    const sampleEntries: RangeEntry[] = [
      {
        id: '1',
        entryName: 'Morning Practice Session',
        date: '2024-01-15',
        rifleName: 'Remington 700',
        rifleCalibber: '.308 Winchester',
        distance: '600 yards',
        elevationMOA: '8.5',
        windageMOA: '2.0',
        notes: 'Good conditions, light wind from the east',
        score: '47.3',
        shotScores: ['5', '4', 'v', '5', '4', 'v', '5', 'v', '4', '5'],
        bullGrainWeight: '168 gr',
        timestamp: Date.now() - 86400000
      },
      {
        id: '2',
        entryName: 'Competition Practice',
        date: '2024-01-20',
        rifleName: 'Tikka T3x',
        rifleCalibber: '6.5 Creedmoor',
        distance: '800 yards',
        elevationMOA: '12.0',
        windageMOA: '1.5',
        notes: 'Testing new load, excellent accuracy',
        score: '52.4',
        shotScores: ['5', 'v', '5', 'v', '5', 'v', '4', 'v', '5', '5', '4', '5'],
        bullGrainWeight: '140 gr',
        timestamp: Date.now() - 43200000
      }
    ];

    try {
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(sampleEntries));
      console.log('Sample data loaded successfully');
      Alert.alert('Success', 'Sample data has been loaded successfully!');
    } catch (error) {
      console.error('Error loading sample data:', error);
      Alert.alert('Error', 'Failed to load sample data');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all entries? This action cannot be undone.',
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

  const exportData = async () => {
    console.log('Starting export process...');
    setShowExportModal(true);
  };

  const performExport = async (exportType: 'share' | 'save') => {
    console.log(`Performing ${exportType} export...`);
    setLoading(true);
    
    try {
      const data = await AsyncStorage.getItem('rangeEntries');
      const entries: RangeEntry[] = data ? JSON.parse(data) : [];
      
      if (entries.length === 0) {
        Alert.alert('No Data', 'No entries found to export');
        setLoading(false);
        setShowExportModal(false);
        return;
      }

      // Process entries to include image data
      const processedEntries = await Promise.all(
        entries.map(async (entry) => {
          if (entry.targetImageUri) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(entry.targetImageUri);
              if (fileInfo.exists) {
                const base64 = await FileSystem.readAsStringAsync(entry.targetImageUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                return {
                  ...entry,
                  targetImageData: base64,
                  targetImageUri: undefined // Remove the local URI
                };
              }
            } catch (error) {
              console.error('Error reading image file:', error);
            }
          }
          return entry;
        })
      );

      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        totalEntries: processedEntries.length,
        entries: processedEntries
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `range_entries_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      console.log('Export file created:', fileUri);

      if (exportType === 'share') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Range Entries'
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        Alert.alert(
          'Export Complete',
          `Data exported successfully to ${fileName}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
      setShowExportModal(false);
    }
  };

  const selectAndImportJsonFile = async () => {
    console.log('Opening document picker for JSON import...');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected file:', file.name, file.uri);
        
        try {
          const fileContent = await FileSystem.readAsStringAsync(file.uri);
          await processJsonData(fileContent);
        } catch (error) {
          console.error('Error reading selected file:', error);
          Alert.alert('Error', 'Failed to read the selected file. Please ensure it is a valid JSON file.');
        }
      } else {
        console.log('File selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to open file picker');
    }
  };

  const processJsonData = async (jsonContent: string) => {
    console.log('Processing JSON data...');
    setLoading(true);
    
    try {
      const importData: ImportData = JSON.parse(jsonContent);
      
      if (!importData.entries || !Array.isArray(importData.entries)) {
        throw new Error('Invalid data format: entries array not found');
      }

      // Process entries to restore images
      const processedEntries = await Promise.all(
        importData.entries.map(async (entry: any) => {
          if (entry.targetImageData) {
            try {
              // Create photos directory if it doesn't exist
              const photosDir = FileSystem.documentDirectory + 'photos/';
              const dirInfo = await FileSystem.getInfoAsync(photosDir);
              if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
              }

              // Save the image data to a new file
              const timestamp = Date.now();
              const filename = `imported_target_${timestamp}.jpg`;
              const imageUri = photosDir + filename;
              
              await FileSystem.writeAsStringAsync(imageUri, entry.targetImageData, {
                encoding: FileSystem.EncodingType.Base64,
              });

              return {
                ...entry,
                targetImageUri: imageUri,
                targetImageData: undefined // Remove the base64 data
              };
            } catch (error) {
              console.error('Error restoring image:', error);
              return {
                ...entry,
                targetImageData: undefined
              };
            }
          }
          return entry;
        })
      );

      // Get existing entries
      const existingData = await AsyncStorage.getItem('rangeEntries');
      const existingEntries: RangeEntry[] = existingData ? JSON.parse(existingData) : [];
      
      // Merge with existing entries (avoid duplicates by ID)
      const existingIds = new Set(existingEntries.map(entry => entry.id));
      const newEntries = processedEntries.filter((entry: RangeEntry) => !existingIds.has(entry.id));
      
      const allEntries = [...existingEntries, ...newEntries];
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(allEntries));
      
      console.log(`Import successful: ${newEntries.length} new entries added`);
      Alert.alert(
        'Import Successful',
        `Successfully imported ${newEntries.length} new entries. ${processedEntries.length - newEntries.length} duplicate entries were skipped.`
      );
    } catch (error) {
      console.error('Error processing import data:', error);
      Alert.alert('Error', 'Failed to import data. Please check the file format.');
    } finally {
      setLoading(false);
      setShowImportModal(false);
      setImportText('');
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
  };

  const goBack = () => {
    console.log('Going back to home screen');
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Icon name="cloud" size={60} style={{ marginBottom: 10 }} />
          <Text style={commonStyles.title}>Backup/Restore</Text>
          <Text style={commonStyles.text}>
            Manage your range data
          </Text>
        </View>

        {/* Export Data Section */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Export Data
          </Text>
          <Text style={[commonStyles.text, { 
            textAlign: 'center', 
            marginBottom: 15,
            fontSize: 14,
            color: colors.grey
          }]}>
            Export your range entries to a JSON file that can be shared or saved for backup.
          </Text>
          <Button
            text="Export Data"
            onPress={exportData}
            style={buttonStyles.primary}
          />
        </View>

        {/* Import Data Section */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Import Data
          </Text>
          <Text style={[commonStyles.text, { 
            textAlign: 'center', 
            marginBottom: 15,
            fontSize: 14,
            color: colors.grey
          }]}>
            Import range entries from a previously exported JSON file.
          </Text>
          <Button
            text="Select JSON File"
            onPress={selectAndImportJsonFile}
            style={buttonStyles.accent}
          />
        </View>

        {/* Sample Data Section */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Sample Data
          </Text>
          <Text style={[commonStyles.text, { 
            textAlign: 'center', 
            marginBottom: 15,
            fontSize: 14,
            color: colors.grey
          }]}>
            Load sample range entries to test the app functionality.
          </Text>
          <Button
            text="Load Sample Data"
            onPress={loadSampleData}
            style={buttonStyles.secondary}
          />
        </View>

        {/* Clear Data Section */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Clear All Data
          </Text>
          <Text style={[commonStyles.text, { 
            textAlign: 'center', 
            marginBottom: 15,
            fontSize: 14,
            color: colors.grey
          }]}>
            Permanently delete all range entries. This action cannot be undone.
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

      {/* Export Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showExportModal}
        onRequestClose={closeExportModal}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 20,
            width: '90%',
            maxWidth: 400
          }}>
            <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 20 }]}>
              Export Options
            </Text>
            
            <Text style={[commonStyles.text, { 
              textAlign: 'center', 
              marginBottom: 20,
              fontSize: 14,
              color: colors.grey
            }]}>
              Choose how you want to export your data:
            </Text>

            <View style={{ gap: 10 }}>
              <Button
                text={loading ? "Exporting..." : "Share File"}
                onPress={() => performExport('share')}
                style={buttonStyles.primary}
              />
              
              <Button
                text={loading ? "Exporting..." : "Save to Device"}
                onPress={() => performExport('save')}
                style={buttonStyles.accent}
              />
              
              <Button
                text="Cancel"
                onPress={closeExportModal}
                style={buttonStyles.backButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}