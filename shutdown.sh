#!/bin/bash

# ============================================
# myblog 服务卸载脚本
# 使用方法: sudo bash undeploy-services.sh
# ============================================

set -e

echo "=========================================="
echo "  myblog 服务卸载脚本"
echo "=========================================="

if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 sudo 运行此脚本"
    exit 1
fi

echo "[1/3] 停止服务..."
systemctl stop myblog-backend.service 2>/dev/null || true
systemctl stop myblog-frontend.service 2>/dev/null || true
echo "✅ 服务已停止"

echo "[2/3] 禁用开机自启..."
systemctl disable myblog-backend.service 2>/dev/null || true
systemctl disable myblog-frontend.service 2>/dev/null || true
echo "✅ 自启动已禁用"

echo "[3/3] 删除服务文件..."
rm -f /etc/systemd/system/myblog-backend.service
rm -f /etc/systemd/system/myblog-frontend.service
systemctl daemon-reload
echo "✅ 服务文件已删除"

echo ""
echo "=========================================="
echo "  卸载完成！所有 myblog 服务已移除"
echo "=========================================="
