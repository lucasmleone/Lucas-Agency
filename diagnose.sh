# Diagnostic script to check container status
echo "=== Checking Docker Containers ==="
sudo docker compose ps

echo -e "\n=== Checking App Container Logs ==="
sudo docker compose logs app | tail -50

echo -e "\n=== Checking if dist folder exists in container ==="
sudo docker compose exec app ls -la /app/dist/ || echo "dist folder not found!"

echo -e "\n=== Checking if index.html exists ==="
sudo docker compose exec app cat /app/dist/index.html | head -20 || echo "index.html not found!"

echo -e "\n=== Checking Node.js version ==="
sudo docker compose exec app node --version

echo -e "\n=== Testing HTTP response ==="
curl -I http://localhost:80
