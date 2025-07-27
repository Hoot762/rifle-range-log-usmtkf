import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import { StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  headerCell: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rangeCell: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  dataInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 5,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 30,
  },
  listContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
  },
  rangeData: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  rangeHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  rangeHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  rangeText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  rangeValue: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
    paddingHorizontal: 20,
  },
});

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
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {editingCard ? 'Edit DOPE Card' : 'Add New DOPE Card'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Rifle Name</Text>
        <TextInput
          style={styles.input}
          value={rifleName}
          onChangeText={setRifleName}
          placeholder="Enter rifle name"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Caliber</Text>
        <TextInput
          style={styles.input}
          value={caliber}
          onChangeText={setCaliber}
          placeholder="Enter caliber"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <Text style={styles.sectionTitle}>Range Data (MOA)</Text>
      
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Range</Text>
        <Text style={styles.headerCell}>Elevation</Text>
        <Text style={styles.headerCell}>Windage</Text>
      </View>

      {RANGES.map(range => (
        <View key={range} style={styles.tableRow}>
          <Text style={styles.rangeCell}>{range} yards</Text>
          <TextInput
            style={styles.dataInput}
            value={ranges[range]?.elevation || ''}
            onChangeText={(value) => updateRange(range, 'elevation', value)}
            placeholder="0.0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.dataInput}
            value={ranges[range]?.windage || ''}
            onChangeText={(value) => updateRange(range, 'windage', value)}
            placeholder="0.0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      ))}

      <View style={styles.formButtons}>
        <Button
          text="Cancel"
          onPress={cancelEditing}
          style={[buttonStyles.secondary, { flex: 1, marginRight: 10 }]}
        />
        <Button
          text={editingCard ? "Update" : "Save"}
          onPress={saveCard}
          style={[buttonStyles.primary, { flex: 1 }]}
        />
      </View>
    </View>
  );

  const renderCardsList = () => (
    <View style={styles.listContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>DOPE Cards</Text>
        <Button
          text="Add New"
          onPress={startAddingCard}
          style={buttonStyles.primary}
        />
      </View>

      {dopeCards.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="target" size={60} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyText}>No DOPE cards yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first DOPE card to track rifle data
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.cardsList}>
          {dopeCards.map(card => (
            <View key={card.id} style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{card.rifleName}</Text>
                  <Text style={styles.cardSubtitle}>{card.caliber}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEditingCard(card)}
                  >
                    <Icon name="pencil" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDeleteCard(card.id)}
                  >
                    <Icon name="trash" size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rangeData}>
                <View style={styles.rangeHeader}>
                  <Text style={styles.rangeHeaderText}>Range</Text>
                  <Text style={styles.rangeHeaderText}>Elev</Text>
                  <Text style={styles.rangeHeaderText}>Wind</Text>
                </View>
                {RANGES.map(range => (
                  <View key={range} style={styles.rangeRow}>
                    <Text style={styles.rangeText}>{range}y</Text>
                    <Text style={styles.rangeValue}>
                      {card.ranges[range]?.elevation || '-'}
                    </Text>
                    <Text style={styles.rangeValue}>
                      {card.ranges[range]?.windage || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {isAddingCard ? renderCardForm() : renderCardsList()}
        </ScrollView>

        <Modal
          visible={showDeleteConfirm !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Delete</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this DOPE card? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  text="Cancel"
                  onPress={() => setShowDeleteConfirm(null)}
                  style={[buttonStyles.secondary, { flex: 1, marginRight: 10 }]}
                />
                <Button
                  text="Delete"
                  onPress={() => showDeleteConfirm && deleteCard(showDeleteConfirm)}
                  style={[buttonStyles.danger, { flex: 1 }]}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}