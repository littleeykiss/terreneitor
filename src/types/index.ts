/**
 * Coordenada geográfica (latitud y longitud).
 * En Java: record Coordinate(double latitude, double longitude) {}
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Estado comercial del terreno
 */
export type TerrainStatus = 'disponible' | 'apartado' | 'vendido';

/**
 * Entidad completa de Terreno (similar a @Entity public class Terrain { ... } en JPA)
 */
export interface TerrainPolygon {
  id: string;
  name: string;              // Nombre o etiqueta (ej. "Lote 14")
  address?: string;          // Dirección o referencia
  areaM2: number;            // Área en m²
  areaHectares: number;      // Área en hectáreas
  price?: number;            // Precio en MXN (opcional)
  status: TerrainStatus;     // Estado: disponible, apartado o vendido
  notes?: string;            // Notas o descripción rápida
  coordinates: Coordinate[]; // Vértices geográficos
  color?: string;            // Color asociado al estado
  createdAt: number;         // Fecha de registro
}
