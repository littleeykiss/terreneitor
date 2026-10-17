import { Coordinate } from '../types';

export interface PlaceResult {
  id: string;
  name: string;
  displayName: string;
  coordinate: Coordinate;
}

/**
 * Servicio de Geocodificación (Búsqueda de lugares):
 * Similar a una clase Service en Spring Boot (@Service public class GeocodingService { ... }).
 *
 * Usa el servicio gratuito OpenStreetMap Nominatim:
 * - No requiere tarjetas de crédito ni claves API de pago al inicio.
 * - Funciona de forma idéntica en Web, Android e iOS.
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
        'Accept-Language': 'es', // Preferir resultados en español
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
