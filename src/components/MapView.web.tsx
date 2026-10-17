import React, { useEffect, useRef, useState } from 'react';
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
	mapType?: 'standard' | 'satellite' | 'hybrid' | 'relief' | 'relieve';
	onMapPress?: (coord: Coordinate) => void;
	onPolygonPress?: (polygon: TerrainPolygon) => void;
	onPhotoPress?: (photoUri: string) => void;
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
const RELIEF_TILE_URL = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Relieve topográfico de Google con curvas y terreno

export default function MapView({
	style,
	initialRegion,
	centerCoordinate,
	mapType = 'satellite',
	onMapPress,
	onPolygonPress,
	activePoints = [],
	polygons = [],
	children,
}: MapViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const tileLayerRef = useRef<L.TileLayer | null>(null);
	const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);

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

	// Exponer handler global para que el clic directo en las etiquetas de texto HTML abra la ficha
	const polygonsRef = useRef(polygons);
	useEffect(() => {
		polygonsRef.current = polygons;
	}, [polygons]);

	useEffect(() => {
		(window as any).__terreneitorOpenEdit = (polyId: string) => {
			const target = polygonsRef.current.find((p) => p.id === polyId);
			if (target && onPolygonPressRef.current) {
				onPolygonPressRef.current(target);
			}
		};
		return () => {
			delete (window as any).__terreneitorOpenEdit;
		};
	}, []);

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
				/* Reposicionar zoom a la esquina inferior derecha por encima del botón de relieve */
				.leaflet-control-zoom {
					margin-bottom: 75px !important;
					margin-right: 12px !important;
				}
				.leaflet-control-zoom a {
					background: rgba(15, 23, 42, 0.92) !important;
					color: #ffffff !important;
					border: 1px solid rgba(255,255,255,0.18) !important;
					font-size: 16px !important;
					width: 32px !important;
					height: 32px !important;
					line-height: 32px !important;
					border-radius: 8px !important;
					box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
					transition: background 0.15s ease !important;
				}
				.leaflet-control-zoom a:hover {
					background: rgba(37, 99, 235, 0.85) !important;
				}
				.leaflet-control-zoom-in {
					margin-bottom: 3px !important;
				}
				.leaflet-tooltip-pane {
					z-index: 650 !important;
				}
				.polygon-label {
					background: rgba(15, 23, 42, 0.95) !important;
					border: 1px solid rgba(56, 189, 248, 0.6) !important;
					color: #ffffff !important;
					font-weight: 600 !important;
					font-size: 11px !important;
					padding: 6px 12px !important;
					border-radius: 8px !important;
					box-shadow: 0 4px 14px rgba(0,0,0,0.6) !important;
					text-align: center !important;
					white-space: nowrap !important;
					backdrop-filter: blur(6px) !important;
					cursor: pointer !important;
					pointer-events: auto !important;
					user-select: none !important;
					transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
				}
				.polygon-label:hover {
					border-color: #38bdf8 !important;
					box-shadow: 0 0 12px rgba(56, 189, 248, 0.6) !important;
				}
				.polygon-label-mini {
					background: rgba(15, 23, 42, 0.92) !important;
					border: 1px solid rgba(255, 255, 255, 0.3) !important;
					color: #ffffff !important;
					font-size: 10px !important;
					font-weight: 700 !important;
					padding: 3px 8px !important;
					border-radius: 4px !important;
					box-shadow: 0 2px 6px rgba(0,0,0,0.5) !important;
					white-space: nowrap !important;
					cursor: pointer !important;
					pointer-events: auto !important;
					user-select: none !important;
					transition: border-color 0.15s ease !important;
				}
				.polygon-label-mini:hover {
					border-color: #38bdf8 !important;
				}
				.polygon-label::before, .polygon-label-mini::before {
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

		// Capa de mapa (Satelital o Relieve)
		const tileUrl = (mapType === 'relief' || (mapType as any) === 'relieve')
			? RELIEF_TILE_URL
			: SATELLITE_TILE_URL;

		const tileLayer = L.tileLayer(tileUrl, {
			attribution: 'Google Maps',
			maxZoom: MAX_ZOOM,
			maxNativeZoom: MAX_NATIVE_ZOOM,
		}).addTo(map);
		tileLayerRef.current = tileLayer;

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

		// Monitorear zoom para adaptar las etiquetas reactivamente y evitar saturación visual
		map.on('zoomend', () => {
			setCurrentZoom(map.getZoom());
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

	// Efecto reactivo: Cambiar dinámicamente entre Satélite y Relieve
	useEffect(() => {
		if (!mapInstanceRef.current) return;
		const nextUrl = (mapType === 'relief' || (mapType as any) === 'relieve')
			? RELIEF_TILE_URL
			: SATELLITE_TILE_URL;

		if (tileLayerRef.current) {
			mapInstanceRef.current.removeLayer(tileLayerRef.current);
		}

		const newTileLayer = L.tileLayer(nextUrl, {
			attribution: 'Google Maps',
			maxZoom: MAX_ZOOM,
			maxNativeZoom: MAX_NATIVE_ZOOM,
		}).addTo(mapInstanceRef.current);

		// Colocar al fondo para que no tape los polígonos ni líneas
		if ((newTileLayer as any).bringToBack) {
			(newTileLayer as any).bringToBack();
		}

		tileLayerRef.current = newTileLayer;
	}, [mapType]);

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

	// Efecto reactivo: Polígonos guardados con etiquetas adaptativas según nivel de zoom
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

				// Reactividad con el Zoom para no estorbar cuando hay muchos terrenos:
				// - Zoom < 15: No muestra etiquetas para vista limpia general
				// - Zoom 15: Muestra solo nombre compacto
				// - Zoom >= 16: Muestra tarjeta completa con área, badges de uso, estado, dueño y teléfono
				if (poly.name && currentZoom >= 15) {
					if (currentZoom === 15) {
						// Modo compacto para vista media
						polyLayer.bindTooltip(
							`<div onclick="window.__terreneitorOpenEdit && window.__terreneitorOpenEdit('${poly.id}'); event.stopPropagation();"><span>${poly.name}</span></div>`,
							{
								permanent: true,
								direction: 'center',
								className: 'polygon-label-mini',
								interactive: true,
							}
						);
					} else {
						// Modo detallado: 1. Nombre, 2. m², 3. Dueño, 4. Teléfono, 5. Cantidad de fotos, 6. Tipo de suelo, 7. Estatus comercial
						const areaText = poly.areaM2
							? `<div style="color: #38bdf8; font-size: 11px; font-weight: 600; margin-top: 1px;">📐 ${poly.areaM2.toLocaleString('es-MX', { maximumFractionDigits: 1 })} m²</div>`
							: '';

						const ownerText = poly.owner
							? `<div style="color: #e2e8f0; font-size: 10px; margin-top: 2px;">👤 ${poly.owner}</div>`
							: '';

						const phoneText = poly.phone
							? `<div style="color: #6ee7b7; font-size: 10px; margin-top: 1px;">📞 ${poly.phone}</div>`
							: '';

						const photosIndicator = (poly.photos && poly.photos.length > 0)
							? `<div style="color: #cbd5e1; font-size: 9px; margin-top: 2px;">📷 ${poly.photos.length} ${poly.photos.length === 1 ? 'foto' : 'fotos'}</div>`
							: '';

						const landTypeLabels: Record<string, string> = {
							rustico: '🌾 Rústico',
							urbano: '🏙️ Urbano',
							comercial: '🏢 Comercial',
							habitacional: '🏡 Habitacional',
							mixto: '🔄 Mixto',
						};

						const landTypeBadge = poly.landType
							? `<div style="margin-top: 3px;"><span style="font-size: 9px; padding: 2px 7px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.5); color: #38bdf8; font-weight: 700;">${landTypeLabels[poly.landType] || poly.landType}</span></div>`
							: '';

						const statusBadge = poly.status
							? `<div style="margin-top: 3px;"><span style="font-size: 9px; padding: 2px 7px; border-radius: 4px; background: ${color}; color: #ffffff; font-weight: 700; text-transform: uppercase;">${poly.status}</span></div>`
							: '';

						polyLayer.bindTooltip(
							`<div onclick="window.__terreneitorOpenEdit && window.__terreneitorOpenEdit('${poly.id}'); event.stopPropagation();" style="text-align: center; line-height: 1.35;">
								<div style="font-size: 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 2px; margin-bottom: 2px;">${poly.name}</div>
								${areaText}
								${ownerText}
								${phoneText}
								${photosIndicator}
								${landTypeBadge}
								${statusBadge}
							</div>`,
							{
								permanent: true,
								direction: 'center',
								className: 'polygon-label',
								interactive: true,
							}
						);
					}
				}

				// Al hacer clic en un polígono existente (abre el modal/ficha con su carrusel)
				const handlePolyClick = (e: L.LeafletMouseEvent) => {
					if (e.originalEvent) {
						L.DomEvent.stopPropagation(e.originalEvent);
					}
					if (onPolygonPressRef.current) {
						onPolygonPressRef.current(poly);
					}
				};

				polyLayer.on('click', handlePolyClick);

				// También al hacer clic directamente en el tooltip flotante
				const tooltip = polyLayer.getTooltip();
				if (tooltip) {
					tooltip.on('click', (e: any) => {
						if (e.originalEvent) {
							L.DomEvent.stopPropagation(e.originalEvent);
						}
						if (onPolygonPressRef.current) {
							onPolygonPressRef.current(poly);
						}
					});
				}
			}
		});
	}, [polygons, currentZoom]);

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
