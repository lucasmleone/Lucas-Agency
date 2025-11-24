#!/bin/bash

# Detener el script si hay errores
set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Configuración Automática para Lucas Agency ERP${NC}"

# 1. Actualizar Sistema
echo -e "\n${GREEN}1. Actualizando paquetes del sistema...${NC}"
sudo apt-get update && sudo apt-get upgrade -y

# 2. Instalar Docker
echo -e "\n${GREEN}2. Instalando Docker y Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Configurar permisos de usuario
    sudo usermod -aG docker $USER
    echo "Docker instalado correctamente."
else
    echo "Docker ya está instalado."
fi

# Esperar a que Docker arranque
echo "Esperando a que el servicio Docker esté listo..."
until sudo docker info > /dev/null 2>&1; do
  sleep 1
  echo "."
done
echo "Docker está corriendo."

# 3. Clonar Repositorio (si no existe)
echo -e "\n${GREEN}3. Configurando Repositorio...${NC}"
if [ ! -d "app" ]; then
    read -p "Introduce la URL de tu repositorio GitHub (HTTPS): " REPO_URL
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}Error: La URL del repositorio es obligatoria.${NC}"
        exit 1
    fi
    git clone "$REPO_URL" app
    cd app
else
    echo "La carpeta 'app' ya existe. Actualizando..."
    cd app
    git pull
fi

# 4. Configurar .env
echo -e "\n${GREEN}4. Configurando Variables de Entorno (.env)...${NC}"
if [ ! -f .env ]; then
    echo "Creando archivo .env nuevo..."
    
    # Generar contraseñas seguras
    DB_PASS=$(openssl rand -base64 12)
    DB_ROOT_PASS=$(openssl rand -base64 12)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Detectar IP Pública para CORS (con fallback)
    PUBLIC_IP=$(curl -s --connect-timeout 5 ifconfig.me || echo "localhost")
    
    cat > .env << EOL
PORT=80
NODE_ENV=production
CLIENT_URL=http://$PUBLIC_IP

# Base de Datos
DB_HOST=db
DB_NAME=agency_db
DB_USER=user
DB_PASS=$DB_PASS
DB_ROOT_PASS=$DB_ROOT_PASS

# Seguridad
JWT_SECRET=$JWT_SECRET

# Configuración Docker
USE_MOCK_DB=false
EOL
    echo "Archivo .env creado con credenciales seguras generadas aleatoriamente."
    echo "Guarda estas credenciales si necesitas acceder a la BD manualmente:"
    echo "DB Password: $DB_PASS"
    echo "Root Password: $DB_ROOT_PASS"
else
    echo "Archivo .env ya existe. Saltando creación."
fi

# 5. Desplegar
echo -e "\n${GREEN}5. Desplegando Aplicación...${NC}"

# Verificar que docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: No se encuentra docker-compose.yml. ¿Se clonó correctamente el repo?${NC}"
    exit 1
fi

echo -e "${BLUE}→ Verificando sintaxis de docker-compose.yml...${NC}"
if ! sudo docker compose config > /dev/null 2>&1; then
    echo -e "${RED}❌ Error en docker-compose.yml. Mostrando detalles:${NC}"
    sudo docker compose config
    exit 1
fi
echo -e "${GREEN}✓ Sintaxis válida${NC}"

echo -e "${BLUE}→ Verificando archivo .env...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: Archivo .env no existe${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
cat .env

echo -e "${BLUE}→ Limpiando contenedores previos...${NC}"
sudo docker compose down -v 2>&1 || echo "No hay contenedores previos"

echo -e "${BLUE}→ Construyendo y levantando contenedores...${NC}"
if ! sudo docker compose up --build -d; then
    echo -e "${RED}❌ Error al levantar contenedores. Mostrando logs:${NC}"
    sudo docker compose logs
    exit 1
fi

echo -e "${GREEN}✓ Contenedores levantados exitosamente${NC}"
echo -e "${BLUE}→ Estado de contenedores:${NC}"
sudo docker compose ps

echo -e "\n${BLUE}✨ ¡Instalación Completada! ✨${NC}"
echo "Tu aplicación debería estar corriendo en breve."
echo "Accede aquí: http://$PUBLIC_IP"
echo -e "\n${GREEN}Credenciales de Acceso:${NC}"
echo "Usuario: demo@agency.com"
echo "Contraseña: demo123"
echo -e "${BLUE}⚠️ IMPORTANTE: Cambia la contraseña del usuario demo inmediatamente después de ingresar.${NC}"

echo -e "\n${GREEN}🔍 Para ver los logs en tiempo real:${NC}"
echo "cd ~/app && sudo docker compose logs -f"
