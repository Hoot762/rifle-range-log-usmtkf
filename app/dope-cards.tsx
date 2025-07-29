import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

interface DOPECard {
  id: string;
  rifleName: string;
  caliber: string;
  ranges: {
    [range: string]: {
      elevation: string;
      windage: string;
    };
  };
  timestamp: number;
}

interface ExportData {
  exportDate: string;
  totalCards: number;
  cards: DOPECard[];
}

interface ImportData {
  exportDate?: string;
  totalCards?: number;
  cards: DOPECard[];
}

const RANGES = ['600', '700', '800', '900', '1000', '1100', '1200'];
const STORAGE_KEY = 'dope_cards';

export default function DopeCardsScreen() {
  console.log('DopeCardsScreen component rendered');

  const [dopeCards, setDopeCards] = useState<DOPECard[]>([]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<DOPECard | null>(null);
  const [rifleName, setRifleName] = useState('');
  const [caliber, setCaliber] = useState('');
  const [ranges, setRanges] = useState<{ [range: string]: { elevation: string; windage: string } }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [fileName, setFileName] = useState('dope_cards_export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    console.log('DopeCardsScreen useEffect running');
    loadDopeCards();
    initializeRanges();
  }, []);

  const initializeRanges = () => {
    console.log('Initializing ranges');
    const initialRanges: { [range: string]: { elevation: string; windage: string } } = {};
    RANGES.forEach(range => {
      initialRanges[range] = { elevation: '', windage: '' };
    });
    setRanges(initialRanges);
  };

  const loadDopeCards = async () => {
    try {
      console.log('Loading DOPE cards from storage');
      const storedCards = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedCards) {
        const parsedCards = JSON.parse(storedCards);
        setDopeCards(parsedCards);
        console.log('Loaded DOPE cards:', parsedCards.length);
      } else {
        console.log('No DOPE cards found in storage');
      }
    } catch (error) {
      console.error('Error loading DOPE cards:', error);
      Alert.alert('Error', 'Failed to load DOPE cards');
    }
  };

  const saveDopeCards = async (cards: DOPECard[]) => {
    try {
      console.log('Saving DOPE cards to storage');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      console.log('DOPE cards saved successfully');
    } catch (error) {
      console.error('Error saving DOPE cards:', error);
      Alert.alert('Error', 'Failed to save DOPE cards');
    }
  };

  const startAddingCard = () => {
    console.log('Starting to add new DOPE card');
    setIsAddingCard(true);
    setEditingCard(null);
    setRifleName('');
    setCaliber('');
    initializeRanges();
  };

  const startEditingCard = (card: DOPECard) => {
    console.log('Starting to edit DOPE card:', card.id);
    setEditingCard(card);
    setIsAddingCard(true);
    setRifleName(card.rifleName);
    setCaliber(card.caliber);
    setRanges(card.ranges);
  };

  const cancelEditing = () => {
    console.log('Cancelling DOPE card editing');
    setIsAddingCard(false);
    setEditingCard(null);
    setRifleName('');
    setCaliber('');
    initializeRanges();
  };

  const saveCard = async () => {
    if (!rifleName.trim() || !caliber.trim()) {
      Alert.alert('Error', 'Please enter rifle name and caliber');
      return;
    }

    console.log('Saving DOPE card');
    const newCard: DOPECard = {
      id: editingCard ? editingCard.id : Date.now().toString(),
      rifleName: rifleName.trim(),
      caliber: caliber.trim(),
      ranges: ranges,
      timestamp: Date.now()
    };

    let updatedCards: DOPECard[];
    if (editingCard) {
      updatedCards = dopeCards.map(card => card.id === editingCard.id ? newCard : card);
      console.log('Updated existing DOPE card');
    } else {
      updatedCards = [...dopeCards, newCard];
      console.log('Added new DOPE card');
    }

    setDopeCards(updatedCards);
    await saveDopeCards(updatedCards);
    cancelEditing();
    Alert.alert('Success', `DOPE card ${editingCard ? 'updated' : 'saved'} successfully`);
  };

  const confirmDeleteCard = (cardId: string) => {
    console.log('Confirming delete for DOPE card:', cardId);
    setShowDeleteConfirm(cardId);
  };

  const deleteCard = async (cardId: string) => {
    console.log('Deleting DOPE card:', cardId);
    const updatedCards = dopeCards.filter(card => card.id !== cardId);
    setDopeCards(updatedCards);
    await saveDopeCards(updatedCards);
    setShowDeleteConfirm(null);
    Alert.alert('Success', 'DOPE card deleted successfully');
  };

  // Helper function to extract numeric value from MOA string
  const extractNumericValue = (value: string): string => {
    if (!value) return '';
    // Remove 'MOA' and any extra spaces, keep only numbers, decimal points, and minus signs
    return value.replace(/\s*MOA\s*$/i, '').replace(/[^0-9.-]/g, '');
  };

  // Helper function to format value with MOA suffix
  const formatWithMOA = (value: string): string => {
    const numericValue = extractNumericValue(value);
    if (!numericValue || numericValue === '' || numericValue === '-') {
      return numericValue;
    }
    return `${numericValue} MOA`;
  };

  // Helper function to validate numeric input
  const isValidNumericInput = (value: string): boolean => {
    if (!value) return true;
    // Allow numbers, decimal points, and minus signs
    const numericPattern = /^-?\d*\.?\d*$/;
    return numericPattern.test(value);
  };

  const handleMOAInputChange = (range: string, field: 'elevation' | 'windage', value: string) => {
    console.log(`Handling MOA input change for ${range} ${field}:`, value);
    
    // Extract numeric part from the input
    const numericValue = extractNumericValue(value);
    
    // Validate that it's a valid numeric input
    if (!isValidNumericInput(numericValue)) {
      console.log('Invalid numeric input, ignoring');
      return;
    }

    // Format the value with MOA suffix if there's a numeric value
    const formattedValue = formatWithMOA(numericValue);
    console.log('Formatted value:', formattedValue);

    // Update the state
    setRanges(prev => ({
      ...prev,
      [range]: {
        ...prev[range],
        [field]: formattedValue
      }
    }));
  };

  const updateRange = (range: string, field: 'elevation' | 'windage', value: string) => {
    handleMOAInputChange(range, field, value);
  };

  const clearField = (range: string, field: 'elevation' | 'windage') => {
    console.log(`Clearing ${field} field for range ${range}`);
    setRanges(prev => ({
      ...prev,
      [range]: {
        ...prev[range],
        [field]: ''
      }
    }));
  };

  const exportData = async () => {
    console.log('Opening export options...');
    setExportModalVisible(true);
  };

  const performExport = async (exportType: 'share' | 'save') => {
    console.log(`Performing export with type: ${exportType}`);
    setIsExporting(true);
    
    try {
      if (dopeCards.length === 0) {
        Alert.alert('No Data', 'No DOPE cards found to export');
        return;
      }

      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        totalCards: dopeCards.length,
        cards: dopeCards
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

      const fileUri = FileSystem.documentDirectory + fullFileName;
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      console.log('File created at:', fileUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: exportType === 'share' ? 'Share DOPE Cards Export' : 'Save DOPE Cards Export'
        });
        console.log('File shared successfully');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }

      setExportModalVisible(false);
      
      Alert.alert(
        'Export Complete',
        `Successfully exported ${dopeCards.length} DOPE cards to ${fullFileName}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectAndImportJsonFile = async () => {
    console.log('Starting DOPE cards import process...');
    
    try {
      console.log('Opening document picker for JSON file selection...');
      
      // Open document picker to select JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', 'text/json'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', JSON.stringify(result, null, 2));

      // Handle the new result format from expo-document-picker
      if (result.canceled) {
        console.log('File selection cancelled by user');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('No file selected or assets array is empty');
        Alert.alert('Error', 'No file was selected.');
        return;
      }

      const file = result.assets[0];
      console.log(`Selected file: ${file.name}, size: ${file.size} bytes, type: ${file.mimeType}`);

      // Check file extension if MIME type is not reliable
      const fileName = file.name?.toLowerCase() || '';
      if (!fileName.endsWith('.json') && file.mimeType && !file.mimeType.includes('json') && !file.mimeType.includes('text')) {
        console.log('Invalid file type selected:', file.mimeType, 'filename:', fileName);
        Alert.alert('Error', 'Please select a JSON file (.json).');
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        console.log('File too large:', file.size);
        Alert.alert('Error', 'File is too large. Please select a file smaller than 10MB.');
        return;
      }

      // Now show the processing modal since we have a valid file
      setIsImporting(true);

      // Read the file content
      console.log('Reading file content from:', file.uri);
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      console.log(`File content length: ${fileContent.length} characters`);

      if (!fileContent || fileContent.trim().length === 0) {
        console.log('File is empty');
        Alert.alert('Error', 'The selected file is empty.');
        return;
      }

      // Parse and process the JSON data
      await processJsonData(fileContent);

    } catch (error) {
      console.error('Error in selectAndImportJsonFile:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('cancelled')) {
        console.log('File selection was cancelled');
      } else if (error.message && error.message.includes('permission')) {
        console.log('Permission error');
        Alert.alert('Permission Error', 'Unable to access the selected file. Please check app permissions.');
      } else {
        console.log('General error during file selection/reading');
        Alert.alert('Error', 'Failed to read the selected file. Please make sure it&apos;s a valid JSON file and try again.');
      }
    } finally {
      console.log('Import process completed, resetting import state');
      setIsImporting(false);
    }
  };

  const processJsonData = async (jsonContent: string) => {
    console.log('Processing DOPE cards JSON data...');
    
    try {
      // First, validate that the JSON is parseable
      let parsedData;
      try {
        parsedData = JSON.parse(jsonContent);
        console.log('JSON parsed successfully');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        Alert.alert('Error', 'Invalid JSON format. Please check your file and try again.');
        return;
      }
      
      let cardsToImport: DOPECard[] = [];

      // Handle both old format (direct array) and new format (with metadata)
      if (Array.isArray(parsedData)) {
        cardsToImport = parsedData;
        console.log('Importing data in old format (direct array)');
      } else if (parsedData.cards && Array.isArray(parsedData.cards)) {
        cardsToImport = parsedData.cards;
        console.log(`Importing data in new format, exported on: ${parsedData.exportDate}`);
        console.log(`Expected cards: ${parsedData.totalCards}, actual cards: ${cardsToImport.length}`);
      } else {
        console.log('Invalid JSON structure:', Object.keys(parsedData));
        Alert.alert('Error', 'Invalid JSON format. Expected an array of DOPE cards or export data object.');
        return;
      }

      if (cardsToImport.length === 0) {
        console.log('No cards found in JSON data');
        Alert.alert('Error', 'No DOPE cards found in the JSON data.');
        return;
      }

      console.log(`Processing ${cardsToImport.length} DOPE cards for import...`);

      // Process cards and validate
      const processedCards: DOPECard[] = [];

      for (let i = 0; i < cardsToImport.length; i++) {
        const card = cardsToImport[i];
        console.log(`Processing card ${i + 1}/${cardsToImport.length}: ${card.rifleName || card.id}`);

        // Validate required fields
        if (!card.id || !card.rifleName || !card.caliber) {
          console.log(`Skipping invalid card: missing required fields (id: ${card.id}, rifleName: ${card.rifleName}, caliber: ${card.caliber})`);
          continue;
        }

        const processedCard: DOPECard = {
          id: card.id,
          rifleName: card.rifleName,
          caliber: card.caliber,
          ranges: card.ranges || {},
          timestamp: card.timestamp || Date.now()
        };

        processedCards.push(processedCard);
      }

      if (processedCards.length === 0) {
        console.log('No valid cards after processing');
        Alert.alert('Error', 'No valid DOPE cards found in the JSON data.');
        return;
      }

      // Get existing cards and merge
      const existingCards = dopeCards;
      
      // Combine existing and new cards, avoiding duplicates by ID
      const existingIds = new Set(existingCards.map(card => card.id));
      const newCards = processedCards.filter(card => !existingIds.has(card.id));
      const duplicateCount = processedCards.length - newCards.length;
      
      if (newCards.length === 0) {
        console.log('All cards are duplicates');
        Alert.alert('Info', 'All DOPE cards in the JSON file already exist. No new cards were imported.');
        return;
      }

      const allCards = [...existingCards, ...newCards];

      console.log(`Saving ${allCards.length} total cards (${newCards.length} new, ${existingCards.length} existing)`);
      setDopeCards(allCards);
      await saveDopeCards(allCards);
      
      let message = `Successfully imported ${newCards.length} new DOPE cards`;
      if (duplicateCount > 0) {
        message += `. ${duplicateCount} duplicate cards were skipped`;
      }
      message += '!';
      
      Alert.alert('Success', message);
      console.log(`Import completed: ${newCards.length} new cards, ${duplicateCount} duplicates skipped`);
    } catch (error) {
      console.error('Error processing JSON data:', error);
      Alert.alert('Error', 'Import failed. Please check your data and try again.');
    }
  };

  const closeExportModal = () => {
    setExportModalVisible(false);
  };

  const goBack = () => {
    console.log('Going back to home screen');
    router.back();
  };

  const renderCardForm = () => (
    <View style={{ width: '100%' }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Icon name="target" size={60} style={{ marginBottom: 10 }} />
        <Text style={commonStyles.title}>
          {editingCard ? 'Edit DOPE Card' : 'Add New DOPE Card'}
        </Text>
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.label}>Rifle Name</Text>
        <TextInput
          style={commonStyles.input}
          value={rifleName}
          onChangeText={setRifleName}
          placeholder="Enter rifle name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={commonStyles.label}>Caliber</Text>
        <TextInput
          style={commonStyles.input}
          value={caliber}
          onChangeText={setCaliber}
          placeholder="Enter caliber"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={commonStyles.card}>
        <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
          Range Data (MOA)
        </Text>
        
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.primary,
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
        }}>
          <Text style={[commonStyles.text, { 
            flex: 1, 
            fontWeight: 'bold', 
            color: colors.text,
            textAlign: 'center',
            marginBottom: 0
          }]}>
            Range
          </Text>
          <Text style={[commonStyles.text, { 
            flex: 1, 
            fontWeight: 'bold', 
            color: colors.text,
            textAlign: 'center',
            marginBottom: 0
          }]}>
            Elevation
          </Text>
          <Text style={[commonStyles.text, { 
            flex: 1, 
            fontWeight: 'bold', 
            color: colors.text,
            textAlign: 'center',
            marginBottom: 0
          }]}>
            Windage
          </Text>
        </View>

        {RANGES.map(range => (
          <View key={range} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={[commonStyles.text, { 
              flex: 1, 
              textAlign: 'center',
              fontWeight: '500',
              marginBottom: 0
            }]}>
              {range} yards
            </Text>
            
            {/* Elevation Input with Clear Button */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 5,
            }}>
              <TextInput
                style={[commonStyles.input, {
                  flex: 1,
                  marginVertical: 4,
                  marginRight: 4,
                  textAlign: 'center',
                  padding: 8,
                }]}
                value={ranges[range]?.elevation || ''}
                onChangeText={(value) => updateRange(range, 'elevation', value)}
                placeholder="0.0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              {ranges[range]?.elevation ? (
                <TouchableOpacity
                  onPress={() => clearField(range, 'elevation')}
                  style={{
                    backgroundColor: colors.error,
                    borderRadius: 4,
                    padding: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                  }}
                >
                  <Icon name="close" size={12} style={{ color: colors.background }} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 24, height: 24 }} />
              )}
            </View>

            {/* Windage Input with Clear Button */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 5,
            }}>
              <TextInput
                style={[commonStyles.input, {
                  flex: 1,
                  marginVertical: 4,
                  marginRight: 4,
                  textAlign: 'center',
                  padding: 8,
                }]}
                value={ranges[range]?.windage || ''}
                onChangeText={(value) => updateRange(range, 'windage', value)}
                placeholder="0.0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              {ranges[range]?.windage ? (
                <TouchableOpacity
                  onPress={() => clearField(range, 'windage')}
                  style={{
                    backgroundColor: colors.error,
                    borderRadius: 4,
                    padding: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                  }}
                >
                  <Icon name="close" size={12} style={{ color: colors.background }} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 24, height: 24 }} />
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={commonStyles.buttonContainer}>
        <Button
          text="Cancel"
          onPress={cancelEditing}
          style={[buttonStyles.secondary, { marginBottom: 10 }]}
        />
        <Button
          text={editingCard ? "Update" : "Save"}
          onPress={saveCard}
          style={buttonStyles.primary}
        />
      </View>
    </View>
  );

  const renderCardsList = () => (
    <View style={{ width: '100%' }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Icon name="target" size={60} style={{ marginBottom: 10 }} />
        <Text style={commonStyles.title}>DOPE Cards</Text>
        <Text style={commonStyles.text}>
          {dopeCards.length} {dopeCards.length === 1 ? 'card' : 'cards'} found
        </Text>
      </View>

      {dopeCards.length === 0 ? (
        <View style={commonStyles.card}>
          <Text style={[commonStyles.text, { textAlign: 'center' }]}>
            No DOPE cards found. Add your first DOPE card to track rifle data!
          </Text>
        </View>
      ) : (
        dopeCards.map(card => (
          <View key={card.id} style={commonStyles.card}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                {card.rifleName}
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'left' }]}>
                Caliber: {card.caliber}
              </Text>
            </View>

            <View style={{
              backgroundColor: colors.secondary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 15,
            }}>
              <View style={{
                flexDirection: 'row',
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                marginBottom: 8,
              }}>
                <Text style={[commonStyles.text, { 
                  flex: 1, 
                  fontSize: 14, 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  marginBottom: 0
                }]}>
                  Range
                </Text>
                <Text style={[commonStyles.text, { 
                  flex: 1, 
                  fontSize: 14, 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  marginBottom: 0
                }]}>
                  Elev
                </Text>
                <Text style={[commonStyles.text, { 
                  flex: 1, 
                  fontSize: 14, 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  marginBottom: 0
                }]}>
                  Wind
                </Text>
              </View>
              {RANGES.map(range => (
                <View key={range} style={{
                  flexDirection: 'row',
                  paddingVertical: 4,
                }}>
                  <Text style={[commonStyles.text, { 
                    flex: 1, 
                    fontSize: 12, 
                    textAlign: 'center',
                    marginBottom: 0
                  }]}>
                    {range}y
                  </Text>
                  <Text style={[commonStyles.text, { 
                    flex: 1, 
                    fontSize: 12, 
                    textAlign: 'center',
                    fontWeight: '500',
                    marginBottom: 0
                  }]}>
                    {card.ranges[range]?.elevation || '-'}
                  </Text>
                  <Text style={[commonStyles.text, { 
                    flex: 1, 
                    fontSize: 12, 
                    textAlign: 'center',
                    fontWeight: '500',
                    marginBottom: 0
                  }]}>
                    {card.ranges[range]?.windage || '-'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => startEditingCard(card)}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <Text style={[commonStyles.text, { fontSize: 14, marginBottom: 0, color: colors.background, fontWeight: '600' }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDeleteCard(card.id)}
                style={{
                  backgroundColor: colors.error,
                  borderRadius: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <Text style={[commonStyles.text, { fontSize: 14, marginBottom: 0, fontWeight: '600' }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={commonStyles.buttonContainer}>
        <Button
          text="Add New DOPE Card"
          onPress={startAddingCard}
          style={buttonStyles.primary}
        />
      </View>

      {dopeCards.length > 0 && (
        <View style={commonStyles.buttonContainer}>
          <Button
            text="Export DOPE Cards"
            onPress={exportData}
            style={buttonStyles.accent}
          />
        </View>
      )}

      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          onPress={selectAndImportJsonFile}
          style={{
            backgroundColor: '#FF8C00',
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{
            color: colors.background,
            fontSize: 16,
            fontWeight: 'bold',
          }}>
            Import Data
          </Text>
        </TouchableOpacity>
      </View>

      <View style={commonStyles.buttonContainer}>
        <Button
          text="Back"
          onPress={goBack}
          style={buttonStyles.backButton}
        />
      </View>
    </View>
  );

  console.log('DopeCardsScreen about to render, isAddingCard:', isAddingCard);

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        {isAddingCard ? renderCardForm() : renderCardsList()}
      </ScrollView>

      <Modal
        visible={showDeleteConfirm !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(null)}
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
              <Icon name="warning" size={40} style={{ marginBottom: 10 }} />
              <Text style={[commonStyles.subtitle, { textAlign: 'center' }]}>
                Confirm Delete
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', color: colors.textSecondary }]}>
                Are you sure you want to delete this DOPE card? This action cannot be undone.
              </Text>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Button
                text="Cancel"
                onPress={() => setShowDeleteConfirm(null)}
                style={[buttonStyles.secondary, { marginBottom: 10 }]}
              />
              <Button
                text="Delete"
                onPress={() => showDeleteConfirm && deleteCard(showDeleteConfirm)}
                style={buttonStyles.danger}
              />
            </View>
          </View>
        </View>
      </Modal>

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
                Export DOPE Cards
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', color: colors.grey }]}>
                Export {dopeCards.length} DOPE cards to a JSON file
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
                  Creating export file... Please wait
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
                Opens share dialog to save or send the file
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
                Choose where to save the file on your device
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

      {isImporting && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isImporting}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              padding: 30,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.border
            }}>
              <Icon name="download" size={40} style={{ marginBottom: 15 }} />
              <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 10 }]}>
                Importing DOPE Cards
              </Text>
              <Text style={[commonStyles.text, { 
                textAlign: 'center', 
                color: colors.grey,
                marginBottom: 0
              }]}>
                Please wait while we process your file...
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}