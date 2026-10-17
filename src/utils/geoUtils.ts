import { area } from '@turf/area';
import { polygon } from '@turf/helpers';
import { Coordinate } from '../types';

/**
 * Calcula el área de un polígono en metros cuadrados y hectáreas usando Turf.js
 * Similar a una función en PostGIS: ST_Area(ST_Transform(geom, 3857))
 */
export function calculatePolygonArea(coords: Coordinate[]): {
	areaM2: number;
	areaHectares: number;
} {
	if (coords.length < 3) {
		return { areaM2: 0, areaHectares: 0 };
	}

	// En GeoJSON el anillo debe cerrarse (el último punto debe ser igual al primero)
	// y las coordenadas se expresan en orden [longitud, latitud]
	const closedCoords = [...coords, coords[0]].map((c) => [c.longitude, c.latitude]);

	const turfPoly = polygon([closedCoords]);
	const areaM2 = Math.round(area(turfPoly) * 100) / 100; // Redondear a 2 decimales
	const areaHectares = Math.round((areaM2 / 10000) * 1000) / 1000; // Redondear a 3 decimales

	return { areaM2, areaHectares };
}

/**
 * Calcula el centro geométrico aproximado (centroide) de los puntos
 */
export function calculateCentroid(coords: Coordinate[]): Coordinate {
	if (coords.length === 0) {
		return { latitude: 0, longitude: 0 };
	}

	const sumLat = coords.reduce((sum, c) => sum + c.latitude, 0);
	const sumLng = coords.reduce((sum, c) => sum + c.longitude, 0);

	return {
		latitude: sumLat / coords.length,
		longitude: sumLng / coords.length,
	};
}
