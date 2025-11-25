# Guía de Despliegue en AWS EC2

Esta guía te permitirá desplegar AgencyFlow CRM en una instancia EC2 de AWS utilizando Docker.

## Prerrequisitos

1. **Instancia EC2**: Ubuntu 22.04+ (t2.micro o superior)
2. **Security Group** con puertos abiertos:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443) - Opcional para SSL

## Despliegue Rápido

### Opción 1: Script Automático

```bash
# Conectarse a EC2
ssh ubuntu@your-ec2-ip

# Descargar y ejecutar script
wget https://raw.githubusercontent.com/lucasmleone/Lucas-Agency/main/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### Opción 2: Manual

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 2. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clonar repositorio
git clone https://github.com/lucasmleone/Lucas-Agency.git
cd Lucas-Agency

# 4. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus valores

# 5. Construir frontend localmente (requiere Node.js)
npm install
npm run build

# 6. Iniciar aplicación
sudo docker-compose build
sudo docker-compose up -d
```

## Credenciales por Defecto

- **Email**: demo@agency.com
- **Password**: password123

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción

## Mantenimiento

### Actualizar la Aplicación

**IMPORTANTE**: Después de hacer cambios en el código, debes **reconstruir la imagen de Docker**:

```bash
cd ~/Lucas-Agency
git pull
sudo docker-compose build app  # ← IMPORTANTE: rebuild después de cambios
sudo docker-compose up -d
```

⚠️ **No olvides el `build`** - simplemente reiniciar (`restart`) no carga nuevos cambios.

### Ver Logs

```bash
sudo docker-compose logs -f app
sudo docker logs app-app-1 2>&1 | tail -50
```

### Reiniciar Servicios

```bash
sudo docker-compose restart app
sudo docker-compose restart db
```

### Limpiar y Empezar de Cero

```bash
sudo docker-compose down -v  # ⚠️ Borra la base de datos
sudo docker-compose up --build -d
```

## Solución de Problemas

### Login falla (429 Too Many Requests)

El rate limit está configurado a 100 intentos/15min. Si necesitas más:
- Edita `server/routes/auth.js` línea 15
- Cambia `max: 100` al valor deseado
- Reconstruye: `sudo docker-compose build app && sudo docker-compose up -d`

### Los datos no persisten

Verifica que:
1. Después de cambiar código: `sudo docker-compose build app`
2. La conversión de fechas está funcionando (ya incluida en main)

### Base de datos no inicia

```bash
sudo docker-compose logs db
# Si hay errores de permisos:
sudo chown -R 999:999 ./mysql-data  # Si tienes un volume local
```

## Configuración de Producción

### 1. Cambiar Passwords

Edita `.env`:
```
DB_PASS=TuPasswordSuperSeguro123!
JWT_SECRET=TuSecretoJWTMuySeguro456!
```

Reconstruye:
```bash
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d
```

### 2. Configurar SSL (HTTPS)

Usa Nginx como reverse proxy con Let's Encrypt:

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

### 3. Configurar Dominio

En tu DNS, agrega un registro A apuntando a la IP de tu EC2.

## Arquitectura

- **Frontend**: React + Vite (servido como archivos estáticos)
- **Backend**: Node.js + Express  
- **Database**: MySQL 8.0
- **Deployment**: Docker + Docker Compose

## Puertos

- `80`: Aplicación web (HTTP)
- `3306`: MySQL (solo interno a Docker, no expuesto)
