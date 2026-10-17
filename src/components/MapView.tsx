import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
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

export default function MapView(_props: MapViewProps): React.JSX.Element | null {
  return null;
}
