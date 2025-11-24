#!/bin/bash
set -e

echo "🔧 Fixing deployment - esto va a tomar ~60 segundos"
echo ""

cd /home/ubuntu/app/app

echo "✅ Paso 1: Actualizando código desde GitHub..."
git pull

echo "✅ Paso 2: Deteniendo contenedor app (sin tocar DB)..."
sudo docker stop app-app-1 || true
sudo docker rm app-app-1 || true

echo "✅ Paso 3: Rebuild completo SIN caché..."
sudo docker compose build --no-cache app

echo "✅ Paso 4: Levantando contenedor..."
sudo docker compose up -d app

echo "✅ Paso 5: Esperando que el servidor inicie..."
sleep 5

echo "✅ Paso 6: Verificando que está corriendo..."
sudo docker compose ps

echo ""
echo "🎉 LISTO! Ahora:"
echo "1. Andá a http://192.168.2.10"
echo "2. Borrá TODAS las cookies (DevTools > Application > Cookies > Clear)"
echo "3. Refrescá con Ctrl+Shift+R"
echo "4. Login: demo@agency.com / demo123"
echo "5. Los clientes deberían aparecer"
echo ""
echo "La cookie ahora debe tener: Secure=❌ y SameSite=Lax"
