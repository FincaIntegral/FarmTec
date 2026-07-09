# iosApp — GanadoSmart móvil (iOS)

El target iOS de Kotlin Multiplatform **solo compila en macOS con Xcode**
(limitación de Kotlin/Native, no de este proyecto). Este directorio trae el
wrapper SwiftUI listo; falta generar el proyecto Xcode en una Mac:

## Pasos en macOS (una sola vez)

1. Instalar Xcode 15+ y abrir una terminal en `ganadosmart/mobile/`.
2. Compilar el framework compartido:
   ```
   ./gradlew :composeApp:embedAndSignAppleFrameworkForXcode
   ```
   (o dejar que Xcode lo haga con el build phase de abajo)
3. Crear el proyecto Xcode: File → New → Project → iOS App,
   nombre `iosApp`, interface SwiftUI, guardándolo en `ganadosmart/mobile/iosApp/`
   y reemplazando los .swift generados por los de este directorio.
4. En Build Phases del target, agregar un "Run Script" ANTES de Compile Sources:
   ```
   cd "$SRCROOT/.."
   ./gradlew :composeApp:embedAndSignAppleFrameworkForXcode
   ```
5. En Build Settings → Framework Search Paths agregar:
   ```
   $(SRCROOT)/../composeApp/build/xcode-frameworks/$(CONFIGURATION)/$(SDK_NAME)
   ```
6. Run. La app comparte el 100% del código (UI incluida) con Android.

Alternativa: usar el wizard de https://kmp.jetbrains.com para generar un
proyecto de referencia y copiar su iosApp/ aquí (mismos nombres ya usados).
