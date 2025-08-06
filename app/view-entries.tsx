
import { Text, View, SafeAreaView, ScrollView, Alert, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  selectedClass?: string;
  timestamp: number;
}

type FilterType = 'all' | 'name' | 'distance';

export default function ViewEntriesScreen() {
  console.log('ViewEntriesScreen rendered');

  const [entries, setEntries] = useState<RangeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<RangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filterValue, setFilterValue] = useState('');

  // Use useFocusEffect to reload entries whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, reloading entries...');
      loadEntries().catch(error => {
        console.error('Error in loadEntries useFocusEffect:', error);
      });
    }, [])
  );

  const applyFilter = useCallback(() => {
    console.log(`Applying filter: ${activeFilter}, value: ${filterValue}`);
    
    if (activeFilter === 'all' || !filterValue.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const filtered = entries.filter(entry => {
      const searchValue = filterValue.toLowerCase().trim();
      
      switch (activeFilter) {
        case 'name':
          return entry.entryName.toLowerCase().includes(searchValue) ||
                 entry.rifleName.toLowerCase().includes(searchValue);
        case 'distance':
          // Extract numeric value from distance for comparison
          const entryDistance = entry.distance.replace(/[^\d.]/g, '');
          return entryDistance.includes(searchValue) || 
                 entry.distance.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });

    console.log(`Filtered ${entries.length} entries to ${filtered.length} entries`);
    setFilteredEntries(filtered);
  }, [entries, activeFilter, filterValue]);

  // Apply filters whenever entries, activeFilter, or filterValue changes
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

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

  const setFilter = (filterType: FilterType) => {
    console.log(`Setting filter to: ${filterType}`);
    setActiveFilter(filterType);
    if (filterType === 'all') {
      setFilterValue('');
    }
  };

  const clearFilter = () => {
    console.log('Clearing filter');
    setActiveFilter('all');
    setFilterValue('');
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
        
        {/* All white text below, left aligned with consistent spacing */}
        <Text style={[commonStyles.text, { textAlign: 'left', marginBottom: 8 }]}>
          Rifle: {entry.rifleName} {entry.rifleCalibber ? `(${entry.rifleCalibber})` : ''}
        </Text>

        {entry.bullGrainWeight && (
          <Text style={[commonStyles.text, { textAlign: 'left', marginBottom: 8 }]}>Bullet Grain Weight: {entry.bullGrainWeight}</Text>
        )}

        <Text style={[commonStyles.text, { textAlign: 'left', marginBottom: 8 }]}>Date: {entry.date}</Text>
        <Text style={[commonStyles.text, { textAlign: 'left', marginBottom: 8 }]}>Distance: {entry.distance}</Text>
        
        {/* Display the selected class */}
        <Text style={[commonStyles.text, { textAlign: 'left', marginBottom: 8 }]}>
          Class: {entry.selectedClass || 'TR'}
        </Text>
        
        <View style={[commonStyles.row, { marginBottom: 8 }]}>
          <Text style={[commonStyles.text, { flex: 1, textAlign: 'left' }]}>
            Elevation: {entry.elevationMOA} MOA
          </Text>
          <Text style={[commonStyles.text, { flex: 1, textAlign: 'left' }]}>
            Windage: {entry.windageMOA} MOA
          </Text>
        </View>

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

        {/* Filter Section */}
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border
        }}>
          <Text style={[commonStyles.text, { 
            fontSize: 16, 
            fontWeight: 'bold', 
            marginBottom: 12,
            textAlign: 'center'
          }]}>
            Filter Entries
          </Text>
          
          {/* Filter Buttons */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            marginBottom: 12,
            gap: 8
          }}>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              style={{
                backgroundColor: activeFilter === 'all' ? colors.accent : colors.inputBackground,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                flex: 1,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: activeFilter === 'all' ? colors.accent : colors.border
              }}
            >
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                marginBottom: 0,
                color: activeFilter === 'all' ? colors.background : colors.text,
                fontWeight: activeFilter === 'all' ? 'bold' : 'normal'
              }]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setFilter('name')}
              style={{
                backgroundColor: activeFilter === 'name' ? colors.accent : colors.inputBackground,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                flex: 1,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: activeFilter === 'name' ? colors.accent : colors.border
              }}
            >
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                marginBottom: 0,
                color: activeFilter === 'name' ? colors.background : colors.text,
                fontWeight: activeFilter === 'name' ? 'bold' : 'normal'
              }]}>
                Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setFilter('distance')}
              style={{
                backgroundColor: activeFilter === 'distance' ? colors.accent : colors.inputBackground,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
                flex: 1,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: activeFilter === 'distance' ? colors.accent : colors.border
              }}
            >
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                marginBottom: 0,
                color: activeFilter === 'distance' ? colors.background : colors.text,
                fontWeight: activeFilter === 'distance' ? 'bold' : 'normal'
              }]}>
                Distance
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input - only show when not "all" filter */}
          {activeFilter !== 'all' && (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={[commonStyles.input, { marginBottom: 0 }]}
                value={filterValue}
                onChangeText={setFilterValue}
                placeholder={
                  activeFilter === 'name' 
                    ? 'Search by entry name or rifle name...' 
                    : 'Search by distance (e.g., 600, 800 yards)...'
                }
                placeholderTextColor={colors.grey}
              />
            </View>
          )}

          {/* Clear Filter Button */}
          {(activeFilter !== 'all' || filterValue) && (
            <TouchableOpacity
              onPress={clearFilter}
              style={{
                backgroundColor: colors.error,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 16,
                alignItems: 'center',
                alignSelf: 'center'
              }}
            >
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                marginBottom: 0,
                color: colors.text,
                fontWeight: 'bold'
              }]}>
                Clear Filter
              </Text>
            </TouchableOpacity>
          )}

          {/* Filter Results Info */}
          {activeFilter !== 'all' && (
            <Text style={[commonStyles.text, { 
              fontSize: 12, 
              color: colors.grey, 
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 0
            }]}>
              Showing {filteredEntries.length} of {entries.length} entries
            </Text>
          )}
        </View>

        {filteredEntries.length === 0 ? (
          <View style={commonStyles.card}>
            <Text style={[commonStyles.text, { textAlign: 'center' }]}>
              {entries.length === 0 
                ? 'No entries found. Add your first range session!'
                : activeFilter !== 'all' 
                  ? 'No entries match your filter criteria.'
                  : 'No entries found.'
              }
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))
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
