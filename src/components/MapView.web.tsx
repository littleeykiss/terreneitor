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
  onPolygonPress?: (polygon: TerrainPolygon) => void;
  activePoints?: Coordinate[];
  polygons?: TerrainPolygon[];
  children?: React.ReactNode;
}

export default function MapView({
  style,
  initialRegion,
  centerCoordinate,
  onMapPress,
  onPolygonPress,
  activePoints = [],
  polygons = [],
  children,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const drawLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);

  const onMapPressRef = useRef(onMapPress);
  useEffect(() => {
    onMapPressRef.current = onMapPress;
  }, [onMapPress]);

  const onPolygonPressRef = useRef(onPolygonPress);
  useEffect(() => {
    onPolygonPressRef.current = onPolygonPress;
  }, [onPolygonPress]);

  // Inicialización del mapa:
  useEffect(() => {
    // Inyectar CSS de Leaflet y estilo para etiquetas de terrenos
    const cssId = 'leaflet-custom-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const styleEl = document.createElement('style');
      styleEl.id = cssId;
      styleEl.innerHTML = `
        .polygon-label {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid #10b981 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5) !important;
          text-align: center !important;
          white-space: nowrap !important;
        }
        .polygon-label::before {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    if (!containerRef.current || mapInstanceRef.current) return;

    const lat = initialRegion?.latitude ?? 20.659698;
    const lng = initialRegion?.longitude ?? -103.349609;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      maxZoom: 22, // Permite zoom profundo
    }).setView([lat, lng], 16);

    // SOLUCIÓN AL ZOOM QUE SE ROMPÍA:
    // Usamos capa satelital híbrida (Google Hybrid con satélite + nombres de calles)
    // Con maxNativeZoom: 20 y maxZoom: 22, Leaflet escala los mosaicos si el usuario
    // hace zoom extremo, evitando que se muestren cuadros grises o rotos.
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: 'Google Maps Satellite',
      maxZoom: 22,
      maxNativeZoom: 20,
    }).addTo(map);

    drawLayerRef.current = L.layerGroup().addTo(map);
    polygonLayerRef.current = L.layerGroup().addTo(map);

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

  // Efecto reactivo: Vértices y líneas de dibujo en curso
  useEffect(() => {
    if (!drawLayerRef.current) return;
    drawLayerRef.current.clearLayers();

    if (activePoints.length === 0) return;

    const latLngs: L.LatLngTuple[] = activePoints.map((pt) => [
      pt.latitude,
      pt.longitude,
    ]);

    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: '#38bdf8',
        weight: 3,
        dashArray: '6, 6',
      }).addTo(drawLayerRef.current);
    }

    latLngs.forEach(([lat, lng], index) => {
      L.circleMarker([lat, lng], {
        radius: 6,
        color: '#0284c7',
        fillColor: index === 0 ? '#22c55e' : '#ffffff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(drawLayerRef.current!);
    });
  }, [activePoints]);

  // Efecto reactivo: Polígonos guardados con etiquetas de nombre y área
  useEffect(() => {
    if (!polygonLayerRef.current) return;
    polygonLayerRef.current.clearLayers();

    polygons.forEach((poly) => {
      const latLngs: L.LatLngTuple[] = poly.coordinates.map((pt) => [
        pt.latitude,
        pt.longitude,
      ]);

      if (latLngs.length >= 3) {
        const polyLayer = L.polygon(latLngs, {
          color: poly.color || '#10b981',
          fillColor: poly.color || '#10b981',
          fillOpacity: 0.35,
          weight: 3,
        }).addTo(polygonLayerRef.current!);

        // Etiqueta flotante permanente sobre el polígono
        if (poly.name) {
          const areaText = poly.areaM2
            ? `<div style="color: #38bdf8; font-size: 10px;">${poly.areaM2.toLocaleString('es-MX', { maximumFractionDigits: 1 })} m²</div>`
            : '';

          polyLayer.bindTooltip(
            `<div><b>${poly.name}</b>${areaText}</div>`,
            {
              permanent: true,
              direction: 'center',
              className: 'polygon-label',
            }
          );
        }

        // Al hacer clic en un polígono existente
        polyLayer.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          if (onPolygonPressRef.current) {
            onPolygonPressRef.current(poly);
          }
        });
      }
    });
  }, [polygons]);

  // Efecto reactivo: Mover cámara con animación suave
  useEffect(() => {
    if (!mapInstanceRef.current || !centerCoordinate) return;
    mapInstanceRef.current.flyTo(
      [centerCoordinate.latitude, centerCoordinate.longitude],
      17,
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
