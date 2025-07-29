import { Text, View, SafeAreaView, ScrollView, Alert, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

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
  entries: Array<RangeEntry & { targetImageBase64?: string }>;
}

export default function ViewEntriesScreen() {
  console.log('ViewEntriesScreen rendered');

  const [entries, setEntries] = useState<RangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [fileName, setFileName] = useState('range_data_export');
  const [isExporting, setIsExporting] = useState(false);

  // Use useFocusEffect to reload entries whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, reloading entries...');
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    console.log('Loading entries...');
    try {
      const data = await AsyncStorage.getItem('rangeEntries');
      if (data) {
        const parsedEntries: RangeEntry[] = JSON.parse(data);
        parsedEntries.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(parsedEntries);
        console.log(`Loaded ${parsedEntries.length} entries`);
      } else {
        console.log('No entries found');
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const entryToDelete = entries.find(entry => entry.id === entryId);
              
              // Delete the associated image file if it exists
              if (entryToDelete?.targetImageUri) {
                try {
                  const fileInfo = await FileSystem.getInfoAsync(entryToDelete.targetImageUri);
                  if (fileInfo.exists) {
                    await FileSystem.deleteAsync(entryToDelete.targetImageUri);
                    console.log('Deleted image file:', entryToDelete.targetImageUri);
                  }
                } catch (error) {
                  console.error('Error deleting image file:', error);
                }
              }

              const updatedEntries = entries.filter(entry => entry.id !== entryId);
              await AsyncStorage.setItem('rangeEntries', JSON.stringify(updatedEntries));
              setEntries(updatedEntries);
              console.log('Entry deleted successfully');
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const editEntry = (entry: RangeEntry) => {
    console.log('Editing entry:', entry.id);
    router.push({
      pathname: '/add-entry',
      params: { 
        editMode: 'true',
        entryId: entry.id
      }
    });
  };

  const viewEntryDetails = (entry: RangeEntry) => {
    console.log('Viewing entry details for:', entry.id);
    router.push({
      pathname: '/entry-details',
      params: { entryId: entry.id }
    });
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
      if (!data || entries.length === 0) {
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

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const closeExportModal = () => {
    setExportModalVisible(false);
  };

  const goBack = () => {
    console.log('Going back to home screen');
    router.back();
  };

  const formatShotScores = (shotScores: string[]) => {
    return shotScores.map(score => score.toUpperCase()).join(', ');
  };

  const calculateShotStatistics = (scores: string[]) => {
    let vCount = 0;
    let vPoints = 0;
    scores.forEach(score => {
      if (score.toLowerCase().trim() === 'v') {
        vCount++;
        vPoints += 5;
      }
    });
    return { vCount, totalShots: scores.length, vPoints };
  };

  const EntryCard = ({ entry }: { entry: RangeEntry }) => {
    const shotStats = entry.shotScores ? calculateShotStatistics(entry.shotScores) : null;
    
    return (
      <TouchableOpacity 
        style={commonStyles.card}
        onPress={() => viewEntryDetails(entry)}
        activeOpacity={0.7}
      >
        {/* Entry name at the top, centered */}
        <Text style={[commonStyles.subtitle, { marginBottom: 16, textAlign: 'center' }]}>
          {entry.entryName || 'Unnamed Entry'}
        </Text>
        
        {/* All white text below, left aligned */}
        <Text style={[commonStyles.text, { textAlign: 'left' }]}>
          Rifle: {entry.rifleName} {entry.rifleCalibber ? `(${entry.rifleCalibber})` : ''}
        </Text>
        <Text style={[commonStyles.text, { textAlign: 'left' }]}>Date: {entry.date}</Text>
        <Text style={[commonStyles.text, { textAlign: 'left' }]}>Distance: {entry.distance}</Text>
        
        <View style={commonStyles.row}>
          <Text style={[commonStyles.text, { flex: 1, textAlign: 'left' }]}>
            Elevation: {entry.elevationMOA} MOA
          </Text>
          <Text style={[commonStyles.text, { flex: 1, textAlign: 'left' }]}>
            Windage: {entry.windageMOA} MOA
          </Text>
        </View>

        {entry.bullGrainWeight && (
          <Text style={[commonStyles.text, { textAlign: 'left' }]}>Bullet Grain Weight: {entry.bullGrainWeight}</Text>
        )}

        {entry.score && (
          <View style={{
            backgroundColor: colors.accent,
            borderRadius: 6,
            padding: 8,
            marginVertical: 8,
            alignItems: 'center'
          }}>
            <Text style={[commonStyles.text, { 
              color: colors.background, 
              fontWeight: 'bold',
              marginBottom: 0
            }]}>
              Score: {entry.score}
            </Text>
          </View>
        )}

        {entry.shotScores && entry.shotScores.length > 0 ? (
          <View style={{
            backgroundColor: colors.secondary,
            borderRadius: 6,
            padding: 8,
            marginVertical: 4
          }}>
            <Text style={[commonStyles.text, { 
              fontSize: 14, 
              marginBottom: 4,
              textAlign: 'center'
            }]}>
              Shot Scores ({entry.shotScores.length} shots{shotStats && shotStats.vCount > 0 ? `, ${shotStats.vCount} V-Bull (${shotStats.vPoints}pts)` : ''})
            </Text>
            <Text style={[commonStyles.text, { 
              fontSize: 12, 
              marginBottom: 0,
              textAlign: 'center'
            }]}>
              {formatShotScores(entry.shotScores)}
            </Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 6,
            padding: 8,
            marginVertical: 4,
            alignItems: 'center'
          }}>
            <Text style={[commonStyles.text, { 
              fontSize: 12, 
              fontStyle: 'italic',
              color: colors.grey,
              marginBottom: 0
            }]}>
              No individual shot scores recorded
            </Text>
          </View>
        )}

        {entry.targetImageUri && (
          <View style={{ marginVertical: 10 }}>
            <Text style={[commonStyles.text, { marginBottom: 8, textAlign: 'left' }]}>
              Target Photo:
            </Text>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                openImageModal(entry.targetImageUri!);
              }}
            >
              <Image 
                source={{ uri: entry.targetImageUri }} 
                style={{ 
                  width: '100%', 
                  height: 150, 
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: colors.border
                }} 
                resizeMode="cover"
              />
              <View style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: 4,
                padding: 4
              }}>
                <Icon name="expand" size={16} />
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Tap to view full details button */}
        <View style={{
          backgroundColor: colors.primary,
          borderRadius: 6,
          padding: 8,
          marginTop: 10,
          alignItems: 'center'
        }}>
          <Text style={[commonStyles.text, { 
            fontSize: 14, 
            marginBottom: 0,
            color: colors.text
          }]}>
            Tap to view full details
          </Text>
        </View>

        {/* Edit and Delete buttons moved underneath */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              editEntry(entry);
            }}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flex: 1,
              alignItems: 'center'
            }}
          >
            <Text style={[commonStyles.text, { fontSize: 12, marginBottom: 0, color: colors.background }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              deleteEntry(entry.id);
            }}
            style={{
              backgroundColor: colors.error,
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flex: 1,
              alignItems: 'center'
            }}
          >
            <Text style={[commonStyles.text, { fontSize: 12, marginBottom: 0 }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.wrapper}>
        <View style={commonStyles.container}>
          <Text style={commonStyles.text}>Loading entries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Icon name="list" size={60} style={{ marginBottom: 10 }} />
          <Text style={commonStyles.title}>Range Entries</Text>
          <Text style={commonStyles.text}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
          </Text>
        </View>

        {entries.length === 0 ? (
          <View style={commonStyles.card}>
            <Text style={[commonStyles.text, { textAlign: 'center' }]}>
              No entries found. Add your first range session!
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))
        )}

        {entries.length > 0 && (
          <View style={commonStyles.buttonContainer}>
            <Button
              text="Export Data"
              onPress={exportData}
              style={buttonStyles.accent}
            />
          </View>
        )}

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
                Export {entries.length} entries including target photos
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={closeImageModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TouchableOpacity 
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 20,
              padding: 10
            }}
            onPress={closeImageModal}
          >
            <Icon name="close" size={24} />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={{ 
                width: '90%', 
                height: '70%',
                borderRadius: 8
              }} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}