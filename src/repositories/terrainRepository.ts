import AsyncStorage from '@react-native-async-storage/async-storage';
import { TerrainPolygon } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const STORAGE_KEY = '@terreneitor:terrains';

export interface ITerrainRepository {
	getAll(): Promise<TerrainPolygon[]>;
	save(terrain: TerrainPolygon): Promise<void>;
	delete(id: string): Promise<void>;
}

class HybridTerrainRepository implements ITerrainRepository {
	async getAll(): Promise<TerrainPolygon[]> {
		// 1. Si Supabase está configurado, intentar traer de la nube
		if (isSupabaseConfigured()) {
			try {
				const { data, error } = await supabase
					.from('terrains')
					.select('*')
					.order('created_at', { ascending: false });

				if (!error && data) {
					const mapped: TerrainPolygon[] = data.map((row: any) => ({
						id: row.id,
						name: row.name,
						address: row.address || undefined,
						areaM2: Number(row.area_m2),
						areaHectares: Number(row.area_hectares),
						price: row.price ? Number(row.price) : undefined,
						status: row.status,
						landType: row.land_type || undefined,
						notes: row.notes || undefined,
						owner: row.owner || undefined,
						phone: row.phone || undefined,
						photos: row.photos || [],
						coordinates: row.coordinates,
						createdAt: Number(row.created_at),
					}));

					// Guardar copia local como caché offline
					await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
					return mapped;
				}
			} catch (cloudErr) {
				console.warn('Fallo al conectar con Supabase, usando respaldo local:', cloudErr);
			}
		}

		// 2. Respaldo local en caso de estar offline o sin configurar Supabase
		try {
			const json = await AsyncStorage.getItem(STORAGE_KEY);
			if (!json) return [];
			return JSON.parse(json) as TerrainPolygon[];
		} catch (error) {
			console.error('Error al cargar terrenos locales:', error);
			return [];
		}
	}

	async save(terrain: TerrainPolygon): Promise<void> {
		// 1. Guardar primero en local para respuesta inmediata
		try {
			const localJson = await AsyncStorage.getItem(STORAGE_KEY);
			const current: TerrainPolygon[] = localJson ? JSON.parse(localJson) : [];
			const exists = current.some((t) => t.id === terrain.id);
			const updated = exists
				? current.map((t) => (t.id === terrain.id ? terrain : t))
				: [terrain, ...current];
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch (localErr) {
			console.error('Error guardando en caché local:', localErr);
		}

		// 2. Si Supabase está configurado, sincronizar con la nube
		if (isSupabaseConfigured()) {
			try {
				const row = {
					id: terrain.id,
					name: terrain.name,
					address: terrain.address || null,
					area_m2: terrain.areaM2,
					area_hectares: terrain.areaHectares,
					price: terrain.price || null,
					status: terrain.status,
					land_type: terrain.landType || null,
					notes: terrain.notes || null,
					owner: terrain.owner || null,
					phone: terrain.phone || null,
					photos: terrain.photos || [],
					coordinates: terrain.coordinates,
					created_at: terrain.createdAt,
				};

				const { error } = await supabase.from('terrains').upsert(row);
				if (error) {
					console.error('Error sincronizando con Supabase:', error.message);
				}
			} catch (cloudErr) {
				console.warn('Error de red al sincronizar con Supabase:', cloudErr);
			}
		}
	}

	async delete(id: string): Promise<void> {
		// 1. Borrar de caché local
		try {
			const localJson = await AsyncStorage.getItem(STORAGE_KEY);
			if (localJson) {
				const current: TerrainPolygon[] = JSON.parse(localJson);
				const filtered = current.filter((t) => t.id !== id);
				await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
			}
		} catch (localErr) {
			console.error('Error borrando de caché local:', localErr);
		}

		// 2. Si Supabase está activo, borrar de la nube
		if (isSupabaseConfigured()) {
			try {
				const { error } = await supabase.from('terrains').delete().eq('id', id);
				if (error) {
					console.error('Error eliminando de Supabase:', error.message);
				}
			} catch (cloudErr) {
				console.warn('Error al borrar de Supabase:', cloudErr);
			}
		}
	}
}

// Instancia singleton inyectable
export const terrainRepository: ITerrainRepository = new HybridTerrainRepository();
