import { Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function EntryDetailsScreen() {
  console.log('EntryDetailsScreen rendered');

  const { entryId } = useLocalSearchParams();
  const [entry, setEntry] = useState<RangeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    console.log('Loading entry details for ID:', entryId);
    try {
      const data = await AsyncStorage.getItem('rangeEntries');
      if (data) {
        const entries: RangeEntry[] = JSON.parse(data);
        const foundEntry = entries.find(e => e.id === entryId);
        if (foundEntry) {
          setEntry(foundEntry);
          console.log('Entry loaded successfully');
        } else {
          console.log('Entry not found');
        }
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setLoading(false);
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
    console.log('Going back to entries list');
    router.back();
  };

  const calculateShotStatistics = (scores: string[]) => {
    let numericTotal = 0;
    let vCount = 0;
    let numericScores: number[] = [];

    scores.forEach(score => {
      const cleanScore = score.trim().toLowerCase();
      if (cleanScore === 'v') {
        numericTotal += 5; // Each "v" counts as 5 points
        vCount++;
      } else {
        const numValue = parseFloat(cleanScore);
        if (!isNaN(numValue)) {
          numericTotal += numValue;
          numericScores.push(numValue);
        }
      }
    });

    // Calculate total: numeric total + decimal representing v count
    const decimalPart = vCount / 10; // 0.1 for 1 v, 0.2 for 2 v's, etc.
    const totalScore = numericTotal + decimalPart;
    const average = numericScores.length > 0 ? numericScores.reduce((a, b) => a + b, 0) / numericScores.length : 0;

    return {
      totalScore,
      numericTotal,
      vCount,
      average,
      totalShots: scores.length,
      vPoints: vCount * 5 // Total points from v's
    };
  };

  const renderShotScores = () => {
    if (!entry?.shotScores || entry.shotScores.length === 0) {
      return (
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 6,
          padding: 15,
          alignItems: 'center'
        }}>
          <Icon name="information-circle" size={24} style={{ marginBottom: 8 }} />
          <Text style={[commonStyles.text, { 
            fontStyle: 'italic', 
            textAlign: 'center',
            color: colors.grey,
            marginBottom: 0
          }]}>
            No individual shot scores recorded for this session
          </Text>
        </View>
      );
    }

    const rows = [];
    const scores = entry.shotScores;
    const stats = calculateShotStatistics(scores);
    
    for (let i = 0; i < scores.length; i += 4) {
      const rowScores = scores.slice(i, i + 4);
      rows.push(
        <View key={i} style={commonStyles.row}>
          {rowScores.map((score, index) => (
            <View key={i + index} style={{
              backgroundColor: score.toLowerCase() === 'v' ? colors.accent : colors.secondary,
              borderRadius: 6,
              padding: 8,
              minWidth: 60,
              alignItems: 'center',
              marginHorizontal: 2
            }}>
              <Text style={[commonStyles.text, { 
                fontSize: 12, 
                marginBottom: 2,
                color: score.toLowerCase() === 'v' ? colors.background : colors.text
              }]}>
                Shot {i + index + 1}
              </Text>
              <Text style={[commonStyles.text, { 
                fontSize: 16, 
                fontWeight: 'bold',
                marginBottom: 0,
                color: score.toLowerCase() === 'v' ? colors.background : colors.text
              }]}>
                {score.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View>
        <Text style={[commonStyles.text, { 
          textAlign: 'center', 
          marginBottom: 10,
          fontSize: 16,
          fontWeight: '600'
        }]}>
          Individual Shot Scores ({scores.length} shots)
        </Text>
        {rows}
        
        {/* Statistics */}
        <View style={{ marginTop: 15 }}>
          <View style={{
            backgroundColor: colors.accent,
            borderRadius: 6,
            padding: 10,
            marginBottom: 8,
            alignItems: 'center'
          }}>
            <Text style={[commonStyles.text, { 
              color: colors.background, 
              fontWeight: 'bold',
              fontSize: 16,
              marginBottom: 0
            }]}>
              Calculated Total: {stats.totalScore.toFixed(1)}
            </Text>
          </View>
          
          <View style={commonStyles.row}>
            <View style={{
              backgroundColor: colors.secondary,
              borderRadius: 6,
              padding: 8,
              flex: 1,
              marginRight: 4,
              alignItems: 'center'
            }}>
              <Text style={[commonStyles.text, { 
                fontSize: 12,
                marginBottom: 2,
                color: colors.grey
              }]}>
                Numeric Total
              </Text>
              <Text style={[commonStyles.text, { 
                fontWeight: 'bold',
                marginBottom: 0
              }]}>
                {stats.numericTotal - stats.vPoints}
              </Text>
            </View>
            
            <View style={{
              backgroundColor: colors.secondary,
              borderRadius: 6,
              padding: 8,
              flex: 1,
              marginHorizontal: 2,
              alignItems: 'center'
            }}>
              <Text style={[commonStyles.text, { 
                fontSize: 12,
                marginBottom: 2,
                color: colors.grey
              }]}>
                V-Bull Hits
              </Text>
              <Text style={[commonStyles.text, { 
                fontWeight: 'bold',
                marginBottom: 0
              }]}>
                {stats.vCount} ({stats.vPoints}pts)
              </Text>
            </View>
            
            <View style={{
              backgroundColor: colors.secondary,
              borderRadius: 6,
              padding: 8,
              flex: 1,
              marginLeft: 4,
              alignItems: 'center'
            }}>
              <Text style={[commonStyles.text, { 
                fontSize: 12,
                marginBottom: 2,
                color: colors.grey
              }]}>
                Numeric Avg
              </Text>
              <Text style={[commonStyles.text, { 
                fontWeight: 'bold',
                marginBottom: 0
              }]}>
                {stats.average.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.wrapper}>
        <View style={commonStyles.container}>
          <Text style={commonStyles.text}>Loading entry details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={commonStyles.wrapper}>
        <View style={commonStyles.container}>
          <Text style={commonStyles.text}>Entry not found</Text>
          <Button
            text="Back"
            onPress={goBack}
            style={buttonStyles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Icon name="document-text" size={60} style={{ marginBottom: 10 }} />
          <Text style={commonStyles.title}>{entry.entryName || 'Entry Details'}</Text>
        </View>

        {/* Rifle Information */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Rifle Information
          </Text>
          
          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Rifle Name:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.rifleName}
            </Text>
          </View>

          {entry.rifleCalibber && (
            <View style={commonStyles.row}>
              <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Caliber:</Text>
              <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
                {entry.rifleCalibber}
              </Text>
            </View>
          )}
        </View>

        {/* Basic Information */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Session Information
          </Text>
          
          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Date:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.date}
            </Text>
          </View>

          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Distance:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.distance}
            </Text>
          </View>

          {entry.bullGrainWeight && (
            <View style={commonStyles.row}>
              <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Bullet Grain Weight:</Text>
              <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
                {entry.bullGrainWeight}
              </Text>
            </View>
          )}
        </View>

        {/* Scope Settings */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Scope Settings
          </Text>
          
          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Elevation:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.elevationMOA} MOA
            </Text>
          </View>

          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Windage:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.windageMOA} MOA
            </Text>
          </View>
        </View>

        {/* Scoring */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            Scoring
          </Text>
          
          {entry.score && (
            <View style={{
              backgroundColor: colors.accent,
              borderRadius: 6,
              padding: 12,
              marginBottom: 15,
              alignItems: 'center'
            }}>
              <Text style={[commonStyles.text, { 
                color: colors.background, 
                fontWeight: 'bold',
                fontSize: 18,
                marginBottom: 0
              }]}>
                Overall Score: {entry.score}
              </Text>
            </View>
          )}

          {renderShotScores()}
        </View>

        {/* Target Photo */}
        {entry.targetImageUri && (
          <View style={commonStyles.card}>
            <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
              Target Photo
            </Text>
            <TouchableOpacity onPress={() => openImageModal(entry.targetImageUri!)}>
              <Image 
                source={{ uri: entry.targetImageUri }} 
                style={{ 
                  width: '100%', 
                  height: 250, 
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
                padding: 6
              }}>
                <Icon name="expand" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        {entry.notes && (
          <View style={commonStyles.card}>
            <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
              Notes
            </Text>
            <Text style={[commonStyles.text, { 
              fontStyle: 'italic', 
              textAlign: 'left',
              lineHeight: 22
            }]}>
              {entry.notes}
            </Text>
          </View>
        )}

        <View style={commonStyles.buttonContainer}>
          <Button
            text="Back to Entries"
            onPress={goBack}
            style={buttonStyles.primary}
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
                width: '95%', 
                height: '80%',
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