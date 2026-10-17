import { Coordinate } from '../types';

export interface PlaceResult {
  id: string;
  name: string;
  displayName: string;
  coordinate: Coordinate;
}

/**
 * Búsqueda hacia adelante (texto -> coordenadas)
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
      },
    });

    if (!response.ok) {
      throw new Error(`Error en búsqueda: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      id: String(item.place_id),
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      coordinate: {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      },
    }));
  } catch (error) {
    console.error('Error buscando lugares:', error);
    return [];
  }
}

/**
 * Geocodificación inversa (coordenadas -> dirección aproximada)
 * Permite autollenar la dirección cuando el usuario cierra un terreno en el mapa.
 */
export async function reverseGeocode(coord: Coordinate): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord.latitude}&lon=${coord.longitude}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
      },
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.display_name || '';
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    return '';
  }
}
