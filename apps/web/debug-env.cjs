#!/usr/bin/env node

/**
 * Vite 环境变量诊断脚本
 * 运行: node debug-env.js
 */

const fs = require("node:fs");
const path = require("node:path");

console.log("=== Vite 环境变量诊断 ===\n");

// 检查环境变量文件是否存在
const envFiles = [
	".env",
	".env.local",
	".env.development",
	".env.production",
	".env.example",
];

console.log("1. 环境变量文件检查:");
for (const file of envFiles) {
	const filePath = path.join(__dirname, file);
	const exists = fs.existsSync(filePath);
	if (exists) {
		const content = fs.readFileSync(filePath, "utf-8");
		const hasApiUrl = content.includes("VITE_API_URL");
		console.log(
			`   ✅ ${file} ${hasApiUrl ? "(包含 VITE_API_URL)" : "(不包含 VITE_API_URL)"}`,
		);
	} else {
		console.log(`   ❌ ${file} (不存在)`);
	}
}

// 读取 .env.local 的内容
const envLocalPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envLocalPath)) {
	console.log("\n2. .env.local 内容:");
	const content = fs.readFileSync(envLocalPath, "utf-8");
	const lines = content.split("\n");
	for (const line of lines) {
		if (line.trim() && !line.startsWith("#")) {
			// 隐藏敏感信息的值
			const [key, ...valueParts] = line.split("=");
			const value = valueParts.join("=");
			if (key.startsWith("VITE_")) {
				console.log(`   ${key}=${value || "(空值)"}`);
			}
		}
	}
}

console.log("\n3. 运行建议:");
console.log("   ✅ 如果 .env.local 存在，确保已重启开发服务器");
console.log(
	"   ✅ 在浏览器控制台检查: console.log(import.meta.env.VITE_API_URL)",
);
console.log("   ✅ 检查是否有 TypeScript 类型错误");
