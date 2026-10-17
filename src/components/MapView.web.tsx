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

const DEFAULT_CENTER_LATITUDE = 20.659698;
const DEFAULT_CENTER_LONGITUDE = -103.349609;
const DEFAULT_ZOOM = 16;
const MAX_ZOOM = 22;
const MAX_NATIVE_ZOOM = 20;
const FLY_TO_ZOOM = 17;
const FLY_TO_DURATION_SECONDS = 1.5;

const ACTIVE_LINE_COLOR = '#38bdf8';
const ACTIVE_LINE_WEIGHT = 3;
const ACTIVE_LINE_DASH_ARRAY = '6, 6';

const VERTEX_MARKER_BORDER_COLOR = '#0284c7';
const FIRST_VERTEX_COLOR = '#22c55e';
const VERTEX_COLOR = '#ffffff';

const DEFAULT_POLYGON_COLOR = '#10b981';
const POLYGON_WEIGHT = 3;
const POLYGON_FILL_OPACITY = 0.35;

const STATUS_COLORS: Record<string, string> = {
	disponible: '#10b981',
	apartado: '#f59e0b',
	vendido: '#ef4444',
};

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const SATELLITE_TILE_URL = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

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

	const initialLat = initialRegion?.latitude ?? DEFAULT_CENTER_LATITUDE;
	const initialLng = initialRegion?.longitude ?? DEFAULT_CENTER_LONGITUDE;

	// Inicialización del mapa:
	useEffect(() => {
		// Inyectar CSS de Leaflet y estilo para etiquetas de terrenos
		const cssId = 'leaflet-custom-css';
		if (!document.getElementById(cssId)) {
			const link = document.createElement('link');
			link.id = 'leaflet-css';
			link.rel = 'stylesheet';
			link.href = LEAFLET_CSS_URL;
			document.head.appendChild(link);

			const styleEl = document.createElement('style');
			styleEl.id = cssId;
			styleEl.innerHTML = `
				/* Reposicionar zoom a la esquina inferior derecha */
				.leaflet-control-zoom {
					margin-bottom: 90px !important;
					margin-right: 12px !important;
				}
				.leaflet-control-zoom a {
					background: rgba(15, 23, 42, 0.92) !important;
					color: #ffffff !important;
					border: 1px solid rgba(255,255,255,0.18) !important;
					font-size: 18px !important;
					width: 36px !important;
					height: 36px !important;
					line-height: 36px !important;
					border-radius: 8px !important;
					box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
					transition: background 0.15s ease !important;
				}
				.leaflet-control-zoom a:hover {
					background: rgba(37, 99, 235, 0.85) !important;
				}
				.leaflet-control-zoom-in {
					margin-bottom: 4px !important;
				}
				.polygon-label {
					background: rgba(15, 23, 42, 0.92) !important;
					border: 1px solid rgba(56, 189, 248, 0.6) !important;
					color: #ffffff !important;
					font-weight: 600 !important;
					font-size: 11px !important;
					padding: 6px 8px !important;
					border-radius: 8px !important;
					box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important;
					text-align: center !important;
					white-space: normal !important;
					max-width: 140px !important;
					backdrop-filter: blur(4px) !important;
				}
				.polygon-label::before {
					display: none !important;
				}
			`;
			document.head.appendChild(styleEl);
		}

		if (!containerRef.current || mapInstanceRef.current) return;

		const map = L.map(containerRef.current, {
			zoomControl: false,
			maxZoom: MAX_ZOOM,
		}).setView([initialLat, initialLng], DEFAULT_ZOOM);

		// Añadir control de zoom en esquina inferior derecha
		L.control.zoom({ position: 'bottomright' }).addTo(map);

		// Capa satelital híbrida (Google Hybrid)
		L.tileLayer(SATELLITE_TILE_URL, {
			attribution: 'Google Maps Satellite',
			maxZoom: MAX_ZOOM,
			maxNativeZoom: MAX_NATIVE_ZOOM,
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

		const resizeTimeout = setTimeout(() => {
			if (mapInstanceRef.current) {
				map.invalidateSize();
			}
		}, 150);

		const handleResize = () => {
			if (mapInstanceRef.current) {
				map.invalidateSize();
			}
		};
		window.addEventListener('resize', handleResize);

		return () => {
			clearTimeout(resizeTimeout);
			window.removeEventListener('resize', handleResize);
			map.remove();
			mapInstanceRef.current = null;
		};
	}, [initialLat, initialLng]);

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
				color: ACTIVE_LINE_COLOR,
				weight: ACTIVE_LINE_WEIGHT,
				dashArray: ACTIVE_LINE_DASH_ARRAY,
			}).addTo(drawLayerRef.current);
		}

		latLngs.forEach(([lat, lng], index) => {
			L.circleMarker([lat, lng], {
				radius: 6,
				color: VERTEX_MARKER_BORDER_COLOR,
				fillColor: index === 0 ? FIRST_VERTEX_COLOR : VERTEX_COLOR,
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
				const color = poly.color || STATUS_COLORS[poly.status] || DEFAULT_POLYGON_COLOR;

				const polyLayer = L.polygon(latLngs, {
					color: color,
					fillColor: color,
					fillOpacity: POLYGON_FILL_OPACITY,
					weight: POLYGON_WEIGHT,
				}).addTo(polygonLayerRef.current!);

				// Etiqueta flotante permanente sobre el polígono
				if (poly.name) {
					const areaText = poly.areaM2
						? `<div style="color: #38bdf8; font-size: 10px; font-weight: 500;">${poly.areaM2.toLocaleString('es-MX', { maximumFractionDigits: 1 })} m²</div>`
						: '';

					const statusBadge = poly.status
						? `<span style="font-size:9px; padding:2px 6px; border-radius:4px; background:${color}; color:#fff; font-weight:700; text-transform:uppercase;">${poly.status}</span>`
						: '';

					const landTypeLabels: Record<string, string> = {
						rustico: '🌾 Rústico',
						urbano: '🏙️ Urbano',
						comercial: '🏢 Comercial',
						habitacional: '🏡 Habitacional',
						mixto: '🔄 Mixto',
					};

					const landTypeBadge = poly.landType
						? `<span style="font-size:9px; padding:2px 6px; border-radius:4px; background:rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.5); color:#38bdf8; font-weight:600;">${landTypeLabels[poly.landType] || poly.landType}</span>`
						: '';

					const badgesRow = (statusBadge || landTypeBadge)
						? `<div style="display:flex; gap:4px; justify-content:center; align-items:center; margin-top:3px; flex-wrap:wrap;">${statusBadge}${landTypeBadge}</div>`
						: '';

					// Miniatura de la primera foto del terreno (si tiene fotos)
					const photoThumb = (poly.photos && poly.photos.length > 0)
						? `<div style="margin-bottom:4px; position:relative; width:84px; height:54px; margin-left:auto; margin-right:auto;">
								<img src="${poly.photos[0]}" style="width:100%; height:100%; object-fit:cover; border-radius:4px; border:1px solid rgba(255,255,255,0.3); display:block;" onerror="this.style.display='none'" />
								${poly.photos.length > 1 ? `<span style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.7); color:#fff; font-size:8px; padding:1px 3px; border-radius:3px;">+${poly.photos.length - 1} 📷</span>` : ''}
						   </div>`
						: '';

					const ownerText = poly.owner
						? `<div style="color:#e2e8f0; font-size:10px; margin-top:3px;">👤 ${poly.owner}</div>`
						: '';
					const phoneText = poly.phone
						? `<div style="color:#6ee7b7; font-size:10px; margin-top:1px;">📞 ${poly.phone}</div>`
						: '';

					polyLayer.bindTooltip(
						`<div style="text-align:center;">
							${photoThumb}
							<b style="font-size:11px; color:#ffffff;">${poly.name}</b>
							${areaText}
							${badgesRow}
							${ownerText}
							${phoneText}
						</div>`,
						{
							permanent: true,
							direction: 'center',
							className: 'polygon-label',
						}
					);
				}

				// Al hacer clic en un polígono existente
				polyLayer.on('click', (e: L.LeafletMouseEvent) => {
					if (e.originalEvent) {
						L.DomEvent.stopPropagation(e.originalEvent);
					}
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
			FLY_TO_ZOOM,
			{ duration: FLY_TO_DURATION_SECONDS }
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
