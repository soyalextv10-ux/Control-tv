# Control TV

App para controlar tu televisor desde el móvil por Wi-Fi.

**Marcas soportadas:** Roku, Samsung (Tizen) y LG (webOS).
**Funciones:** buscar televisores en tu red, guardar los que uses, flechas, OK, atrás, inicio, volumen, silencio, canales y apagar.

## Opción A: probarla ya en tu móvil (la más fácil)

1. Instala **Node.js** (nodejs.org) en tu computadora.
2. En el móvil instala la app **Expo Go** (Play Store).
3. En la carpeta del proyecto, abre una terminal y ejecuta:
   ```
   npm install
   npx expo start
   ```
4. Escanea el código QR con Expo Go. El móvil y la computadora deben estar en el mismo Wi-Fi.

## Opción B: generar el APK para instalarlo (sin Android Studio)

1. Crea una cuenta gratis en expo.dev.
2. En la terminal del proyecto:
   ```
   npm install
   npm install -g eas-cli
   eas login
   eas build -p android --profile apk
   ```
3. Cuando termine, te da un enlace para descargar el `.apk` e instalarlo en el móvil.

## Cómo usarla

- Pulsa **Buscar televisores** (el móvil y el televisor deben estar en el mismo Wi-Fi), o agrégalo con su **IP** (la ves en los ajustes de red del televisor o en tu router).
- **Samsung y LG:** la primera vez el televisor muestra un aviso para permitir la conexión. Acéptalo con el control físico. Se guarda y no vuelve a preguntar.
- **Roku:** activa en el Roku *Ajustes > Sistema > Configuración avanzada > Control por aplicaciones móviles* si no responde.

## Limitaciones

- No existe una forma única para "cualquier televisor". Cada marca usa su propio protocolo, por eso se agregan por marca.
- Modelos nuevos de Samsung y LG a veces exigen conexión segura (certificado propio) que Android no acepta desde una app básica. Si tu modelo no conecta, dímelo con la marca y el año.
- **No incluido todavía:** Android TV / Google TV (Sony, TCL, Xiaomi, Philips) y Fire TV. Requieren código nativo y se pueden agregar después.
- El código fue escrito sin poder ejecutarlo en un televisor real, así que puede necesitar ajustes al probarlo.

## Estructura

- `App.js`: pantallas (lista de TVs y control remoto)
- `src/tvs/`: un archivo por marca (`roku.js`, `samsung.js`, `lg.js`)
- `src/scan.js`: búsqueda de televisores en la red
- `src/storage.js`: televisores guardados
