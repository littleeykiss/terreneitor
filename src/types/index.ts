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
 * Catálogo de clasificación o uso de suelo del terreno
 */
export type TerrainLandType = 'rustico' | 'urbano' | 'comercial' | 'habitacional' | 'mixto';

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
  landType?: TerrainLandType;// Clasificación: rústico, urbano, comercial, habitacional, mixto
  notes?: string;            // Notas o descripción rápida
  coordinates: Coordinate[]; // Vértices geográficos
  color?: string;            // Color asociado al estado
  createdAt: number;         // Fecha de registro
  owner?: string;            // Dueño del terreno
  phone?: string;            // Teléfono de contacto
  photos?: string[];         // Fotos del terreno (URIs o Base64)
}

