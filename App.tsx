import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView from './src/components/MapView';

export default function App() {
  return (
    <View style={styles.container}>
      {/* 
        MapView ahora es multiplataforma:
        - En la Web (navegador): usa Leaflet con imágenes satelitales gratuitas de Esri.
        - En Celular (Android/iOS): usa react-native-maps.
      */}
      <MapView
        style={styles.map}
        mapType="satellite"
        initialRegion={{
          latitude: 20.659698, // Guadalajara, México
          longitude: -103.349609,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
