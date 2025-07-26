import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface RangeEntry {
  id: string;
  date: string;
  rifleName: string;
  rifleCalibber: string;
  distance: string;
  elevationMOA: string;
  windageMOA: string;
  notes: string;
  score: string;
  shotScores?: string[]; // Changed to string array to handle "v" entries
  bullGrainWeight: string;
  targetImageUri?: string;
  timestamp: number;
}

export default function AddEntryScreen() {
  console.log('AddEntryScreen rendered');

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rifleName, setRifleName] = useState('');
  const [rifleCalibber, setRifleCalibber] = useState('');
  const [distance, setDistance] = useState('');
  const [elevationMOA, setElevationMOA] = useState('');
  const [windageMOA, setWindageMOA] = useState('');
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState('');
  const [bullGrainWeight, setBullGrainWeight] = useState('');
  const [shotScores, setShotScores] = useState<string[]>(Array(12).fill(''));
  const [targetImageUri, setTargetImageUri] = useState<string | null>(null);
  const [showShotScores, setShowShotScores] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    console.log('Date picker event:', event.type, selectedDate);
    
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    setDate(currentDate);
    console.log('Date updated to:', currentDate.toDateString());
  };

  const updateShotScore = (index: number, value: string) => {
    // Allow empty string, valid numbers (including decimals), or "v"
    const cleanValue = value.toLowerCase().trim();
    if (cleanValue === '' || cleanValue === 'v' || /^\d*\.?\d*$/.test(cleanValue)) {
      const newScores = [...shotScores];
      newScores[index] = cleanValue;
      setShotScores(newScores);
      console.log(`Updated shot ${index + 1} to "${cleanValue}"`);
      
      // Auto-calculate total score if individual shots are entered
      calculateTotalScore(newScores);
    }
  };

  const calculateTotalScore = (scores: string[]) => {
    const validScores = scores.filter(score => score.trim() !== '');
    if (validScores.length === 0) return;

    let numericTotal = 0;
    let vCount = 0;

    validScores.forEach(score => {
      const cleanScore = score.trim().toLowerCase();
      if (cleanScore === 'v') {
        vCount++;
        numericTotal += 5; // v counts as 5 points
      } else {
        const numValue = parseFloat(cleanScore);
        if (!isNaN(numValue)) {
          numericTotal += numValue;
        }
      }
    });

    // Calculate total: numeric total + decimal representation of v count
    const totalScore = numericTotal + (vCount * 0.1);
    setScore(totalScore.toString());
    console.log(`Calculated total score: ${totalScore} (${numericTotal - (vCount * 5)} numeric + ${vCount} v's worth ${vCount * 5} points + ${vCount * 0.1} decimal)`);
  };

  const addAllShots = () => {
    setShowShotScores(true);
    console.log('Showing shot score inputs');
  };

  const clearAllShots = () => {
    setShotScores(Array(12).fill(''));
    setScore(''); // Clear total score when clearing individual shots
    console.log('Cleared all shot scores');
  };

  const pickImage = async () => {
    console.log('Opening image picker...');
    
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    // Show action sheet to choose between camera and gallery
    Alert.alert(
      'Select Image',
      'Choose how you want to add a target photo',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    console.log('Opening camera...');
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setTargetImageUri(result.assets[0].uri);
      console.log('Image captured:', result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    console.log('Opening gallery...');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setTargetImageUri(result.assets[0].uri);
      console.log('Image selected:', result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setTargetImageUri(null);
    console.log('Image removed');
  };

  const saveEntry = async () => {
    console.log('Saving entry...');
    
    if (!rifleName.trim() || !distance.trim() || !elevationMOA.trim() || !windageMOA.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Rifle Name, Distance, Elevation MOA, Windage MOA)');
      return;
    }

    // Filter out empty shot scores
    const validShotScores = shotScores
      .map(score => score.trim().toLowerCase())
      .filter(score => score !== '');

    console.log('Valid shot scores:', validShotScores);

    const entry: RangeEntry = {
      id: Date.now().toString(),
      date: date.toISOString().split('T')[0],
      rifleName: rifleName.trim(),
      rifleCalibber: rifleCalibber.trim(),
      distance: distance.trim(),
      elevationMOA: elevationMOA.trim(),
      windageMOA: windageMOA.trim(),
      notes: notes.trim(),
      score: score.trim(),
      shotScores: validShotScores.length > 0 ? validShotScores : undefined, // Only include if there are valid scores
      bullGrainWeight: bullGrainWeight.trim(),
      targetImageUri: targetImageUri || undefined,
      timestamp: Date.now(),
    };

    try {
      const existingData = await AsyncStorage.getItem('rangeEntries');
      const entries: RangeEntry[] = existingData ? JSON.parse(existingData) : [];
      entries.push(entry);
      
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(entries));
      console.log('Entry saved successfully:', entry);
      
      Alert.alert('Success', 'Range entry saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const goBack = () => {
    console.log('Going back to home screen');
    router.back();
  };

  const renderShotInputs = () => {
    if (!showShotScores) return null;

    const rows = [];
    for (let i = 0; i < 12; i += 3) {
      rows.push(
        <View key={i} style={commonStyles.row}>
          {[0, 1, 2].map(offset => {
            const index = i + offset;
            if (index >= 12) return null;
            return (
              <View key={index} style={{ width: '30%' }}>
                <Text style={[commonStyles.label, { fontSize: 14, textAlign: 'center' }]}>
                  Shot {index + 1}
                </Text>
                <TextInput
                  style={[commonStyles.input, { 
                    marginVertical: 4,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '600'
                  }]}
                  value={shotScores[index]}
                  onChangeText={(value) => updateShotScore(index, value)}
                  placeholder="0 or v"
                  placeholderTextColor={colors.grey}
                  returnKeyType="next"
                  autoCapitalize="none"
                />
              </View>
            );
          })}
        </View>
      );
    }
    return (
      <View style={{ marginTop: 10 }}>
        <Text style={[commonStyles.text, { 
          fontSize: 14, 
          fontStyle: 'italic',
          marginBottom: 15,
          textAlign: 'center',
          color: colors.grey
        }]}>
          Enter scores for up to 12 individual shots. Use "v" for V-ring hits (worth 5 points).
          {'\n'}Total score will be calculated automatically.
        </Text>
        {rows}
        <View style={[commonStyles.row, { marginTop: 15 }]}>
          <Button
            text="Clear All"
            onPress={clearAllShots}
            style={[buttonStyles.backButton, { 
              flex: 1,
              marginRight: 5,
              paddingVertical: 8,
              minHeight: 35
            }]}
            textStyle={{ fontSize: 14 }}
          />
          <Button
            text="Hide Shots"
            onPress={() => setShowShotScores(false)}
            style={[buttonStyles.secondary, { 
              flex: 1,
              marginLeft: 5,
              paddingVertical: 8,
              minHeight: 35
            }]}
            textStyle={{ fontSize: 14 }}
          />
        </View>
      </View>
    );
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Icon name="add-circle" size={60} style={{ marginBottom: 10 }} />
          <Text style={commonStyles.title}>Add Range Entry</Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.label}>Date *</Text>
          <TouchableOpacity
            style={[commonStyles.input, {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 15
            }]}
            onPress={() => {
              console.log('Date picker button pressed');
              setShowDatePicker(true);
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
              {formatDateForDisplay(date)}
            </Text>
            <Icon name="calendar" size={20} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()} // Prevent future dates
            />
          )}

          <Text style={commonStyles.label}>Rifle Name *</Text>
          <TextInput
            style={commonStyles.input}
            value={rifleName}
            onChangeText={setRifleName}
            placeholder="Enter rifle name"
            placeholderTextColor={colors.grey}
            returnKeyType="next"
          />

          <Text style={commonStyles.label}>Caliber</Text>
          <TextInput
            style={commonStyles.input}
            value={rifleCalibber}
            onChangeText={setRifleCalibber}
            placeholder="e.g., .308 Winchester"
            placeholderTextColor={colors.grey}
            returnKeyType="next"
          />

          <Text style={commonStyles.label}>Distance *</Text>
          <TextInput
            style={commonStyles.input}
            value={distance}
            onChangeText={setDistance}
            placeholder="e.g., 100 yards"
            placeholderTextColor={colors.grey}
            returnKeyType="next"
          />

          <View style={commonStyles.row}>
            <View style={commonStyles.halfWidth}>
              <Text style={commonStyles.label}>Elevation MOA *</Text>
              <TextInput
                style={commonStyles.input}
                value={elevationMOA}
                onChangeText={setElevationMOA}
                placeholder="0.0"
                placeholderTextColor={colors.grey}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>

            <View style={commonStyles.halfWidth}>
              <Text style={commonStyles.label}>Windage MOA *</Text>
              <TextInput
                style={commonStyles.input}
                value={windageMOA}
                onChangeText={setWindageMOA}
                placeholder="0.0"
                placeholderTextColor={colors.grey}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          </View>

          <Text style={commonStyles.label}>Bull Grain Weight</Text>
          <TextInput
            style={commonStyles.input}
            value={bullGrainWeight}
            onChangeText={setBullGrainWeight}
            placeholder="e.g., 168 gr"
            placeholderTextColor={colors.grey}
            returnKeyType="next"
          />

          <Text style={commonStyles.label}>Overall Score (Points)</Text>
          <TextInput
            style={commonStyles.input}
            value={score}
            onChangeText={setScore}
            placeholder="e.g., 95, 180/200, or auto-calculated from shots"
            placeholderTextColor={colors.grey}
            returnKeyType="next"
          />

          <View style={{ marginTop: 15 }}>
            <View style={[commonStyles.row, { alignItems: 'flex-end' }]}>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.label}>
                  Individual Shot Scores (Optional)
                </Text>
                <Text style={[commonStyles.text, { 
                  fontSize: 12, 
                  color: colors.grey,
                  textAlign: 'left',
                  marginBottom: 0
                }]}>
                  Track up to 12 individual shot scores. Use "v" for V-ring hits (worth 5 points).
                </Text>
              </View>
              <Button
                text={showShotScores ? "Hide" : "Add Shots"}
                onPress={() => {
                  if (!showShotScores) {
                    addAllShots();
                  } else {
                    setShowShotScores(false);
                  }
                }}
                style={[buttonStyles.accent, { 
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  minHeight: 40,
                  width: 'auto'
                }]}
                textStyle={{ fontSize: 14, fontWeight: '600' }}
              />
            </View>
            
            {renderShotInputs()}
          </View>

          <Text style={[commonStyles.label, { marginTop: 15 }]}>Target Photo</Text>
          {targetImageUri ? (
            <View style={{ marginVertical: 10 }}>
              <Image 
                source={{ uri: targetImageUri }} 
                style={{ 
                  width: '100%', 
                  height: 200, 
                  borderRadius: 8,
                  marginBottom: 10
                }} 
                resizeMode="cover"
              />
              <View style={commonStyles.row}>
                <Button
                  text="Change Photo"
                  onPress={pickImage}
                  style={[buttonStyles.secondary, { flex: 1, marginRight: 5 }]}
                />
                <Button
                  text="Remove"
                  onPress={removeImage}
                  style={[buttonStyles.backButton, { flex: 1, marginLeft: 5 }]}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderRadius: 8,
                padding: 40,
                marginVertical: 10,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={pickImage}
            >
              <Icon name="camera" size={40} style={{ marginBottom: 10 }} />
              <Text style={[commonStyles.text, { color: colors.grey }]}>
                Tap to add target photo
              </Text>
            </TouchableOpacity>
          )}

          <Text style={commonStyles.label}>Notes</Text>
          <TextInput
            style={[commonStyles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this session..."
            placeholderTextColor={colors.grey}
            multiline
            returnKeyType="done"
          />
        </View>

        <View style={commonStyles.buttonContainer}>
          <Button
            text="Save Entry"
            onPress={saveEntry}
            style={buttonStyles.primary}
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