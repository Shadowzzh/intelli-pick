.PHONY: restart

restart:
	@echo "构建 pnpm 项目..."
	@pnpm build || { echo "❌ pnpm build 失败"; exit 1; }
	@echo "停止并删除所有服务..."
	@docker compose down
	@echo "重新构建并启动所有服务..."
	@docker compose up -d --build
	@echo "✅ 重启完成"