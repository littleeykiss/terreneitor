import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: any;

// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO DE SUPABASE (Settings -> API)
export const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) || 'https://slvhhjraacroxidbkdfc.supabase.co';
export const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) || 'sb_publishable_6vNWmE7Rs3wX2u8CYOdoAw_U_gR5Pfm';

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
