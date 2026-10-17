/**
 * Coordenada geográfica (latitud y longitud).
 * En Java: record Coordinate(double latitude, double longitude) {}
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Entidad de Terreno (similar a una entidad JPA en Spring Boot: @Entity Terrain)
 */
export interface TerrainPolygon {
  id: string;
  name: string;              // Nombre o etiqueta del terreno (ej. "Lote 14")
  address?: string;          // Dirección o referencia de ubicación
  areaM2: number;            // Área en metros cuadrados
  areaHectares: number;      // Área en hectáreas
  notes?: string;            // Notas o descripción rápida
  coordinates: Coordinate[]; // Vértices del polígono
  color?: string;            // Color para dibujar el polígono
  createdAt: number;         // Timestamp de creación
}
