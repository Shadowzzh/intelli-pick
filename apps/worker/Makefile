# ============================================
# IntelliPick Worker - 部署 Makefile
# ============================================
#
# 此 Makefile 专用于 Worker 应用的 Docker 部署
#
# 使用方法：
#   make -C apps/worker help

#   make <target>      # 从 apps/worker/ 目录执行
#   make <target>      # 或从项目根目录执行（自动切换）
#
# 常用命令：
#   make deploy        # 一键部署（编译 + 构建 + 启动）
#   make build         # 构建 Docker 镜像
#   make up            # 启动服务
# ============================================

# 项目根目录
PROJECT_ROOT := $(shell dirname $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST)))))

# 检查当前目录，如果不在 apps/worker/，自动切换
ifeq ($(findstring apps/worker,$(CURDIR)),)
  # 不在 apps/worker/，切换到项目根目录执行 make
  .PHONY: $(MAKECMDGOALS)
  $(MAKECMDGOALS):
	@cd $(PROJECT_ROOT) && pnpm --filter @intellipick/worker make $(MAKECMDGOALS)
else
  # 在 apps/worker/，执行实际的部署命令
  .PHONY: help deploy build up down logs logs-app ps restart
  .PHONY: shell db redis db-migrate logs-tail clean-images

  .DEFAULT_GOAL := help

  ## 一键部署：编译 + 构建 + 启动
  deploy:
	@echo "🚀 开始部署 API 应用..."
	@echo "📦 安装依赖..."
	@cd $(PROJECT_ROOT) && pnpm install
	@echo "🔨 编译 TypeScript..."
	@cd $(PROJECT_ROOT) && pnpm build
	@echo "🐳 构建 Docker 镜像..."
	@cd $(PROJECT_ROOT) && docker compose build app
	@echo "🚀 启动服务..."
	@cd $(PROJECT_ROOT) && docker compose up -d app
	@echo "✅ 部署完成！"
	@cd $(PROJECT_ROOT) && docker compose ps

  ## 构建 Docker 镜像（需要先在根目录执行 pnpm build）
  build:
	@echo "🐳 构建 API Docker 镜像..."
	@cd $(PROJECT_ROOT) && docker compose build app

  ## 启动所有服务
  up:
	@echo "🚀 启动所有服务..."
	@cd $(PROJECT_ROOT) && docker compose up -d

  ## 停止所有服务
  down:
	@echo "🛑 停止所有服务..."
	@cd $(PROJECT_ROOT) && docker compose down

  ## 查看所有服务实时日志
  logs:
	@cd $(PROJECT_ROOT) && docker compose logs -f

  ## 查看 API 服务日志
  logs-app:
	@cd $(PROJECT_ROOT) && docker compose logs -f app

  ## 查看服务状态
  ps:
	@cd $(PROJECT_ROOT) && docker compose ps

  ## 重启 API 服务
  restart:
	@echo "🔄 重启 API 服务..."
	@cd $(PROJECT_ROOT) && docker compose restart app

  ## 进入 API 容器 Shell
  shell:
	@cd $(PROJECT_ROOT) && docker compose exec app sh

  ## 进入数据库
  db:
	@cd $(PROJECT_ROOT) && docker compose exec db psql -U postgres -d intellipick

  ## 进入 Redis CLI
  redis:
	@cd $(PROJECT_ROOT) && docker compose exec redis redis-cli

  ## 在 Docker 容器中运行数据库迁移
  db-migrate:
	@echo "🗄️ 在 Docker 容器中运行迁移..."
	@cd $(PROJECT_ROOT) && docker compose exec app pnpm db:migrate

  ## 查看日志（最新 50 行）
  logs-tail:
	@cd $(PROJECT_ROOT) && docker compose logs --tail=50 app

  ## 查看镜像大小
  images:
	@docker images | grep intellipick

  ## 清理悬空镜像
  clean-images:
	@echo "🧹 清理悬空 Docker 镜像..."
	@docker image prune -f

  ## 显示此帮助信息
  help:
	@echo ""
	@echo "IntelliPick API - Docker 部署命令"
	@echo ""
	@echo "部署命令:"
	@echo "  make deploy         - 一键部署（编译+构建+启动）⭐"
	@echo "  make build          - 构建 Docker 镜像"
	@echo "  make up             - 启动所有服务"
	@echo "  make down           - 停止所有服务"
	@echo "  make restart        - 重启 API 服务"
	@echo ""
	@echo "日志和调试:"
	@echo "  make logs           - 查看所有服务实时日志"
	@echo "  make logs-app       - 查看 API 服务日志"
	@echo "  make logs-tail      - 查看最新 50 行日志"
	@echo "  make ps             - 查看服务状态"
	@echo "  make shell          - 进入 API 容器 Shell"
	@echo ""
	@echo "数据库命令:"
	@echo "  make db             - 进入 PostgreSQL"
	@echo "  make redis          - 进入 Redis CLI"
	@echo "  make db-migrate     - 运行数据库迁移"
	@echo ""
	@echo "维护命令:"
	@echo "  make images         - 查看镜像大小"
	@echo "  make clean-images   - 清理悬空镜像"
	@echo "  make help           - 显示此帮助信息"
	@echo ""
	@echo "常用流程:"
	@echo "  make deploy         - 首次部署或更新"
	@echo "  make logs-app       - 调试问题"
	@echo "  make db-migrate     - 数据库迁移"
	@echo ""
	@echo "注意：所有命令需要在项目根目录已执行 pnpm build"
	@echo ""

endif
