
import { Text, View, SafeAreaView, ScrollView, Alert, Image, TouchableOpacity, Modal, TextInput, LayoutAnimation, UIManager, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors, spacing, borderRadius, shadows, typography } from '../styles/commonStyles';
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

  // Collapsible state for filter section
  const [filterCollapsed, setFilterCollapsed] = useState(true);

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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
        style={styles.entryCard}
        onPress={() => viewEntryDetails(entry)}
        activeOpacity={0.7}
      >
        {/* Header with entry name and date */}
        <View style={styles.cardHeader}>
          <Text style={styles.entryTitle}>
            {entry.entryName || 'Unnamed Entry'}
          </Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{entry.date}</Text>
          </View>
        </View>
        
        {/* Rifle info section */}
        <View style={styles.rifleSection}>
          <Text style={styles.rifleTitle}>
            {entry.rifleName}
          </Text>
          {entry.rifleCalibber && (
            <Text style={styles.rifleSubtitle}>
              {entry.rifleCalibber}
            </Text>
          )}
        </View>

        {/* Key metrics in a grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>{entry.distance}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Class</Text>
            <Text style={styles.metricValue}>{entry.selectedClass || 'TR'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Elevation</Text>
            <Text style={styles.metricValue}>{entry.elevationMOA} MOA</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Windage</Text>
            <Text style={styles.metricValue}>{entry.windageMOA} MOA</Text>
          </View>
        </View>

        {entry.bullGrainWeight && (
          <View style={styles.additionalInfo}>
            <Text style={styles.infoText}>
              Bullet: {entry.bullGrainWeight}
            </Text>
          </View>
        )}

        {entry.score && (
          <View style={styles.scoreSection}>
            <Text style={styles.scoreText}>
              Score: {entry.score}
            </Text>
          </View>
        )}

        {entry.shotScores && entry.shotScores.length > 0 ? (
          <View style={styles.shotScoresSection}>
            <Text style={styles.shotScoresTitle}>
              Shot Scores ({entry.shotScores.length} shots{shotStats && shotStats.vCount > 0 ? `, ${shotStats.vCount} V-Bull (${shotStats.vPoints}pts)` : ''})
            </Text>
            <Text style={styles.shotScoresDetail}>
              {formatShotScores(entry.shotScores)}
            </Text>
          </View>
        ) : (
          <View style={styles.noShotsSection}>
            <Text style={styles.noShotsText}>
              No individual shot scores recorded
            </Text>
          </View>
        )}

        {entry.targetImageUri && (
          <View style={styles.imageSection}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                openImageModal(entry.targetImageUri!);
              }}
              style={styles.imageContainer}
            >
              <Image 
                source={{ uri: entry.targetImageUri }} 
                style={styles.targetImage} 
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Icon name="expand" size={16} style={{ color: colors.text }} />
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* View details prompt */}
        <View style={styles.viewDetailsSection}>
          <Text style={styles.viewDetailsText}>
            Tap to view full details
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              editEntry(entry);
            }}
            style={[styles.actionButton, styles.editButton]}
          >
            <Text style={styles.editButtonText}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              deleteEntry(entry.id);
            }}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Text style={styles.deleteButtonText}>
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

  const toggleFilterCollapsed = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterCollapsed(prev => !prev);
  };

  const hasActiveFilter = activeFilter !== 'all' || Boolean(filterValue.trim());

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

        {/* Filter Section - now collapsible */}
        <View style={[
          styles.filterSection,
          { padding: filterCollapsed ? spacing.md : spacing.lg }
        ]}>
          {/* Header / Toggle */}
          <TouchableOpacity
            onPress={toggleFilterCollapsed}
            activeOpacity={0.7}
            style={styles.filterHeader}
          >
            <Text style={styles.filterTitle}>
              Filter Entries
            </Text>
            <Icon name={filterCollapsed ? 'chevron-down' : 'chevron-up'} size={20} style={{ color: colors.accent }} />
          </TouchableOpacity>

          {/* Summary when collapsed */}
          {filterCollapsed && (
            <Text style={styles.filterSummary}>
              {hasActiveFilter
                ? `Showing ${filteredEntries.length} of ${entries.length} (filters applied)`
                : `Showing ${filteredEntries.length} of ${entries.length}`}
            </Text>
          )}

          {/* Collapsible Content */}
          {!filterCollapsed && (
            <View style={styles.filterContent}>
              {/* Filter Buttons */}
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  onPress={() => setFilter('all')}
                  style={[
                    styles.filterButton,
                    activeFilter === 'all' && styles.filterButtonActive
                  ]}
                >
                  <Text style={[
                    styles.filterButtonText,
                    activeFilter === 'all' && styles.filterButtonTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setFilter('name')}
                  style={[
                    styles.filterButton,
                    activeFilter === 'name' && styles.filterButtonActive
                  ]}
                >
                  <Text style={[
                    styles.filterButtonText,
                    activeFilter === 'name' && styles.filterButtonTextActive
                  ]}>
                    Name
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setFilter('distance')}
                  style={[
                    styles.filterButton,
                    activeFilter === 'distance' && styles.filterButtonActive
                  ]}
                >
                  <Text style={[
                    styles.filterButtonText,
                    activeFilter === 'distance' && styles.filterButtonTextActive
                  ]}>
                    Distance
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Input - only show when not "all" filter */}
              {activeFilter !== 'all' && (
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    value={filterValue}
                    onChangeText={setFilterValue}
                    placeholder={
                      activeFilter === 'name' 
                        ? 'Search by entry name or rifle name...' 
                        : 'Search by distance (e.g., 600, 800 yards)...'
                    }
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              )}

              {/* Clear Filter Button */}
              {(activeFilter !== 'all' || filterValue) && (
                <TouchableOpacity
                  onPress={clearFilter}
                  style={styles.clearFilterButton}
                >
                  <Text style={styles.clearFilterText}>
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              )}

              {/* Filter Results Info */}
              {activeFilter !== 'all' && (
                <Text style={styles.filterResults}>
                  Showing {filteredEntries.length} of {entries.length} entries
                </Text>
              )}
            </View>
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

const styles = StyleSheet.create({
  entryCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    width: '100%',
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  entryTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  dateBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rifleSection: {
    marginBottom: spacing.md,
  },
  rifleTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rifleSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  additionalInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scoreSection: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  scoreText: {
    ...typography.bodyMedium,
    color: colors.background,
    fontWeight: '700',
  },
  shotScoresSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  shotScoresTitle: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  shotScoresDetail: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noShotsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  noShotsText: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  imageSection: {
    marginBottom: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  targetImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  viewDetailsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  viewDetailsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  actionButton: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    alignItems: 'center',
    ...shadows.sm,
  },
  editButton: {
    backgroundColor: colors.accent,
  },
  editButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  filterSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  filterTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  filterSummary: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  filterContent: {
    marginTop: spacing.md,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  searchInputContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    ...shadows.sm,
  },
  clearFilterButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    alignSelf: 'center',
    ...shadows.sm,
  },
  clearFilterText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  filterResults: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
