# Guía de Despliegue en AWS EC2 (Docker + MySQL)

Esta guía te permitirá desplegar tu aplicación completa (Frontend + Backend + Base de Datos) en una instancia EC2 de AWS utilizando Docker.

## Prerrequisitos

1.  **Instancia EC2**: Una instancia t2.micro (o superior) con Ubuntu 22.04 o 24.04.
2.  **Puertos Abiertos (Security Group)**:
    *   SSH (22)
    *   HTTP (80)
    *   HTTPS (443) - *Opcional si configuras SSL más tarde*

## Paso 1: Instalación Automática (Recomendado)

He creado un script `setup.sh` que hace todo por ti: instala Docker, clona el repo, configura el entorno y despliega la app.

1.  **Conéctate a tu EC2** por SSH.
2.  **Descarga y ejecuta el script**:

    ```bash
    # Descargar script (asegúrate de subirlo primero o copiar su contenido)
    # Opción A: Si subiste el archivo setup.sh con scp
    chmod +x setup.sh
    ./setup.sh

    # Opción B: Crear el archivo directamente
    nano setup.sh
    # (Pega el contenido del archivo setup.sh aquí)
    # Guarda con Ctrl+O, Enter, Ctrl+X
    chmod +x setup.sh
    ./setup.sh
    ```

3.  **Sigue las instrucciones en pantalla**:
    - El script te pedirá la URL de tu repositorio GitHub.
    - Creará automáticamente un archivo `.env` seguro.
    - Instalará Docker y levantará la aplicación.

## Paso 2: Verificar

1.  **Ver estado**:
    ```bash
    cd app
    docker compose ps
    ```

2.  **Acceder a la App**:
    Abre tu navegador y entra a `http://TU-IP-PUBLICA-EC2`.
    
    *   **Usuario Demo**: `demo@agency.com`
    *   **Contraseña**: `demo123`

## Mantenimiento

### Actualizar la App
```bash
cd ~/app
git pull
docker compose up --build -d
```

### Ver Logs
```bash
cd ~/app
docker compose logs -f app
```

### Limpiar todo (Borrar base de datos y empezar de cero)
```bash
docker compose down -v
docker compose up --build -d
```
