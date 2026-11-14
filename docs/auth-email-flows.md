# Registro y recuperación de contraseña

En Supabase, configura **Authentication → URL Configuration**:

- Usa como **Site URL** la URL pública de Moka.
- Agrega a **Redirect URLs** las rutas exactas `https://TU-DOMINIO/auth` y `https://TU-DOMINIO/auth/reset-password`.
- Para probar localmente, agrega también `http://localhost:5173/auth` y `http://localhost:5173/auth/reset-password` (ajusta el puerto si Vite usa otro).

El registro envía la confirmación a `/auth`. El correo de recuperación lleva a `/auth/reset-password`, donde Supabase establece una sesión de recuperación antes de permitir guardar la contraseña. Mantén los enlaces de las plantillas de correo de Supabase basados en `{{ .ConfirmationURL }}` para respetar el destino configurado.

Prueba con una cuenta de correo propia: crear cuenta, confirmar correo, iniciar sesión, solicitar recuperación y guardar una contraseña nueva. El servidor web debe devolver `index.html` también para `/auth/reset-password`; el `Caddyfile` del proyecto ya incluye ese fallback.
