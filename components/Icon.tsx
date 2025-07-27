import { colors } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: any;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
      'checkmark': 'checkmark',
      'close': 'close',
      'camera': 'camera',
      'image': 'image',
      'document': 'document',
      'save': 'save',
      'download': 'download',
      'share': 'share',
    };
    
    return iconMap[iconName] || (iconName as keyof typeof Ionicons.glyphMap);
  };
  
  const iconName = getIconName(name as string);
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons 
        name={iconName} 
        size={size} 
        color={colors.text} 
      />
    </View>
  );
}