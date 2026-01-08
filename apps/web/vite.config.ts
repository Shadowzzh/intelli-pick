import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-plugin-tsconfig-paths";

export default defineConfig(({ mode }) => {
	// 从根目录加载环境变量
	const env = loadEnv(mode, "../../", "");

	// 代理目标：开发环境使用实际的后端地址
	// 优先使用 VITE_API_PROXY_TARGET，否则使用 API_PORT 构建地址
	const proxyTarget = env.VITE_API_PROXY_TARGET ;

	return {
		plugins: [react(), tsconfigPaths()],
		server: {
			port: 5173,
			host: "0.0.0.0",
			proxy: {
				"/graphql": {
					target: proxyTarget,
					changeOrigin: true,
				},
				"/api": {
					target: proxyTarget,
					changeOrigin: true,
				},
			},
		},
	};
});
