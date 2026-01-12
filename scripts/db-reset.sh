#!/bin/bash

# IntelliPick 数据库清空脚本
# 使用方法: ./scripts/db-reset.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 加载 .env 文件
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  echo -e "${GREEN}正在加载 .env 文件...${NC}"
  # 导出 .env 文件中的变量（忽略注释和空行）
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

echo -e "${YELLOW}⚠️  警告：此操作将清空所有数据库数据！${NC}"
echo -e "${YELLOW}包含的表：contents, entities, entity_mentions, tags, quarantine, sources${NC}"
echo ""
read -p "确定要继续吗？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo -e "${GREEN}操作已取消${NC}"
  exit 0
fi

# 检查 DATABASE_URL 是否设置
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}错误：DATABASE_URL 环境变量未设置${NC}"
  echo "请先设置 DATABASE_URL 或加载 .env 文件"
  exit 1
fi

echo -e "${GREEN}正在清空数据库...${NC}"

# 执行 SQL 脚本
psql "$DATABASE_URL" -f "$(dirname "$0")/db-reset.sql"

echo -e "${GREEN}✅ 数据库已清空！${NC}"
