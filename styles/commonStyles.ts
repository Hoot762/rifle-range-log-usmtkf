import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  primary: '#1B4332',      // Dark green
  secondary: '#2D5A3D',    // Medium green
  accent: '#FF8C00',       // Orange accent
  background: '#0F2419',   // Very dark green
  backgroundAlt: '#1B4332', // Dark green for cards
  surface: '#2D5A3D',      // Surface color for cards and inputs
  text: '#FFFFFF',         // White text
  textSecondary: '#B0B0B0', // Secondary text color
  grey: '#d4f5e9',         // Grey accent
  lightGrey: '#D3D3D3',    // Light grey //#D3D3D3
  dopeButton: '#FF9F0A',   // DOPE button color
  card: '#2D5A3D',         // Medium green for cards
  success: '#40916C',      // Success green
  error: '#DC3545',        // Error red
  inputBackground: '#2D5A3D',
  border: '#40916C',
};

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  secondary: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
  },
  accent: {
    backgroundColor: colors.accent,
    alignSelf: 'center',
    width: '100%',
  },
  lightGrey: {
    backgroundColor: colors.lightGrey,
    alignSelf: 'center',
    width: '100%',
  },
  dopeButton: {
    backgroundColor: colors.dopeButton,
    alignSelf: 'center',
    width: '100%',
  },
  danger: {
    backgroundColor: colors.error,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.grey,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    width: '100%',
    color: colors.text,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  halfWidth: {
    width: '48%',
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.text,
  },
});