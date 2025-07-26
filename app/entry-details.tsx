import { Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RangeEntry {
  id: string;
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

  const renderShotScores = () => {
    if (!entry?.shotScores || entry.shotScores.length === 0) {
      return (
        <Text style={[commonStyles.text, { fontStyle: 'italic', textAlign: 'center' }]}>
          No individual shot scores recorded
        </Text>
      );
    }

    const rows = [];
    const scores = entry.shotScores;
    
    for (let i = 0; i < scores.length; i += 4) {
      const rowScores = scores.slice(i, i + 4);
      rows.push(
        <View key={i} style={commonStyles.row}>
          {rowScores.map((score, index) => (
            <View key={i + index} style={{
              backgroundColor: colors.secondary,
              borderRadius: 6,
              padding: 8,
              minWidth: 60,
              alignItems: 'center',
              marginHorizontal: 2
            }}>
              <Text style={[commonStyles.text, { fontSize: 12, marginBottom: 2 }]}>
                Shot {i + index + 1}
              </Text>
              <Text style={[commonStyles.text, { 
                fontSize: 16, 
                fontWeight: 'bold',
                marginBottom: 0
              }]}>
                {score}
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
        <View style={{
          backgroundColor: colors.accent,
          borderRadius: 6,
          padding: 8,
          marginTop: 10,
          alignItems: 'center'
        }}>
          <Text style={[commonStyles.text, { 
            color: colors.background, 
            fontWeight: 'bold',
            marginBottom: 0
          }]}>
            Average: {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}
          </Text>
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
          <Text style={commonStyles.title}>Entry Details</Text>
        </View>

        {/* Basic Information */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 15 }]}>
            {entry.rifleName}
          </Text>
          
          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Date:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.date}
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

          <View style={commonStyles.row}>
            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Distance:</Text>
            <Text style={[commonStyles.text, { flex: 1, textAlign: 'right' }]}>
              {entry.distance}
            </Text>
          </View>

          {entry.bullGrainWeight && (
            <View style={commonStyles.row}>
              <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>Bull Grain Weight:</Text>
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