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
  const [targetImageUri, setTargetImageUri] = useState<string | null>(null);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
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
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

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
      targetImageUri: targetImageUri || undefined,
      timestamp: Date.now(),
    };

    try {
      const existingData = await AsyncStorage.getItem('rangeEntries');
      const entries: RangeEntry[] = existingData ? JSON.parse(existingData) : [];
      entries.push(entry);
      
      await AsyncStorage.setItem('rangeEntries', JSON.stringify(entries));
      console.log('Entry saved successfully');
      
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

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Icon name="add-circle" size={60} style={{ marginBottom: 10 }} />
          <Text style={commonStyles.title}>Add Range Entry</Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.label}>Date</Text>
          <Button
            text={date.toDateString()}
            onPress={() => setShowDatePicker(true)}
            style={[buttonStyles.secondary, { marginBottom: 10 }]}
          />
          
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onDateChange}
            />
          )}

          <Text style={commonStyles.label}>Rifle Name *</Text>
          <TextInput
            style={commonStyles.input}
            value={rifleName}
            onChangeText={setRifleName}
            placeholder="Enter rifle name"
            placeholderTextColor={colors.grey}
          />

          <Text style={commonStyles.label}>Caliber</Text>
          <TextInput
            style={commonStyles.input}
            value={rifleCalibber}
            onChangeText={setRifleCalibber}
            placeholder="e.g., .308 Winchester"
            placeholderTextColor={colors.grey}
          />

          <Text style={commonStyles.label}>Distance *</Text>
          <TextInput
            style={commonStyles.input}
            value={distance}
            onChangeText={setDistance}
            placeholder="e.g., 100 yards"
            placeholderTextColor={colors.grey}
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
                keyboardType="numeric"
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
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={commonStyles.label}>Score (Points)</Text>
          <TextInput
            style={commonStyles.input}
            value={score}
            onChangeText={setScore}
            placeholder="e.g., 95, 180/200"
            placeholderTextColor={colors.grey}
          />

          <Text style={commonStyles.label}>Target Photo</Text>
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