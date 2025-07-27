import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';

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

  const updateRange = (range: string, field: 'elevation' | 'windage', value: string) => {
    setRanges(prev => ({
      ...prev,
      [range]: {
        ...prev[range],
        [field]: value
      }
    }));
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
            <TextInput
              style={[commonStyles.input, {
                flex: 1,
                marginHorizontal: 5,
                marginVertical: 4,
                textAlign: 'center',
                padding: 8,
              }]}
              value={ranges[range]?.elevation || ''}
              onChangeText={(value) => updateRange(range, 'elevation', value)}
              placeholder="0.0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <TextInput
              style={[commonStyles.input, {
                flex: 1,
                marginHorizontal: 5,
                marginVertical: 4,
                textAlign: 'center',
                padding: 8,
              }]}
              value={ranges[range]?.windage || ''}
              onChangeText={(value) => updateRange(range, 'windage', value)}
              placeholder="0.0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
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
            <View style={commonStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                  {card.rifleName}
                </Text>
                <Text style={[commonStyles.text, { textAlign: 'left' }]}>
                  Caliber: {card.caliber}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => startEditingCard(card)}
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 12, marginBottom: 0, color: colors.background }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDeleteCard(card.id)}
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
            </View>

            <View style={{
              backgroundColor: colors.secondary,
              borderRadius: 8,
              padding: 12,
              marginTop: 10,
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
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={goBack} style={commonStyles.backButton}>
            <Icon name="arrow-back" size={24} />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>
            {isAddingCard ? (editingCard ? 'Edit DOPE Card' : 'Add DOPE Card') : 'DOPE Cards'}
          </Text>
        </View>

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
      </View>
    </SafeAreaView>
  );
}