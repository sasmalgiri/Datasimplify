#!/bin/bash

# ============================================
# DATASIMPLIFY - COMPLETE PRODUCTION SETUP
# For Oracle Cloud Free Tier (or any Ubuntu VPS)
# ============================================

set -e  # Exit on error

echo "================================================"
echo "  DataSimplify Production Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# ============================================
# STEP 1: System Update
# ============================================
echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git htop nginx certbot python3-certbot-nginx

echo -e "${GREEN}✓ System updated${NC}"

# ============================================
# STEP 2: Install Node.js 20
# ============================================
echo -e "${YELLOW}Step 2: Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo -e "${GREEN}✓ Node.js installed${NC}"

# ============================================
# STEP 3: Install PM2
# ============================================
echo -e "${YELLOW}Step 3: Installing PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}✓ PM2 installed${NC}"

# ============================================
# STEP 4: Install Ollama
# ============================================
echo -e "${YELLOW}Step 4: Installing Ollama...${NC}"
curl -fsSL https://ollama.com/install.sh | sh

# Configure Ollama to listen on all interfaces
mkdir -p /etc/systemd/system/ollama.service.d/
cat > /etc/systemd/system/ollama.service.d/override.conf << EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama

echo -e "${GREEN}✓ Ollama installed${NC}"

# ============================================
# STEP 5: Pull AI Models
# ============================================
echo -e "${YELLOW}Step 5: Pulling AI models (this may take a while)...${NC}"
ollama pull llama3.2
ollama pull nomic-embed-text

echo -e "${GREEN}✓ AI models ready${NC}"

# ============================================
# STEP 6: Create App User
# ============================================
echo -e "${YELLOW}Step 6: Creating app user...${NC}"
if ! id "datasimplify" &>/dev/null; then
    useradd -m -s /bin/bash datasimplify
fi
echo -e "${GREEN}✓ App user created${NC}"

# ============================================
# STEP 7: Setup App Directory
# ============================================
echo -e "${YELLOW}Step 7: Setting up app directory...${NC}"
mkdir -p /home/datasimplify/app
chown -R datasimplify:datasimplify /home/datasimplify/app

echo -e "${GREEN}✓ App directory ready${NC}"

# ============================================
# STEP 8: Configure Firewall
# ============================================
echo -e "${YELLOW}Step 8: Configuring firewall...${NC}"

# For Oracle Cloud (iptables)
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT

# Save iptables rules
apt install -y iptables-persistent
netfilter-persistent save

echo -e "${GREEN}✓ Firewall configured${NC}"

# ============================================
# STEP 9: Configure Nginx
# ============================================
echo -e "${YELLOW}Step 9: Configuring Nginx...${NC}"

# Backup default config
mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak 2>/dev/null || true

# Create new config
cat > /etc/nginx/sites-available/datasimplify << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for AI requests
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # Ollama API (optional - remove in production)
    location /ollama/ {
        proxy_pass http://localhost:11434/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/datasimplify /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# ============================================
# STEP 10: Create Systemd Service for App
# ============================================
echo -e "${YELLOW}Step 10: Creating systemd service...${NC}"

cat > /etc/systemd/system/datasimplify.service << EOF
[Unit]
Description=DataSimplify Next.js App
After=network.target ollama.service

[Service]
Type=simple
User=datasimplify
WorkingDirectory=/home/datasimplify/app/datasimplify
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable datasimplify

echo -e "${GREEN}✓ Systemd service created${NC}"

# ============================================
# STEP 11: Setup Cron Jobs
# ============================================
echo -e "${YELLOW}Step 11: Setting up cron jobs...${NC}"

# Create cron script
cat > /home/datasimplify/sync.sh << 'EOF'
#!/bin/bash
# DataSimplify Data Sync Script

SECRET="YOUR_SYNC_SECRET_HERE"  # Change this!
BASE_URL="http://localhost:3000"

# Sync market data
curl -s "${BASE_URL}/api/sync?secret=${SECRET}&type=market" > /dev/null

# Sync sentiment (every 15 min, but this runs every minute)
MINUTE=$(date +%M)
if [ $((MINUTE % 15)) -eq 0 ]; then
    curl -s "${BASE_URL}/api/sync?secret=${SECRET}&type=sentiment" > /dev/null
fi

# Sync whales (every 5 min)
if [ $((MINUTE % 5)) -eq 0 ]; then
    curl -s "${BASE_URL}/api/sync?secret=${SECRET}&type=whales" > /dev/null
fi

# Index to vector DB (every hour)
if [ "$MINUTE" -eq "0" ]; then
    curl -s "${BASE_URL}/api/ai/index?secret=${SECRET}&type=all" > /dev/null
fi
EOF

chmod +x /home/datasimplify/sync.sh
chown datasimplify:datasimplify /home/datasimplify/sync.sh

# Add to crontab
(crontab -u datasimplify -l 2>/dev/null; echo "* * * * * /home/datasimplify/sync.sh >> /home/datasimplify/sync.log 2>&1") | crontab -u datasimplify -

echo -e "${GREEN}✓ Cron jobs configured${NC}"

# ============================================
# STEP 12: Create Deploy Script
# ============================================
echo -e "${YELLOW}Step 12: Creating deploy script...${NC}"

cat > /home/datasimplify/deploy.sh << 'EOF'
#!/bin/bash
# Deploy script for DataSimplify

cd /home/datasimplify/app/datasimplify

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building app..."
npm run build

echo "Restarting service..."
sudo systemctl restart datasimplify

echo "Deploy complete!"
EOF

chmod +x /home/datasimplify/deploy.sh
chown datasimplify:datasimplify /home/datasimplify/deploy.sh

echo -e "${GREEN}✓ Deploy script created${NC}"

# ============================================
# STEP 13: Setup Log Rotation
# ============================================
echo -e "${YELLOW}Step 13: Setting up log rotation...${NC}"

cat > /etc/logrotate.d/datasimplify << EOF
/home/datasimplify/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF

echo -e "${GREEN}✓ Log rotation configured${NC}"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "================================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Upload your app to /home/datasimplify/app/"
echo "   scp -r datasimplify/ datasimplify@YOUR_IP:/home/datasimplify/app/"
echo ""
echo "2. Create .env.local file:"
echo "   nano /home/datasimplify/app/datasimplify/.env.local"
echo ""
echo "3. Build and start:"
echo "   cd /home/datasimplify/app/datasimplify"
echo "   npm install"
echo "   npm run build"
echo "   sudo systemctl start datasimplify"
echo ""
echo "4. Setup SSL (if you have a domain):"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "5. Update sync.sh with your SYNC_SECRET"
echo "   nano /home/datasimplify/sync.sh"
echo ""
echo "Services status:"
systemctl status ollama --no-pager | head -5
systemctl status nginx --no-pager | head -5
echo ""
echo "Ollama models:"
ollama list
echo ""
echo "================================================"
