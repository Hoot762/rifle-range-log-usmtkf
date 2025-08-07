
import React from 'react';
import { Text, View, SafeAreaView } from 'react-native';
import { commonStyles } from '../styles/commonStyles';

export default function TestScreen() {
  console.log('TestScreen rendered successfully');
  
  return (
    <SafeAreaView style={commonStyles.wrapper}>
      <View style={commonStyles.container}>
        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>Test Screen</Text>
          <Text style={commonStyles.text}>
            If you can see this, the basic app structure is working.
          </Text>
          <Text style={commonStyles.text}>
            Check the console for any error messages.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
