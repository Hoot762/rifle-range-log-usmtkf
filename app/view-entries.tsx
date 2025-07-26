import { Text, View, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
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
  timestamp: number;
}

export default function ViewEntriesScreen() {
  console.log('ViewEntriesScreen rendered');

  const [entries, setEntries] = useState<RangeEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const goBack = () => {
    console.log('Going back to home screen');
    router.back();
  };

  const EntryCard = ({ entry }: { entry: RangeEntry }) => (
    <View style={commonStyles.card}>
      <View style={commonStyles.row}>
        <Text style={[commonStyles.subtitle, { flex: 1 }]}>{entry.rifleName}</Text>
        <Button
          text="Delete"
          onPress={() => deleteEntry(entry.id)}
          style={[buttonStyles.backButton, { width: 80, height: 35 }]}
          textStyle={{ fontSize: 12 }}
        />
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
      
      {entry.notes && (
        <Text style={[commonStyles.text, { fontStyle: 'italic', marginTop: 8 }]}>
          Notes: {entry.notes}
        </Text>
      )}
    </View>
  );

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
    </SafeAreaView>
  );
}