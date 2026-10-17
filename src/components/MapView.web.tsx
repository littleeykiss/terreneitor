import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import L from 'leaflet';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  initialRegion?: MapRegion;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  children?: React.ReactNode;
}

/**
 * Componente de mapa para WEB:
 * Usa Leaflet con las imágenes satelitales de alta resolución de Esri World Imagery (gratuito).
 */
export default function MapView({ style, initialRegion, children }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Inyectar CSS de Leaflet si no está presente
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

    const map = L.map(containerRef.current).setView([lat, lng], 15);

    // Esri World Imagery (Vista satelital de alta resolución, gratuita)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size en caso de que tarde un tick en tener dimensiones finales
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
