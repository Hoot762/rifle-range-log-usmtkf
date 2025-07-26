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
  // Map rifle to a target icon since rifle might not exist
  const iconName = name === 'rifle' ? 'radio-button-on' : name;
  
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