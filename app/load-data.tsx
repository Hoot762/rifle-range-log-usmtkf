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
}Now I can see the current implementation of the `loadSampleData` function. It already shows an Alert with "Sample data loaded successfully!" when the data is loaded successfully. However, looking at the user's request, they want a confirmation message saying "its been loaded" when they click the Load Sample Data button.

The current implementation already has this functionality with `Alert.alert('Success', 'Sample data loaded successfully!');`. Let me check if there might be an issue with the current implementation or if the user wants a different type of confirmation message.

Looking at the code, the confirmation message is already implemented correctly. The `loadSampleData` function shows:
- `Alert.alert('Success', 'Sample data loaded successfully!');` on success
- `Alert.alert('Error', 'Failed to load sample data');` on error

This should already provide the confirmation message the user is requesting. However, let me make a small improvement to make the confirmation message more explicit and user-friendly as requested:

app/load-data.tsx