#!/bin/bash
# EC2 Deployment Script for AgencyFlow CRM
# Ubuntu 22.04+ compatible

set -e  # Exit on error

echo "===== AgencyFlow CRM - EC2 Deployment Script ====="

# Update system
echo "[1/8] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "[2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "[3/8] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# Install Git
echo "[4/8] Installing Git..."
sudo apt-get install -y git

# Clone repository
echo "[5/8] Cloning repository..."
if [ ! -d "Lucas-Agency" ]; then
    git clone https://github.com/lucasmleone/Lucas-Agency.git
    cd Lucas-Agency
else
    echo "Repository already exists, pulling latest changes..."
    cd Lucas-Agency
    git pull
fi

# Create .env file
echo "[6/8] Creating .env file..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Database Configuration
DB_NAME=agency_db
DB_USER=user
DB_PASS=CHANGE_ME_STRONG_PASSWORD
DB_ROOT_PASS=CHANGE_ME_ROOT_PASSWORD

# JWT Secret - MUST CHANGE
JWT_SECRET=CHANGE_ME_JWT_SECRET_KEY

# Node Environment
NODE_ENV=production
EOF
    echo "⚠️  IMPORTANT: Edit .env and change all passwords and secrets!"
    echo "Run: nano .env"
else
    echo ".env already exists"
fi

# Build frontend
echo "[7/8] Building frontend..."
echo "IMPORTANT: You need Node.js locally to build the frontend"
echo "Run these commands:"
echo "  npm install"
echo "  npm run build"
echo ""
read -p "Have you built the frontend? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please build the frontend first:"
    echo "  npm install && npm run build"
    exit 1
fi

# Build and start Docker containers
echo "[8/8] Building and starting Docker containers..."
sudo docker-compose build
sudo docker-compose up -d

echo ""
echo "===== Deployment Complete! ====="
echo ""
echo "Next steps:"
echo "1. Edit .env file and change all passwords: nano .env"
echo "2. Rebuild app after .env changes: sudo docker-compose build app && sudo docker-compose up -d"
echo "3. Access the application at: http://$(curl -s ifconfig.me)"
echo ""
echo "Default login:"
echo "  Email: demo@agency.com"
echo "  Password: password123"
echo ""
echo "IMPORTANT: Remember to rebuild Docker image after code changes:"
echo "  git pull"
echo "  sudo docker-compose build app"
echo "  sudo docker-compose up -d"
