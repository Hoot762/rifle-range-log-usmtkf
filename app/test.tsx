
import React from 'react';
import { Text, View, SafeAreaView } from 'react-native';

export default function TestScreen() {
  console.log('TestScreen rendered successfully');
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F2419' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
          Test Screen
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginTop: 20 }}>
          If you can see this, the basic React Native functionality is working.
        </Text>
      </View>
    </SafeAreaView>
  );
}
