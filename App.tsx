import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView from './src/components/MapView';
import { Coordinate, TerrainPolygon } from './src/types';
import { searchPlaces, reverseGeocode, PlaceResult } from './src/services/geocoding';
import { calculatePolygonArea, calculateCentroid } from './src/utils/geoUtils';
import { terrainRepository } from './src/repositories/terrainRepository';

export default function App() {
  // ==========================================
  // ESTADOS DEL MAPA Y DIBUJO
  // ==========================================
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activePoints, setActivePoints] = useState<Coordinate[]>([]);
  const [polygons, setPolygons] = useState<TerrainPolygon[]>([]);
  const [centerCoordinate, setCenterCoordinate] = useState<Coordinate | null>(null);

  // ==========================================
  // ESTADOS DEL BUSCADOR
  // ==========================================
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // ==========================================
  // MODAL 1: GUARDAR Y ETIQUETAR TERRENO
  // ==========================================
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [lotName, setLotName] = useState<string>('');
  const [lotAddress, setLotAddress] = useState<string>('');
  const [lotNotes, setLotNotes] = useState<string>('');
  const [calculatedArea, setCalculatedArea] = useState<{ areaM2: number; areaHectares: number }>({
    areaM2: 0,
    areaHectares: 0,
  });
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  // ==========================================
  // MODAL 2: BODEGA / CATÁLOGO DE TERRENOS
  // ==========================================
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);

  // ==========================================
  // CARGA INICIAL (Cargar terrenos guardados)
  // ==========================================
  useEffect(() => {
    // Al abrir la app, recuperamos los terrenos de la base local (AsyncStorage/localStorage)
    terrainRepository.getAll().then((loaded) => {
      setPolygons(loaded);
    });
  }, []);

  // ==========================================
  // CONTROLADORES DE BÚSQUEDA
  // ==========================================
  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    Keyboard.dismiss();
    setIsSearching(true);
    const results = await searchPlaces(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
    if (results.length > 0) {
      setCenterCoordinate(results[0].coordinate);
    }
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setCenterCoordinate(place.coordinate);
    setSearchQuery(place.name);
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // ==========================================
  // CONTROLADORES DE DIBUJO
  // ==========================================
  const handleMapPress = (coord: Coordinate) => {
    if (searchResults.length > 0) setSearchResults([]);
    if (!isDrawing) return;
    setActivePoints((prev) => [...prev, coord]);
  };

  const handleUndo = () => {
    setActivePoints((prev) => prev.slice(0, -1));
  };

  const handleCancel = () => {
    setActivePoints([]);
    setIsDrawing(false);
  };

  // Al presionar "Terminar": calculamos el área y abrimos el modal de etiquetado
  const handleFinishDrawing = async () => {
    if (activePoints.length < 3) return;

    // 1. Calcular área con @turf/area
    const area = calculatePolygonArea(activePoints);
    setCalculatedArea(area);

    // 2. Pre-llenar valores por defecto
    const defaultLotNumber = polygons.length + 1;
    setLotName(`Terreno #${defaultLotNumber}`);
    setLotNotes('');
    setLotAddress('');
    setShowSaveModal(true);

    // 3. Obtener la dirección aproximada en segundo plano
    const centroid = calculateCentroid(activePoints);
    setIsReverseGeocoding(true);
    const address = await reverseGeocode(centroid);
    setLotAddress(address);
    setIsReverseGeocoding(false);
  };

  // Confirmar y guardar el terreno en el repositorio
  const handleConfirmSave = async () => {
    if (!lotName.trim()) return;

    const newPolygon: TerrainPolygon = {
      id: Date.now().toString(),
      name: lotName.trim(),
      address: lotAddress.trim() || undefined,
      areaM2: calculatedArea.areaM2,
      areaHectares: calculatedArea.areaHectares,
      notes: lotNotes.trim() || undefined,
      coordinates: activePoints,
      color: '#10b981',
      createdAt: Date.now(),
    };

    // Guardar en repositorio (persistencia local)
    await terrainRepository.save(newPolygon);

    // Actualizar estado reactivo
    setPolygons((prev) => [newPolygon, ...prev]);
    setActivePoints([]);
    setIsDrawing(false);
    setShowSaveModal(false);
  };

  // Eliminar un terreno de la bodega
  const handleDeleteTerrain = async (id: string) => {
    await terrainRepository.delete(id);
    setPolygons((prev) => prev.filter((p) => p.id !== id));
  };

  // Ver un terreno guardado en el mapa
  const handleFocusTerrain = (terrain: TerrainPolygon) => {
    const centroid = calculateCentroid(terrain.coordinates);
    setCenterCoordinate(centroid);
    setShowCatalogModal(false);
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
        onPolygonPress={(poly) => {
          // Al hacer clic en un polígono en el mapa, podemos ver sus detalles
          alert(`📍 ${poly.name}\nÁrea: ${poly.areaM2.toLocaleString('es-MX')} m² (${poly.areaHectares} ha)\n${poly.address || ''}`);
        }}
        activePoints={activePoints}
        polygons={polygons}
      />

      {/* =================================================== */}
      {/* BARRA SUPERIOR: BUSCADOR + BOTÓN CATÁLOGO           */}
      {/* =================================================== */}
      <View style={styles.topContainer}>
        <View style={styles.searchRow}>
          {/* Buscador */}
          <View style={styles.searchBar}>
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

            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}

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

          {/* Botón Bodega / Catálogo */}
          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => setShowCatalogModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.catalogButtonText}>
              📁 Bodega ({polygons.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resultados del buscador */}
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
      {/* PANEL INFERIOR: CONTROLES DE DIBUJO                */}
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
                📍 Vértices: <Text style={styles.boldText}>{activePoints.length}</Text>
                {activePoints.length < 3 && ' (mínimo 3 para cerrar)'}
              </Text>
              <Text style={styles.hintText}>Toca el mapa para agregar límites</Text>
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
                onPress={handleFinishDrawing}
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

      {/* =================================================== */}
      {/* MODAL 1: GUARDAR Y ETIQUETAR TERRENO               */}
      {/* =================================================== */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🏷️ Guardar Terreno</Text>

            {/* Ficha de área calculada con @turf/area */}
            <View style={styles.areaBadge}>
              <Text style={styles.areaBadgeTitle}>Área calculada:</Text>
              <Text style={styles.areaBadgeValue}>
                {calculatedArea.areaM2.toLocaleString('es-MX')} m²
                <Text style={styles.areaBadgeSub}> ({calculatedArea.areaHectares} ha)</Text>
              </Text>
            </View>

            {/* Campo: Nombre / Etiqueta */}
            <Text style={styles.inputLabel}>Nombre o Etiqueta:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Terreno Los Laureles - Lote 3"
              placeholderTextColor="#64748b"
              value={lotName}
              onChangeText={setLotName}
            />

            {/* Campo: Dirección */}
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Dirección / Ubicación:</Text>
              {isReverseGeocoding && (
                <Text style={styles.detectingText}>Detectando dirección...</Text>
              )}
            </View>
            <TextInput
              style={[styles.modalInput, styles.addressInput]}
              placeholder="Ubicación o referencia"
              placeholderTextColor="#64748b"
              value={lotAddress}
              onChangeText={setLotAddress}
              multiline
            />

            {/* Campo: Notas */}
            <Text style={styles.inputLabel}>Notas rápidas (opcional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Frente a calle pavimentada, con luz..."
              placeholderTextColor="#64748b"
              value={lotNotes}
              onChangeText={setLotNotes}
            />

            {/* Botones del Modal */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelText}>Descartar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleConfirmSave}
              >
                <Text style={styles.modalSaveText}>💾 Guardar en Bodega</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================== */}
      {/* MODAL 2: BODEGA / CATÁLOGO DE TERRENOS             */}
      {/* =================================================== */}
      <Modal
        visible={showCatalogModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCatalogModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.catalogCard]}>
            <View style={styles.catalogHeader}>
              <Text style={styles.modalTitle}>📁 Bodega de Terrenos</Text>
              <TouchableOpacity
                onPress={() => setShowCatalogModal(false)}
                style={styles.closeModalButton}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {polygons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏞️</Text>
                <Text style={styles.emptyTitle}>Aún no hay terrenos guardados</Text>
                <Text style={styles.emptySubtitle}>
                  Usa el botón "Dibujar terreno" en el mapa para delimitar tu primer lote y guardarlo.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.catalogScroll}>
                {polygons.map((terrain) => (
                  <View key={terrain.id} style={styles.terrainItem}>
                    <View style={styles.terrainItemHeader}>
                      <Text style={styles.terrainItemName}>{terrain.name}</Text>
                      <View style={styles.areaTag}>
                        <Text style={styles.areaTagText}>
                          {terrain.areaM2.toLocaleString('es-MX')} m²
                        </Text>
                      </View>
                    </View>

                    {terrain.areaHectares > 0 && (
                      <Text style={styles.hectaresText}>
                        Equivalente a: {terrain.areaHectares} ha
                      </Text>
                    )}

                    {terrain.address && (
                      <Text style={styles.terrainAddress} numberOfLines={2}>
                        📍 {terrain.address}
                      </Text>
                    )}

                    {terrain.notes && (
                      <Text style={styles.terrainNotes} numberOfLines={2}>
                        📝 {terrain.notes}
                      </Text>
                    )}

                    {/* Acciones del terreno */}
                    <View style={styles.terrainItemActions}>
                      <TouchableOpacity
                        style={styles.viewOnMapButton}
                        onPress={() => handleFocusTerrain(terrain)}
                      >
                        <Text style={styles.viewOnMapText}>🔍 Ver en mapa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteTerrain(terrain.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️ Borrar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
  // TOP BAR (Buscador + Bodega)
  // ==========================================
  topContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 2000,
    maxWidth: 680,
    alignSelf: 'center',
    width: '95%',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 4,
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
    fontSize: 14,
    paddingVertical: 8,
    paddingRight: 6,
    outlineStyle: 'none',
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  catalogButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  catalogButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold',
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
    paddingVertical: 10,
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
  // PANEL DE DIBUJO (Inferior)
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
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
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
  // ==========================================
  // MODALES (Guardado y Bodega)
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  areaBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  areaBadgeTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
  },
  areaBadgeValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  areaBadgeSub: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: 'normal',
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectingText: {
    color: '#38bdf8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    outlineStyle: 'none',
  } as any,
  addressInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  modalCancelText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Estilos de la Bodega / Catálogo
  catalogCard: {
    maxHeight: '80%',
    display: 'flex',
  },
  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  closeModalButton: {
    padding: 6,
  },
  closeModalText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  catalogScroll: {
    flexGrow: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  terrainItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  terrainItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  terrainItemName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  areaTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  areaTagText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hectaresText: {
    color: '#93c5fd',
    fontSize: 12,
    marginBottom: 6,
  },
  terrainAddress: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
  terrainNotes: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  terrainItemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewOnMapButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewOnMapText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  deleteButtonText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
});
