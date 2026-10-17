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

const DEFAULT_LATITUDE_DELTA = 0.05;
const DEFAULT_LONGITUDE_DELTA = 0.05;
const ANIMATION_DURATION_MS = 1000;

const POLYLINE_STROKE_WIDTH = 3;
const POLYGON_STROKE_WIDTH = 3;
const LINE_DASH_PATTERN = [6, 6];

const ACTIVE_LINE_COLOR = '#38bdf8';
const DEFAULT_STROKE_COLOR = '#10b981';
const DEFAULT_FILL_COLOR = 'rgba(16, 185, 129, 0.35)';

const STATUS_STROKE_COLORS: Record<string, string> = {
	disponible: '#10b981',
	apartado: '#f59e0b',
	vendido: '#ef4444',
};

const STATUS_FILL_COLORS: Record<string, string> = {
	disponible: 'rgba(16, 185, 129, 0.35)',
	apartado: 'rgba(245, 158, 11, 0.35)',
	vendido: 'rgba(239, 68, 68, 0.35)',
};

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
				latitudeDelta: DEFAULT_LATITUDE_DELTA,
				longitudeDelta: DEFAULT_LONGITUDE_DELTA,
			},
			ANIMATION_DURATION_MS
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
					strokeColor={ACTIVE_LINE_COLOR}
					strokeWidth={POLYLINE_STROKE_WIDTH}
					lineDashPattern={LINE_DASH_PATTERN}
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
				const strokeColor = poly.color || STATUS_STROKE_COLORS[poly.status] || DEFAULT_STROKE_COLOR;
				const fillColor = STATUS_FILL_COLORS[poly.status] || DEFAULT_FILL_COLOR;

				return (
					<Polygon
						key={poly.id}
						coordinates={poly.coordinates}
						strokeColor={strokeColor}
						fillColor={fillColor}
						strokeWidth={POLYGON_STROKE_WIDTH}
						tappable
						onPress={() => onPolygonPress?.(poly)}
					/>
				);
			})}

			{children}
		</RNMapView>
	);
}
