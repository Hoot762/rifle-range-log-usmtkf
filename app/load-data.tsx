
import { useState } from 'react';
import Icon from '../components/Icon';
import { Text, View, SafeAreaView, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Button from '../components/Button';
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

interface ImportEntry extends RangeEntry {
  targetImageBase64?: string;
}

interface ImportData {
  exportDate?: string;
  totalEntries?: number;
  entries: ImportEntry[];
}

interface ExportData {
  exportDate: string;
  totalEntries: number;
  entries: Array<RangeEntry & { targetImageBase64?: string }>;
}

export default function LoadDataScreen() {
  console.log('LoadDataScreen rendered');

  const [isImporting, setIsImporting] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [fileName, setFileName] = useState('range_data_export');
  const [isExporting, setIsExporting] = useState(false);

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
        distance: '600 yards',
        elevationMOA: '2.5',
        windageMOA: '0.75',
        notes: 'Good conditions, light wind from the east',
        score: '43.5',
        bullGrainWeight: '155 gr',
        timestamp: Date.now() - 86400000,
      },
      {
        id: '2',
        entryName: 'Competition Round 1',
        date: '2024-01-14',
        rifleName: 'Remington 700',
        rifleCalibber: '.308 Winchester',
        distance: '600 yards',
        elevationMOA: '3.25',
        windageMOA: '1.0',
        notes: 'Competition day, moderate wind conditions',
        score: '44.6',
        bullGrainWeight: '155 gr',
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

  const selectAndImportJsonFile = async () => {
    console.log('Opening file picker for JSON import...');
    
    setIsImporting(true);

    try {
      // Open document picker to select JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('File selection cancelled by user');
        Alert.alert('Import Cancelled', 'No file was selected.');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('No file selected');
        Alert.alert('Error', 'No file was selected.');
        return;
      }

      const file = result.assets[0];
      console.log(`Selected file: ${file.name}, size: ${file.size} bytes`);

      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      console.log(`File content length: ${fileContent.length} characters`);

      // Parse and process the JSON data
      await processJsonData(fileContent);

    } catch (error) {
      console.error('Error selecting or reading file:', error);
      Alert.alert('Error', 'Failed to read the selected file. Please make sure it&apos;s a valid JSON file.');
    } finally {
      setIsImporting(false);
    }
  };

  const processJsonData = async (jsonContent: string) => {
    console.log('Processing JSON data...');
    
    try {
      // First, validate that the JSON is parseable
      let parsedData;
      try {
        parsedData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        Alert.alert('Error', 'Invalid JSON format. Please check your file and try again.');
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
        Alert.alert('Info', 'All entries in the JSON file already exist. No new entries were imported.');
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
      console.log(`Import completed: ${newEntries.length} new entries, ${imagesProcessed} images processed, ${imagesFailed} images failed, ${duplicateCount} duplicates skipped`);
    } catch (error) {
      console.error('Error processing JSON data:', error);
      Alert.alert('Error', 'Import failed. Please check your data and try again.');
    }
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('Converting image to base64:', imageUri);
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        console.log('Image file does not exist:', imageUri);
        return null;
      }

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64 || base64.length === 0) {
        console.log('Failed to read image as base64:', imageUri);
        return null;
      }

      console.log(`Successfully converted image to base64, length: ${base64.length}`);
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const exportData = async () => {
    console.log('Opening export options...');
    setExportModalVisible(true);
  };

  const performExport = async (exportType: 'share' | 'save') => {
    console.log(`Performing export with type: ${exportType}`);
    setIsExporting(true);
    
    try {
      const data = await AsyncStorage.getItem('rangeEntries');
      if (!data) {
        Alert.alert('No Data', 'No entries found to export');
        return;
      }

      const entries: RangeEntry[] = JSON.parse(data);
      if (entries.length === 0) {
        Alert.alert('No Data', 'No entries found to export');
        return;
      }

      console.log('Converting images to base64...');
      const entriesWithImages: Array<RangeEntry & { targetImageBase64?: string }> = [];
      let successfulImageConversions = 0;
      let failedImageConversions = 0;
      
      for (const entry of entries) {
        console.log(`Processing entry: ${entry.entryName || entry.id}`);
        
        // Create a clean copy of the entry without the local image URI
        const entryWithImage: RangeEntry & { targetImageBase64?: string } = {
          id: entry.id,
          entryName: entry.entryName,
          date: entry.date,
          rifleName: entry.rifleName,
          rifleCalibber: entry.rifleCalibber,
          distance: entry.distance,
          elevationMOA: entry.elevationMOA,
          windageMOA: entry.windageMOA,
          notes: entry.notes,
          timestamp: entry.timestamp,
          ...(entry.score && { score: entry.score }),
          ...(entry.shotScores && { shotScores: entry.shotScores }),
          ...(entry.bullGrainWeight && { bullGrainWeight: entry.bullGrainWeight })
        };
        
        if (entry.targetImageUri) {
          try {
            console.log(`Converting image for entry ${entry.id}: ${entry.targetImageUri}`);
            const fileInfo = await FileSystem.getInfoAsync(entry.targetImageUri);
            if (fileInfo.exists) {
              const base64 = await convertImageToBase64(entry.targetImageUri);
              if (base64) {
                entryWithImage.targetImageBase64 = base64;
                successfulImageConversions++;
                console.log(`Successfully converted image for entry ${entry.id}`);
              } else {
                console.log(`Failed to convert image for entry ${entry.id}`);
                failedImageConversions++;
              }
            } else {
              console.log(`Image file does not exist for entry ${entry.id}: ${entry.targetImageUri}`);
              failedImageConversions++;
            }
          } catch (error) {
            console.error(`Error processing image for entry ${entry.id}:`, error);
            failedImageConversions++;
          }
        }
        
        entriesWithImages.push(entryWithImage);
      }

      console.log(`Image conversion complete: ${successfulImageConversions} successful, ${failedImageConversions} failed`);

      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        totalEntries: entries.length,
        entries: entriesWithImages
      };

      // Validate the export data before stringifying
      try {
        const testJson = JSON.stringify(exportData);
        console.log(`Export JSON size: ${testJson.length} characters`);
        
        // Test parsing to ensure it's valid
        const testParse = JSON.parse(testJson);
        console.log('JSON validation successful');
      } catch (jsonError) {
        console.error('JSON validation failed:', jsonError);
        Alert.alert('Error', 'Failed to create valid JSON export. Please try again.');
        return;
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fullFileName = `${sanitizedFileName}.json`;

      if (exportType === 'share') {
        const fileUri = FileSystem.documentDirectory + fullFileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        console.log('File created at:', fileUri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Save Range Data Export'
          });
          console.log('File shared successfully');
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        const fileUri = FileSystem.documentDirectory + fullFileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        console.log('File created at:', fileUri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Save Range Data Export'
          });
          console.log('File save dialog opened');
        } else {
          Alert.alert('Error', 'File saving is not available on this device');
        }
      }

      setExportModalVisible(false);
      
      const imageMessage = successfulImageConversions > 0 
        ? ` with ${successfulImageConversions} photos`
        : '';
      const failureMessage = failedImageConversions > 0 
        ? ` (${failedImageConversions} photos failed to export)`
        : '';
      
      Alert.alert(
        'Export Complete',
        `Successfully exported ${entries.length} entries${imageMessage} to ${fullFileName}${failureMessage}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const closeExportModal = () => {
    setExportModalVisible(false);
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
          <Text style={commonStyles.subtitle}>Import from JSON File</Text>
          <Text style={commonStyles.text}>
            Select a JSON file from your device to restore your entries and photos. This file should be from a previous export.
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
          
          <Button
            text={isImporting ? "Importing..." : "Select JSON File"}
            onPress={selectAndImportJsonFile}
            style={[buttonStyles.primary, {
              opacity: isImporting ? 0.6 : 1
            }]}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Export Range Data</Text>
          <Text style={commonStyles.text}>
            Export all your range entries and photos to a JSON file that can be shared or saved to your device.
          </Text>
          <Button
            text="Export Data"
            onPress={exportData}
            style={buttonStyles.accent}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={exportModalVisible}
        onRequestClose={closeExportModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            borderWidth: 2,
            borderColor: colors.border
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Icon name="download" size={40} style={{ marginBottom: 10 }} />
              <Text style={[commonStyles.title, { fontSize: 20, marginBottom: 10 }]}>
                Export Data with Photos
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', color: colors.grey }]}>
                Export all entries including target photos
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={[commonStyles.text, { marginBottom: 8 }]}>
                File Name:
              </Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 0 }]}
                value={fileName}
                onChangeText={setFileName}
                placeholder="Enter file name"
                placeholderTextColor={colors.grey}
                editable={!isExporting}
              />
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                color: colors.grey, 
                marginTop: 4,
                marginBottom: 0 
              }]}>
                .json extension will be added automatically
              </Text>
            </View>

            {isExporting && (
              <View style={{ 
                backgroundColor: colors.secondary, 
                borderRadius: 8, 
                padding: 15, 
                marginBottom: 20,
                alignItems: 'center'
              }}>
                <Text style={[commonStyles.text, { 
                  fontSize: 14, 
                  color: colors.text,
                  marginBottom: 0
                }]}>
                  Converting photos... Please wait
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Button
                text={isExporting ? "Processing..." : "Share File"}
                onPress={() => performExport('share')}
                style={[buttonStyles.primary, { 
                  marginBottom: 10,
                  opacity: isExporting ? 0.6 : 1
                }]}
              />
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                color: colors.grey, 
                textAlign: 'center',
                marginBottom: 15
              }]}>
                Opens share dialog to save or send the file with photos
              </Text>

              <Button
                text={isExporting ? "Processing..." : "Save to Device"}
                onPress={() => performExport('save')}
                style={[buttonStyles.accent, {
                  opacity: isExporting ? 0.6 : 1
                }]}
              />
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                color: colors.grey, 
                textAlign: 'center',
                marginTop: 4,
                marginBottom: 0
              }]}>
                Choose where to save the file with photos on your device
              </Text>
            </View>

            <Button
              text="Cancel"
              onPress={closeExportModal}
              style={[buttonStyles.secondary, {
                opacity: isExporting ? 0.6 : 1
              }]}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
