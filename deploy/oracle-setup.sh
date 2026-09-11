#!/bin/bash
# Chạy 1 lần trên máy Ubuntu 24.04 mới của Oracle (user ubuntu).
# Tác dụng: cài Docker + mở cổng 5000 + tạo secret.
set -e

echo "1/4 Cai Docker..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu

echo "2/4 Mo cong 5000 (web)..."
sudo iptables -I INPUT -p tcp --dport 5000 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo "3/4 Lay code..."
cd ~
if [ ! -d restaurant-booking ]; then
  git clone https://github.com/lehoangtung269/restaurant-booking.git
fi
cd restaurant-booking

echo "4/4 Tao secret..."
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s/doi-mat-khau-db-o-day/$(openssl rand -hex 16)/" .env
  sed -i "s/doi-chuoi-bi-mat-1-it-nhat-32-ky-tu-o-day/$(openssl rand -hex 32)/" .env
  sed -i "s/doi-chuoi-bi-mat-2-it-nhat-32-ky-tu-o-day/$(openssl rand -hex 32)/" .env
fi

echo "Xong. Dang nhap lai (de nhan quyen docker) roi chay:"
echo "  cd ~/restaurant-booking && sudo docker compose up -d --build"
echo "Kiem tra: curl localhost:5000/api/health"
