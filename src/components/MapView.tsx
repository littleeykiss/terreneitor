import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

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

// En tiempo de ejecución Metro usa `MapView.web.tsx` o `MapView.native.tsx`.
// Este archivo sirve como interfaz base para TypeScript.
export default function MapView(_props: MapViewProps): React.JSX.Element | null {
  return null;
}
