# Guía de Despliegue en Hostinger

Sigue estos pasos para subir tu aplicación a Hostinger y conectar la base de datos.

## 1. Preparar la Aplicación (Build)
Desde tu terminal en VS Code, ejecuta el comando para construir la versión de producción de React:
```bash
npm run build
```
Esto creará una carpeta `dist` con los archivos optimizados.

## 2. Subir Archivos a Hostinger
1.  Entra al **Administrador de Archivos** de Hostinger.
2.  Navega a la carpeta `public_html`.
3.  Borra el archivo `default.php` si existe.
4.  **Sube el contenido de la carpeta `dist`** (no la carpeta en sí, sino los archivos dentro: `index.html`, `assets`, etc.) a `public_html`.
5.  **Sube la carpeta `api`** (que está dentro de tu carpeta `public` local) a `public_html`. Deberías tener `public_html/api`.

La estructura final en Hostinger debe verse así:
```
public_html/
├── assets/
├── api/
│   ├── auth.php
│   ├── config.php
│   ├── data.php
│   └── setup_db.php
├── index.html
├── .htaccess
└── ...
```

## 3. Crear la Base de Datos MySQL
1.  En el panel de Hostinger, ve a **Bases de Datos MySQL**.
2.  Crea una nueva base de datos y un usuario.
    *   **Nombre de la BD**: (Ej: `u123456789_agencia`)
    *   **Usuario**: (Ej: `u123456789_admin`)
    *   **Contraseña**: (Crea una segura y guárdala)
3.  Anota estos datos.

## 4. Configurar `config.php`
1.  En el Administrador de Archivos de Hostinger, abre `public_html/api/config.php`.
2.  Edita las constantes con los datos reales de tu base de datos y tu API Key de Gemini:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_agencia'); // TU NOMBRE DE BD REAL
define('DB_USER', 'u123456789_admin');   // TU USUARIO REAL
define('DB_PASS', 'TuContraseñaSegura'); // TU CONTRASEÑA REAL
```
3.  Guarda los cambios.

## 5. Inicializar la Base de Datos
1.  Abre tu navegador y visita la siguiente URL (reemplaza `tudominio.com` por tu dominio real):
    `https://tudominio.com/api/setup_db.php?secret=LucasAgencySetup2025`
2.  Deberías ver un mensaje indicando que las tablas (`users`, `clients`, `projects`, etc.) se han creado correctamente.
3.  **IMPORTANTE**: Por seguridad, borra el archivo `setup_db.php` del servidor después de usarlo.

## 6. Probar la App
1.  Ve a `https://tudominio.com`.
2.  Regístrate con un nuevo usuario.
3.  ¡Listo! Tu ERP debería estar funcionando.
