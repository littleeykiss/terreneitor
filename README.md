# 🗺️ Terreneitor

> Aplicación móvil y web para la **gestión, catalogación y visualización de terrenos** sobre mapa satelital. Dibuja polígonos, registra fichas, organiza tu inventario y navega a cualquier lote con Google Maps.

---

## ✨ Características principales

| Función | Descripción |
|---|---|
| 🛰️ **Mapa satelital** | Vista híbrida de alta resolución (Google Maps Satellite vía Leaflet) |
| ✏️ **Dibujo de polígonos** | Toca/clic sobre el mapa para añadir vértices y cerrar el terreno |
| 📐 **Cálculo de área** | Área automática en m² y hectáreas al terminar el dibujo |
| 🏷️ **Ficha de terreno** | Nombre, precio, dirección, propietario, teléfono y notas |
| 🌐 **Geocodificación inversa** | Detecta la dirección automáticamente al guardar |
| 🔍 **Buscador de lugares** | Busca ciudades, colonias o puntos de interés y centra el mapa |
| 📁 **Bodega / Catálogo** | Lista paginada con filtros por estado comercial |
| 🟢🟡🔴 **Estados comerciales** | Disponible / Apartado / Vendido con colores en mapa y catálogo |
| 🗺️ **Cómo llegar** | Abre Google Maps centrado en el polígono desde el modal de edición |
| 💾 **Persistencia local** | Todos los terrenos se guardan con AsyncStorage (sin cuenta ni servidor) |
| 📍 **Geolocalización** | Centra el mapa en tu posición actual al iniciar |

---

## 🛠️ Stack tecnológico

- **Expo SDK 58** — Framework React Native multiplataforma
- **React Native 0.88** — UI nativa para iOS y Android
- **Leaflet 1.9** — Mapas interactivos en la versión web
- **react-native-maps** — Mapas nativos para iOS/Android
- **@turf/area + @turf/helpers** — Cálculo geoespacial de áreas
- **@react-native-async-storage/async-storage** — Persistencia local
- **expo-location** — Acceso a GPS del dispositivo
- **TypeScript** — Tipado estático en todo el proyecto

---

## 📁 Estructura del proyecto

```
terreneitor/
├── App.tsx                         # Componente raíz: estado global, modales y controles
├── index.ts                        # Entry point de Expo
├── app.json                        # Configuración de Expo (nombre, íconos, orientación)
├── assets/                         # Íconos y splash screen
└── src/
    ├── components/
    │   ├── MapView.native.tsx       # Mapa nativo (react-native-maps) para iOS/Android
    │   └── MapView.web.tsx          # Mapa web (Leaflet) para navegador
    ├── repositories/
    │   └── terrainRepository.ts    # CRUD de terrenos sobre AsyncStorage
    ├── services/
    │   └── geocoding.ts            # Búsqueda de lugares + geocodificación inversa (Nominatim)
    ├── types/
    │   └── index.ts                # Tipos: Coordinate, TerrainPolygon, TerrainStatus
    └── utils/
        └── geoUtils.ts             # Utilidades: cálculo de área, centroide
```

---

## 🚀 Instalación y ejecución

### Requisitos previos

- Node.js >= 18
- Expo CLI

### Clonar e instalar

```bash
git clone https://github.com/tu-usuario/terreneitor.git
cd terreneitor
npm install
```

### Ejecutar en web (desarrollo)

```bash
npm run web
```

### Ejecutar en dispositivo / emulador

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android
```

> **Nota:** Las funciones de mapa nativo requieren un development build.
> En web se usa Leaflet automáticamente.

---

## 🗺️ Cómo usar la app

1. **Buscar un lugar** — Escribe en la barra superior y selecciona el resultado.
2. **Dibujar un terreno** — Presiona ✏️ Dibujar terreno, toca el mapa para añadir vértices (mínimo 3) y presiona ✓ Terminar.
3. **Llenar la ficha** — Asigna nombre, precio, estado, propietario y notas. La dirección se detecta automáticamente.
4. **Guardar** — Presiona 💾 Guardar en Bodega. El polígono aparece en el mapa con su etiqueta.
5. **Editar o navegar** — Toca un polígono en el mapa o búscalo en la 📁 Bodega. Desde el modal de edición puedes abrir 🗺️ Cómo llegar en Google Maps.

---

## 📦 Variables de entorno

El proyecto no requiere variables de entorno. El servicio de geocodificación usa la API pública de Nominatim (OpenStreetMap) sin clave.

---

## 📄 Licencia

MIT © 2026 Terreneitor

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Abre un issue o un pull request describiendo el cambio propuesto.
