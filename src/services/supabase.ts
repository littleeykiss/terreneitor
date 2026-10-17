import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: any;

// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO DE SUPABASE (Settings -> API)
export const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) || 'https://tu-proyecto.supabase.co';
export const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) || 'tu-anon-key-aqui';

export const isSupabaseConfigured = () => {
	return (
		SUPABASE_URL !== 'https://tu-proyecto.supabase.co' &&
		SUPABASE_ANON_KEY !== 'tu-anon-key-aqui'
	);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
