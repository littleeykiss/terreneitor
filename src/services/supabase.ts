import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: any;

// Las credenciales se leen desde el archivo .env (nunca las pongas en el código)
// Copia .env.example -> .env y rellena tus valores reales
export const SUPABASE_URL: string = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) || '';
export const SUPABASE_ANON_KEY: string = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = () => {
	return (
		SUPABASE_URL.startsWith('https://') &&
		!SUPABASE_URL.includes('tu-proyecto') &&
		SUPABASE_ANON_KEY.length > 20 &&
		!SUPABASE_ANON_KEY.includes('tu-anon-key')
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
