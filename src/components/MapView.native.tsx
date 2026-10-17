import React, { useEffect, useRef } from 'react';
import RNMapView, {
  MapViewProps as RNMapViewProps,
  Polygon,
  Polyline,
  Marker,
} from 'react-native-maps';
import { Coordinate, TerrainPolygon } from '../types';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewProps extends Omit<RNMapViewProps, 'onPress'> {
  initialRegion?: MapRegion;
  centerCoordinate?: Coordinate | null;
  onMapPress?: (coord: Coordinate) => void;
  onPolygonPress?: (polygon: TerrainPolygon) => void;
  activePoints?: Coordinate[];
  polygons?: TerrainPolygon[];
  children?: React.ReactNode;
}

export default function MapView({
  centerCoordinate,
  onMapPress,
  onPolygonPress,
  activePoints = [],
  polygons = [],
  children,
  ...restProps
}: MapViewProps) {
  const mapRef = useRef<RNMapView | null>(null);

  useEffect(() => {
    if (!mapRef.current || !centerCoordinate) return;
    mapRef.current.animateToRegion(
      {
        latitude: centerCoordinate.latitude,
        longitude: centerCoordinate.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000
    );
  }, [centerCoordinate]);

  return (
    <RNMapView
      ref={mapRef}
      {...restProps}
      onPress={(e) => {
        if (onMapPress) {
          onMapPress(e.nativeEvent.coordinate);
        }
      }}
    >
      {/* 1. Línea que conecta los puntos en curso */}
      {activePoints.length > 1 && (
        <Polyline
          coordinates={activePoints}
          strokeColor="#38bdf8"
          strokeWidth={3}
          lineDashPattern={[6, 6]}
        />
      )}

      {/* 2. Marcadores en cada vértice en curso */}
      {activePoints.map((pt, index) => (
        <Marker
          key={`active-point-${index}`}
          coordinate={pt}
          pinColor={index === 0 ? 'green' : 'blue'}
        />
      ))}

      {/* 3. Polígonos de terrenos ya terminados con soporte para clic */}
      {polygons.map((poly) => {
        const statusColors: Record<string, string> = {
          disponible: '#10b981',
          apartado: '#f59e0b',
          vendido: '#ef4444',
        };
        const color = poly.color || statusColors[poly.status] || '#10b981';

        return (
          <Polygon
            key={poly.id}
            coordinates={poly.coordinates}
            strokeColor={color}
            fillColor={
              poly.status === 'vendido'
                ? 'rgba(239, 68, 68, 0.35)'
                : poly.status === 'apartado'
                ? 'rgba(245, 158, 11, 0.35)'
                : 'rgba(16, 185, 129, 0.35)'
            }
            strokeWidth={3}
            tappable
            onPress={() => onPolygonPress?.(poly)}
          />
        );
      })}

      {children}
    </RNMapView>
  );
}
