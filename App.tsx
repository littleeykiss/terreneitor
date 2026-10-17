import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView from './src/components/MapView';
import { Coordinate, TerrainPolygon } from './src/types';
import { searchPlaces, PlaceResult } from './src/services/geocoding';

export default function App() {
  // ==========================================
  // ESTADOS DEL MAPA Y DIBUJO (Paso 1 y 2)
  // ==========================================
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activePoints, setActivePoints] = useState<Coordinate[]>([]);
  const [polygons, setPolygons] = useState<TerrainPolygon[]>([]);
  const [centerCoordinate, setCenterCoordinate] = useState<Coordinate | null>(null);

  // ==========================================
  // ESTADOS DEL BUSCADOR DE LUGARES
  // ==========================================
  // searchQuery: guarda el texto ingresado en el input
  // searchResults: lista de resultados sugeridos por Nominatim
  // isSearching: flag booleano para mostrar el spinner de carga
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // ==========================================
  // CONTROLADORES DEL BUSCADOR
  // ==========================================

  // Ejecuta la búsqueda en el servicio externo (asíncrono con async/await)
  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    Keyboard.dismiss();
    setIsSearching(true);
    const results = await searchPlaces(searchQuery);
    setSearchResults(results);
    setIsSearching(false);

    // Si encontró resultados, centramos inmediatamente en el más relevante:
    if (results.length > 0) {
      setCenterCoordinate(results[0].coordinate);
    }
  };

  // Al hacer clic en un resultado de la lista desplegable:
  const handleSelectPlace = (place: PlaceResult) => {
    setCenterCoordinate(place.coordinate);
    setSearchQuery(place.name);
    setSearchResults([]); // Oculta la lista desplegable
    Keyboard.dismiss();
  };

  // Limpiar el buscador
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // ==========================================
  // CONTROLADORES DE DIBUJO DE POLÍGONOS
  // ==========================================

  const handleMapPress = (coord: Coordinate) => {
    // Si hay resultados de búsqueda abiertos, tocamos el mapa para cerrarlos
    if (searchResults.length > 0) {
      setSearchResults([]);
    }

    if (!isDrawing) return;

    setActivePoints((prevPoints) => [...prevPoints, coord]);
  };

  const handleUndo = () => {
    setActivePoints((prevPoints) => prevPoints.slice(0, -1));
  };

  const handleCancel = () => {
    setActivePoints([]);
    setIsDrawing(false);
  };

  const handleFinish = () => {
    if (activePoints.length < 3) return;

    const newPolygon: TerrainPolygon = {
      id: Date.now().toString(),
      coordinates: activePoints,
      color: '#10b981',
    };

    setPolygons((prevPolygons) => [...prevPolygons, newPolygon]);
    setActivePoints([]);
    setIsDrawing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* MAPA PRINCIPAL */}
      <MapView
        style={styles.map}
        mapType="satellite"
        initialRegion={{
          latitude: 20.659698,
          longitude: -103.349609,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        centerCoordinate={centerCoordinate}
        onMapPress={handleMapPress}
        activePoints={activePoints}
        polygons={polygons}
      />

      {/* =================================================== */}
      {/* BUSCADOR DE CIUDAD O LUGAR (Barra superior)        */}
      {/* =================================================== */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          {/* TextInput en React Native es el equivalente a JTextField en Java */}
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Buscar ciudad, colonia o lugar..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length === 0) setSearchResults([]);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />

          {/* Botón para borrar el texto (si hay algo escrito) */}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Botón de buscar o spinner de carga */}
          {isSearching ? (
            <ActivityIndicator size="small" color="#38bdf8" style={styles.spinner} />
          ) : (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista desplegable con sugerencias de lugares encontrados */}
        {searchResults.length > 0 && (
          <View style={styles.resultsList}>
            {searchResults.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.resultItem}
                onPress={() => handleSelectPlace(place)}
                activeOpacity={0.7}
              >
                <Text style={styles.resultName}>📍 {place.name}</Text>
                <Text style={styles.resultDetails} numberOfLines={1}>
                  {place.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* =================================================== */}
      {/* PANEL FLOTANTE DE DIBUJO (Barra inferior)           */}
      {/* =================================================== */}
      <View style={styles.controlPanel}>
        {!isDrawing ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setSearchResults([]);
              setIsDrawing(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>✏️ Dibujar terreno</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.drawingControls}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                📍 Puntos: <Text style={styles.boldText}>{activePoints.length}</Text>
                {activePoints.length < 3 && ' (mínimo 3)'}
              </Text>
              <Text style={styles.hintText}>Toca el mapa para agregar vértices</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.undoButton,
                  activePoints.length === 0 && styles.disabledButton,
                ]}
                onPress={handleUndo}
                disabled={activePoints.length === 0}
              >
                <Text style={styles.actionButtonText}>↩ Deshacer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.finishButton,
                  activePoints.length < 3 && styles.disabledButton,
                ]}
                onPress={handleFinish}
                disabled={activePoints.length < 3}
              >
                <Text style={styles.actionButtonText}>✓ Terminar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.actionButtonText}>✕ Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
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
  // ==========================================
  // ESTILOS DEL BUSCADOR (Top Bar)
  // ==========================================
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 2000,
    maxWidth: 540,
    alignSelf: 'center',
    width: '92%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 8,
    paddingRight: 8,
    outlineStyle: 'none', // En web quita el contorno azul por defecto
  } as any,
  clearButton: {
    padding: 6,
    marginRight: 4,
  },
  clearButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  spinner: {
    paddingHorizontal: 8,
  },
  resultsList: {
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  resultName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultDetails: {
    color: '#94a3b8',
    fontSize: 12,
  },
  // ==========================================
  // ESTILOS DE DIBUJO (Bottom Panel)
  // ==========================================
  controlPanel: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawingControls: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    marginBottom: 10,
    alignItems: 'center',
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  hintText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  undoButton: {
    backgroundColor: '#475569',
  },
  finishButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.4,
  },
});
