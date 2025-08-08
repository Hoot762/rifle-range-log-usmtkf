
import { Text, View, SafeAreaView, ScrollView, StyleSheet, Platform } from 'react-native';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors, spacing, borderRadius, shadows, typography } from '../styles/commonStyles';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

export default function BuildHelpScreen() {
  const expoConfig = (Constants as any).expoConfig || {};
  const projectName = expoConfig?.name || 'Unknown';
  const androidPackage = expoConfig?.android?.package || 'Not set';
  const sdkVersion = expoConfig?.sdkVersion || '53';
  const newArchEnabled = Boolean(expoConfig?.newArchEnabled);
  const rnVersion = '0.79.2';
  const expoVersion = '53.0.9';

  const openGradleWarningDocs = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://docs.gradle.org/8.13/userguide/command_line_interface.html#sec:command_line_warnings');
    } catch (e) {
      console.log('Failed to open browser:', e);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={styles.headerIcon}>
            <Icon name="construct" size={48} style={{ color: colors.warning }} />
          </View>
          <Text style={styles.pageTitle}>Android Build & Deploy Help</Text>
          <Text style={styles.subtitle}>
            Use these tips to diagnose build issues and deployment errors. We&apos;ve also enabled detailed Gradle warnings in EAS to help pinpoint problems.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 12 }]}>
            Project Info
          </Text>
          <Text style={styles.info}>App Name: {projectName}</Text>
          <Text style={styles.info}>Android Package: {androidPackage}</Text>
          <Text style={styles.info}>Expo SDK: {sdkVersion}</Text>
          <Text style={styles.info}>React Native: {rnVersion}</Text>
          <Text style={styles.info}>Expo: {expoVersion}</Text>
          <Text style={styles.info}>New Architecture: {newArchEnabled ? 'Enabled' : 'Disabled'}</Text>
          <Text style={[styles.info, { marginBottom: 0 }]}>
            Running On: {Platform.OS.toUpperCase()}
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 12 }]}>
            Gradle Warnings
          </Text>
          <Text style={commonStyles.text}>
            We configured EAS Build to run with the Gradle flag --warning-mode=all across all build profiles (development, preview, production).
            This ensures more detailed warning output that can help diagnose issues earlier.
          </Text>
          <View style={styles.buttonRow}>
            <Button
              text="Open Gradle warning-mode docs"
              onPress={openGradleWarningDocs}
              style={buttonStyles.accent}
            />
          </View>
          <Text style={[commonStyles.text, styles.smallNote]}>
            After pushing these changes, re-run your EAS build to see detailed warnings in the EAS logs.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 12 }]}>
            Common Fixes For Android Build/Deploy
          </Text>
          <Text style={commonStyles.text}>
            1. Ensure Java 17 is used by the build system. Android Gradle Plugin 8 requires JDK 17. EAS uses the correct JDK by default.{'\n'}
            2. Clear caches and rebuild: In EAS Build UI, use the &quot;Clean caches&quot; option. This often fixes Gradle dependency cache issues.{'\n'}
            3. Prebuild if needed: If building locally, run &quot;expo prebuild -p android&quot; to regenerate native files (if you&apos;re using the prebuild workflow).{'\n'}
            4. Check package name: app.json &gt; android.package must remain consistent. Current: {androidPackage}{'\n'}
            5. New Architecture toggle: If third-party native modules fail, try disabling New Architecture temporarily by setting &quot;newArchEnabled&quot; to false in app.json and re-building.{'\n'}
            6. react-native-maps: If you plan to use maps, provide a Google Maps API key in app.json to avoid runtime issues. Builds may pass, but maps require keys at runtime.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 12 }]}>
            Reading EAS Build Logs
          </Text>
          <Text style={commonStyles.text}>
            - Search for &quot;FAILURE: Build failed with an exception&quot; to jump to the root cause.{'\n'}
            - Look for &quot;Caused by:&quot; sections near the failure for specific errors.{'\n'}
            - With warning-mode set to all, review deprecation notices or configuration warnings—these often indicate misconfigurations that can become errors.
          </Text>
        </View>

        <View style={commonStyles.buttonContainer}>
          <Button text="Back" onPress={goBack} style={buttonStyles.backButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  info: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  smallNote: {
    ...typography.small,
    color: colors.textMuted,
    opacity: 0.9,
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  buttonRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
