#!/bin/bash
# Test completo del endpoint de clientes

echo "🧪 TEST DE ENDPOINT /API/CLIENTS"
echo "================================="
echo ""

echo "1️⃣ Login para obtener cookie..."
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@agency.com","password":"demo123"}')

echo "Response: $LOGIN_RESPONSE"
echo ""

echo "2️⃣ Verificar que la cookie se guardó..."
cat /tmp/cookies.txt | grep token
echo ""

echo "3️⃣ Hacer request a /api/clients con la cookie..."
CLIENTS_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost/api/clients)
echo "Response: $CLIENTS_RESPONSE"
echo ""

echo "4️⃣ Hacer request a /api/projects con la misma cookie..."
PROJECTS_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost/api/projects)
echo "Response: $PROJECTS_RESPONSE"
echo ""

rm /tmp/cookies.txt
