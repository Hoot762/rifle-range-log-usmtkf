import { colors } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: ViewStyle & { color?: string };
}

export default function Icon({ name, size = 24, style }: IconProps) {
  // Map custom icon names to actual Ionicons
  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'rifle': 'radio-button-on',
      'target': 'radio-button-on',
      'pencil': 'pencil',
      'trash': 'trash',
      'arrow-back': 'arrow-back',
      'add': 'add',
      'add-circle': 'add-circle',
      'checkmark': 'checkmark',
      'close': 'close',
      'camera': 'camera',
      'image': 'image',
      'document': 'document',
      'document-text': 'document-text',
      'save': 'save',
      'download': 'download',
      'share': 'share',
      'list': 'list',
      'create': 'create',
      'calendar': 'calendar',
      'chevron-up': 'chevron-up',
      'chevron-down': 'chevron-down',
      'expand': 'expand',
      'warning': 'warning',
      'information-circle': 'information-circle',
      'construct': 'construct',
    };
    
    return iconMap[iconName] || (iconName as keyof typeof Ionicons.glyphMap);
  };
  
  const iconName = getIconName(name as string);
  const iconColor = style?.color || colors.text;
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons 
        name={iconName} 
        size={size} 
        color={iconColor} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});