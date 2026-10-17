/**
 * Representa una coordenada geográfica (latitud y longitud).
 * Similar a una clase POJO/Record en Java: record Coordinate(double latitude, double longitude) {}
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Representa un polígono de terreno terminado.
 */
export interface TerrainPolygon {
  id: string;
  coordinates: Coordinate[];
  color?: string;
}
