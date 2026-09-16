# Al Día 📰

**Una noticia. Bien explicada. Y ya.**

Aplicación móvil Expo/React Native pensada para informarse sin scroll infinito. El usuario decide cuántas noticias quiere, qué temas priorizar, a qué hora recibirlas y si desea escucharlas.

## Incluye

- 1–5 noticias por día.
- Prioridad configurable: Perú, internacional, sector, IA y curiosidades.
- Sector personalizable: logística, negocios, tecnología, ciencia o economía.
- Hora de entrega configurable.
- Audio en español de 60–90 segundos mediante `expo-speech`.
- Preferencias persistidas localmente con AsyncStorage.
- Lectura estructurada: qué pasó, quién, cuándo, dónde, por qué, cómo, datos clave, contexto, consecuencia, afectados, significado y acción.
- Pantalla de cierre: **Ya estás al día.**
- Servicio RSS preparado para obtener titulares recientes de Perú, mundo, IA, tecnología y ciencia mediante Google News RSS.

## Ejecutar

```bash
npm install
npx expo start
```

Abre el proyecto con Expo Go o un emulador.

## Arquitectura de contenido

`src/liveNews.ts` concentra la obtención de titulares recientes. La app puede usar estos datos como entrada para la siguiente capa: selección de noticias, verificación de fuentes y generación de explicaciones con IA.

## Próximas etapas

1. Conectar titulares RSS con la pantalla principal.
2. Añadir selección de fuentes y trazabilidad de cada noticia.
3. Incorporar una API/backend seguro para resumir con IA sin exponer claves en la app.
4. Generar automáticamente el guion de audio de 60–90 segundos.
5. Programar notificaciones diarias según la hora elegida.
6. Añadir historial y resumen semanal.
7. Preparar autenticación y modelo Free/Premium.
