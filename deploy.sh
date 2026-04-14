#!/bin/bash

# ============================================
# myblog systemd 服务部署脚本
# 使用方法: sudo bash deploy-services.sh
# ============================================

set -e

# ---------- Configuration ----------
# Modify these paths to match your actual deployment
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)/myblog"
SERVICE_USER="$(whoami)"

echo "=========================================="
echo "  myblog 服务部署脚本 (Ubuntu/systemd)"
echo "=========================================="
echo "  项目目录: $PROJECT_DIR"
echo "  运行用户: $SERVICE_USER"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 sudo 运行此脚本"
    exit 1
fi

# ---------- Step 1: Generate service files ----------
echo ""
echo "[1/4] 生成 systemd 服务文件..."

# Backend service
cat > /etc/systemd/system/myblog-backend.service << EOF
[Unit]
Description=myblog Backend Service (C++ Crow)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR/backend/build
ExecStart=$PROJECT_DIR/backend/build/myblog-backend
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myblog-backend

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/myblog-frontend.service << EOF
[Unit]
Description=myblog Frontend Service (Vite Dev Server)
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=$(which npm) run dev
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myblog-frontend
Environment=NODE_ENV=development
Environment=PATH=/usr/local/bin:/usr/bin:/bin:$(dirname $(which node))

[Install]
WantedBy=multi-user.target
EOF

echo "✅ 服务文件已生成"

# ---------- Step 2: Reload systemd ----------
echo "[2/4] 重新加载 systemd 配置..."
systemctl daemon-reload
echo "✅ 配置已加载"

# ---------- Step 3: Enable services (auto-start on boot) ----------
echo "[3/4] 设置开机自启动..."
systemctl enable myblog-backend.service
systemctl enable myblog-frontend.service
echo "✅ 开机自启动已设置"

# ---------- Step 4: Start services ----------
echo "[4/4] 启动服务..."
systemctl start myblog-backend.service
systemctl start myblog-frontend.service
echo "✅ 服务已启动"

# ---------- Status ----------
echo ""
echo "=========================================="
echo "  部署完成！服务状态："
echo "=========================================="
echo ""
echo "--- 后端服务 ---"
systemctl status myblog-backend.service --no-pager -l
echo ""
echo "--- 前端服务 ---"
systemctl status myblog-frontend.service --no-pager -l

echo ""
echo "=========================================="
echo "  常用管理命令："
echo "=========================================="
echo ""
echo "  查看状态:"
echo "    sudo systemctl status myblog-backend"
echo "    sudo systemctl status myblog-frontend"
echo ""
echo "  查看日志:"
echo "    sudo journalctl -u myblog-backend -f"
echo "    sudo journalctl -u myblog-frontend -f"
echo ""
echo "  重启服务:"
echo "    sudo systemctl restart myblog-backend"
echo "    sudo systemctl restart myblog-frontend"
echo ""
echo "  停止服务:"
echo "    sudo systemctl stop myblog-backend"
echo "    sudo systemctl stop myblog-frontend"
echo ""
echo "  禁用开机自启:"
echo "    sudo systemctl disable myblog-backend"
echo "    sudo systemctl disable myblog-frontend"
echo ""
echo "  服务地址:"
echo "    前端: http://localhost:3639"
echo "    后端: http://localhost:8888"
echo "=========================================="
