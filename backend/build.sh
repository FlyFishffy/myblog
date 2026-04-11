#!/bin/bash

# ============================================
# 构建脚本
# ============================================

set -e

BUILD_DIR="build"

echo "=========================================="
echo "  myblog 后端构建脚本"
echo "=========================================="

# 创建构建目录
if [ ! -d "$BUILD_DIR" ]; then
    echo "[1/3] 创建构建目录..."
    mkdir -p "$BUILD_DIR"
fi

# CMake 配置
echo "[2/3] CMake 配置中（首次构建需要下载依赖，请耐心等待）..."
cd "$BUILD_DIR"
cmake .. -DCMAKE_BUILD_TYPE=Release

# 编译
echo "[3/3] 编译中..."
cmake --build . -j$(nproc)

echo "=========================================="
echo "  构建完成！"
echo "  运行方式: ./build/myblog-backend"
echo "=========================================="
