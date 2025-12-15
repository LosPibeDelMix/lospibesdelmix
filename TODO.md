## Problemas Críticos a Corregir
- [ ] **Seguridad**: Mover token hardcodeado de `config.js` a variables de entorno
- [ ] **Deploy**: Corregir `deploy-commands.js` para que registre comandos correctamente
- [ ] **Limpieza**: Eliminar archivo residual `.mp4.part` innecesario

## Mejoras de Código
- [ ] **Duplicación**: Crear `utils/embedUtils.js` y eliminar funciones `createEmbed` repetidas
- [ ] **Refactorización**: Dividir `index.js` (600+ líneas) en módulos separados
- [ ] **Errores**: Mejorar manejo de errores en toda la aplicación
- [ ] **Dependencias**: Actualizar `package.json` con versiones más recientes

## Nuevas Funcionalidades
- [ ] **Logging**: Implementar sistema de logs mejorado (`utils/logger.js`)
- [ ] **Configuración**: Crear `config/default.js` para configuración centralizada
- [ ] **Validaciones**: Añadir validaciones mejoradas en comandos
- [ ] **Limpieza**: Sistema automático de limpieza de archivos temporales

## Archivos a Crear/Modificar
- [ ] `config.js` → Eliminar y usar `.env`
- [ ] `deploy-commands.js` → Corregir lógica de registro
- [ ] `index.js` → Refactorizar en módulos
- [ ] `utils/embedUtils.js` → Nuevo archivo para utilidades de embeds
- [ ] `utils/logger.js` → Nuevo archivo para logging
- [ ] `config/default.js` → Nuevo archivo de configuración
- [ ] `package.json` → Actualizar dependencias

## Testing y Validación
- [ ] Probar registro de comandos después de correcciones
- [ ] Verificar funcionamiento del bot
- [ ] Validar todas las funcionalidades existentes
=======
# Plan de Mejoras - Los Pibes Del Mix

## Problemas Críticos a Corregir ✅
- [x] **Seguridad**: Mover token hardcodeado de `config.js` a variables de entorno
- [x] **Deploy**: Corregir `deploy-commands.js` para que registre comandos correctamente
- [ ] **Limpieza**: Eliminar archivo residual `.mp4.part` innecesario

## Mejoras de Código ✅
- [x] **Duplicación**: Crear `utils/embedUtils.js` y eliminar funciones `createEmbed` repetidas
- [ ] **Refactorización**: Dividir `index.js` (600+ líneas) en módulos separados
- [ ] **Errores**: Mejorar manejo de errores en toda la aplicación
- [x] **Dependencias**: Actualizar `package.json` con versiones más recientes

## Nuevas Funcionalidades ✅
- [x] **Logging**: Implementar sistema de logs mejorado (`utils/logger.js`)
- [x] **Configuración**: Crear `config/default.js` para configuración centralizada
- [ ] **Validaciones**: Añadir validaciones mejoradas en comandos
- [ ] **Limpieza**: Sistema automático de limpieza de archivos temporales

## Archivos a Crear/Modificar ✅
- [x] `config.js` → Actualizado para usar `.env`
- [x] `deploy-commands.js` → Corregida lógica de registro
- [ ] `index.js` → Refactorizar en módulos
- [x] `utils/embedUtils.js` → Creado para utilidades de embeds
- [x] `utils/logger.js` → Creado para logging
- [x] `config/default.js` → Creado para configuración
- [x] `package.json` → Dependencias actualizadas

## Testing y Validación
- [ ] Probar registro de comandos después de correcciones
- [ ] Verificar funcionamiento del bot
- [ ] Validar todas las funcionalidades existentes
- [ ] Limpiar archivos temporales restantes
