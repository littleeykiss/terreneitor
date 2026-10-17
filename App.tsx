import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      {/* 
        MapView es el componente principal para renderizar el mapa nativo.
        - mapType="satellite": Activa la vista satelital (también existe "hybrid" si quisieras ver nombres de calles sobre el satélite).
        - initialRegion: Define la ubicación y el zoom inicial (latitud, longitud y deltas).
      */}
      <MapView
        style={styles.map}
        mapType="satellite"
        initialRegion={{
          latitude: 20.659698, // Guadalajara, México como punto de partida inicial
          longitude: -103.349609,
          latitudeDelta: 0.05, // Controla el nivel de zoom (menor delta = más zoom)
          longitudeDelta: 0.05,
        }}
      />
      {/* StatusBar configura el color de la barra superior del celular (batería, hora, wifi) */}
      <StatusBar style="light" />
    </View>
  );
}

// En React Native no se usa CSS tradicional, sino StyleSheet:
// Es un objeto JS que optimiza los estilos para los componentes nativos.
const styles = StyleSheet.create({
  container: {
    flex: 1, // flex: 1 indica que ocupe todo el espacio disponible en pantalla
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
