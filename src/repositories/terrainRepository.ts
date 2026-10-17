import AsyncStorage from '@react-native-async-storage/async-storage';
import { TerrainPolygon } from '../types';

const STORAGE_KEY = '@terreneitor:terrains';

/**
 * Patrón Repositorio (Repository Pattern):
 * En Java (Spring Data JPA) tendrías:
 * public interface TerrainRepository extends JpaRepository<Terrain, String> { ... }
 *
 * Definimos esta interfaz para desacoplar las pantallas del almacenamiento.
 * Hoy guarda localmente en AsyncStorage (o localStorage en Web), y mañana
 * solo creas un HttpTerrainRepository para conectar a tu backend Spring Boot
 * sin tocar ni una sola línea de la interfaz gráfica.
 */
export interface ITerrainRepository {
  getAll(): Promise<TerrainPolygon[]>;
  save(terrain: TerrainPolygon): Promise<void>;
  delete(id: string): Promise<void>;
}

class LocalTerrainRepository implements ITerrainRepository {
  async getAll(): Promise<TerrainPolygon[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      return JSON.parse(json) as TerrainPolygon[];
    } catch (error) {
      console.error('Error al cargar terrenos:', error);
      return [];
    }
  }

  async save(terrain: TerrainPolygon): Promise<void> {
    try {
      const current = await this.getAll();
      // Si ya existe lo actualiza, si no lo agrega
      const exists = current.some((t) => t.id === terrain.id);
      const updated = exists
        ? current.map((t) => (t.id === terrain.id ? terrain : t))
        : [terrain, ...current];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error al guardar terreno:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const current = await this.getAll();
      const filtered = current.filter((t) => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error al eliminar terreno:', error);
      throw error;
    }
  }
}

// Instancia singleton inyectable
export const terrainRepository: ITerrainRepository = new LocalTerrainRepository();
