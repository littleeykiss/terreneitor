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
  activePoints?: Coordinate[];
  polygons?: TerrainPolygon[];
  children?: React.ReactNode;
}

export default function MapView({
  centerCoordinate,
  onMapPress,
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

      {/* 3. Polígonos de terrenos ya terminados */}
      {polygons.map((poly) => (
        <Polygon
          key={poly.id}
          coordinates={poly.coordinates}
          strokeColor={poly.color || '#10b981'}
          fillColor="rgba(16, 185, 129, 0.35)"
          strokeWidth={3}
        />
      ))}

      {children}
    </RNMapView>
  );
}
