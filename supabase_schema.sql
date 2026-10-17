-- ========================================================
-- ESQUEMA SQL PARA TERRENEITOR EN SUPABASE
-- Pega esto en: Supabase Dashboard -> SQL Editor -> New Query
-- ========================================================

-- 1. Tabla de Terrenos
create table if not exists public.terrains (
  id text primary key,
  name text not null,
  address text,
  area_m2 numeric not null,
  area_hectares numeric not null,
  price numeric,
  status text not null default 'disponible' check (status in ('disponible', 'apartado', 'vendido')),
  notes text,
  owner text,
  phone text,
  photos text[] default array[]::text[],
  coordinates jsonb not null,
  created_at bigint not null default extract(epoch from now()) * 1000
);

-- Habilitar Row Level Security (RLS)
alter table public.terrains enable row level security;

-- Política de lectura pública (cualquiera puede ver)
create policy "Lectura pública de terrenos" 
  on public.terrains for select 
  using (true);

-- Política de inserción y actualización abierta
create policy "Insertar terrenos" 
  on public.terrains for insert 
  with check (true);

create policy "Actualizar terrenos" 
  on public.terrains for update 
  using (true);

create policy "Eliminar terrenos" 
  on public.terrains for delete 
  using (true);

-- ========================================================
-- 2. Storage Bucket para Fotos (Opcional)
-- Ve a Supabase Dashboard -> Storage -> New Bucket
-- Nombre: terrain-photos
-- Marcar como: Public bucket
-- ========================================================
