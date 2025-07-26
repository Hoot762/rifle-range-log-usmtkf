import { Text, View, SafeAreaView, ScrollView, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  shotScores?: string[]; // Changed to string array to handle "v" entries
  bullGrainWeight?: string;
  targetImageUri?: string;
  timestamp: number;
}

export default function ViewEntriesScreen() {
  console.log('ViewEntriesScreen rendered');

  const [entries, setEntries] = useState<RangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    console.log('Loading entries...');
    try {
      const data = await AsyncStorage.getItem('rangeEntries');
      if (data) {
        const parsedEntries: RangeEntry[] = JSON.parse(data);
        // Sort by timestamp, newest first
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

  const viewEntryDetails = (entry: RangeEntry) => {
    console.log('Viewing entry details for:', entry.id);
    router.push({
      pathname: '/entry-details',
      params: { entryId: entry.id }
    });
  };

  const exportData = async () => {
    console.log('Exporting data...');
    try {
      const data = await AsyncStorage.getItem('rangeEntries');
      if (data) {
        // In a real app, you would use expo-file-system to save to a file
        // For now, we'll show the data in an alert
        Alert.alert(
          'Export Data',
          `Found ${entries.length} entries. Data is stored locally on your device.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No Data', 'No entries found to export');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
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
        vPoints += 5; // Each "v" is worth 5 points
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
        <View style={commonStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
              {entry.entryName || 'Unnamed Entry'}
            </Text>
            <Text style={[commonStyles.text, { fontSize: 14, color: colors.grey }]}>
              {entry.rifleName}
            </Text>
          </View>
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
            }}
          >
            <Text style={[commonStyles.text, { fontSize: 12, marginBottom: 0 }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={commonStyles.text}>Date: {entry.date}</Text>
        {entry.rifleCalibber && (
          <Text style={commonStyles.text}>Caliber: {entry.rifleCalibber}</Text>
        )}
        <Text style={commonStyles.text}>Distance: {entry.distance}</Text>
        
        <View style={commonStyles.row}>
          <Text style={[commonStyles.text, { flex: 1 }]}>
            Elevation: {entry.elevationMOA} MOA
          </Text>
          <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
            Windage: {entry.windageMOA} MOA
          </Text>
        </View>

        {entry.bullGrainWeight && (
          <Text style={commonStyles.text}>Bull Grain Weight: {entry.bullGrainWeight}</Text>
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
              Shot Scores ({entry.shotScores.length} shots{shotStats && shotStats.vCount > 0 ? `, ${shotStats.vCount} V-ring (${shotStats.vPoints}pts)` : ''})
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

      {/* Image Modal */}
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