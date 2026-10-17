import React from 'react';
import RNMapView, { MapViewProps as RNMapViewProps } from 'react-native-maps';

export type MapViewProps = RNMapViewProps;

export default function MapView(props: RNMapViewProps) {
  return <RNMapView {...props} />;
}
