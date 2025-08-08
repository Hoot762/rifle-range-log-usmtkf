import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  // Modern color palette with better contrast and accessibility
  primary: '#0F172A',        // Slate 900 - deep navy
  secondary: '#1E293B',      // Slate 800 - lighter navy
  accent: '#3B82F6',         // Blue 500 - modern blue
  accentLight: '#60A5FA',    // Blue 400 - lighter blue
  background: '#020617',     // Slate 950 - very dark navy
  backgroundAlt: '#0F172A',  // Slate 900 - for cards
  surface: '#1E293B',        // Slate 800 - surface elements
  surfaceLight: '#334155',   // Slate 700 - lighter surface
  text: '#F8FAFC',          // Slate 50 - primary text
  textSecondary: '#CBD5E1',  // Slate 300 - secondary text
  textMuted: '#94A3B8',      // Slate 400 - muted text
  grey: '#64748B',          // Slate 500 - grey accent
  lightGrey: '#E2E8F0',     // Slate 200 - light grey
  success: '#10B981',       // Emerald 500 - success green
  warning: '#F59E0B',       // Amber 500 - warning orange
  error: '#EF4444',         // Red 500 - error red
  inputBackground: '#1E293B', // Slate 800 - input background
  border: '#334155',        // Slate 700 - borders
  borderLight: '#475569',   // Slate 600 - lighter borders
  
  // Semantic colors
  dopeButton: '#8B5CF6',    // Violet 500 - distinctive purple
  card: '#1E293B',          // Slate 800 - card background
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    alignSelf: 'center',
    width: '100%',
    ...shadows.md,
  },
  secondary: {
    backgroundColor: colors.surface,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  accent: {
    backgroundColor: colors.warning,
    alignSelf: 'center',
    width: '100%',
    ...shadows.md,
  },
  success: {
    backgroundColor: colors.success,
    alignSelf: 'center',
    width: '100%',
    ...shadows.md,
  },
  dopeButton: {
    backgroundColor: colors.dopeButton,
    alignSelf: 'center',
    width: '100%',
    ...shadows.md,
  },
  danger: {
    backgroundColor: colors.error,
    alignSelf: 'center',
    width: '100%',
    ...shadows.md,
  },
  backButton: {
    backgroundColor: colors.surfaceLight,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  ghost: {
    backgroundColor: 'transparent',
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  textLeft: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  textSecondary: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  textMuted: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    width: '100%',
    ...shadows.md,
  },
  cardCompact: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    width: '100%',
    ...shadows.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    width: '100%',
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    ...shadows.sm,
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
    ...shadows.md,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  labelSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  rowStart: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  halfWidth: {
    width: '48%',
  },
  thirdWidth: {
    width: '30%',
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.text,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: spacing.md,
  },
  glassmorphism: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backdropFilter: 'blur(10px)',
  },
});