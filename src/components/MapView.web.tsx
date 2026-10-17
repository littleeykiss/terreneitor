import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import L from 'leaflet';
import { Coordinate, TerrainPolygon } from '../types';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  initialRegion?: MapRegion;
  centerCoordinate?: Coordinate | null;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  onMapPress?: (coord: Coordinate) => void;
  activePoints?: Coordinate[];
  polygons?: TerrainPolygon[];
  children?: React.ReactNode;
}

export default function MapView({
  style,
  initialRegion,
  centerCoordinate,
  onMapPress,
  activePoints = [],
  polygons = [],
  children,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Guardamos las capas de Leaflet en refs para manipularlas sin reconstruir el mapa:
  const drawLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);

  // Mantenemos una referencia al callback actual para evitar cierres obsoletos (stale closures):
  const onMapPressRef = useRef(onMapPress);
  useEffect(() => {
    onMapPressRef.current = onMapPress;
  }, [onMapPress]);

  // Inicialización del mapa (solo corre una vez al montar):
  useEffect(() => {
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!containerRef.current || mapInstanceRef.current) return;

    const lat = initialRegion?.latitude ?? 20.659698;
    const lng = initialRegion?.longitude ?? -103.349609;

    const map = L.map(containerRef.current, {
      zoomControl: true,
    }).setView([lat, lng], 15);

    // Esri World Imagery (satelital gratis)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }
    ).addTo(map);

    // Capas para dibujo y polígonos guardados
    drawLayerRef.current = L.layerGroup().addTo(map);
    polygonLayerRef.current = L.layerGroup().addTo(map);

    // Listener de clic en el mapa:
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapPressRef.current) {
        onMapPressRef.current({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Efecto reactivo: Redibuja los puntos y líneas en proceso de dibujo
  useEffect(() => {
    if (!drawLayerRef.current) return;
    drawLayerRef.current.clearLayers();

    if (activePoints.length === 0) return;

    const latLngs: L.LatLngTuple[] = activePoints.map((pt) => [
      pt.latitude,
      pt.longitude,
    ]);

    // Dibuja la línea que conecta los puntos
    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: '#38bdf8',
        weight: 3,
        dashArray: '6, 6',
      }).addTo(drawLayerRef.current);
    }

    // Dibuja un marcador circular en cada vértice marcado
    latLngs.forEach(([lat, lng], index) => {
      L.circleMarker([lat, lng], {
        radius: 6,
        color: '#0284c7',
        fillColor: index === 0 ? '#22c55e' : '#ffffff', // El primer punto en verde
        fillOpacity: 1,
        weight: 2,
      }).addTo(drawLayerRef.current!);
    });
  }, [activePoints]);

  // Efecto reactivo: Redibuja los polígonos ya terminados
  useEffect(() => {
    if (!polygonLayerRef.current) return;
    polygonLayerRef.current.clearLayers();

    polygons.forEach((poly) => {
      const latLngs: L.LatLngTuple[] = poly.coordinates.map((pt) => [
        pt.latitude,
        pt.longitude,
      ]);

      if (latLngs.length >= 3) {
        L.polygon(latLngs, {
          color: poly.color || '#10b981',
          fillColor: poly.color || '#10b981',
          fillOpacity: 0.35,
          weight: 3,
        }).addTo(polygonLayerRef.current!);
      }
    });
  }, [polygons]);

  // Efecto reactivo: Mueve la cámara suavemente al centro buscado
  useEffect(() => {
    if (!mapInstanceRef.current || !centerCoordinate) return;
    mapInstanceRef.current.flyTo(
      [centerCoordinate.latitude, centerCoordinate.longitude],
      16,
      { duration: 1.5 }
    );
  }, [centerCoordinate]);

  return (
    <View style={[styles.container, style]}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
});
