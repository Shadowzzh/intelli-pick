import { PageHeader } from "@/components/layout/PageHeader";
import { useState } from "react";

// 类型定义
interface FeedItem {
	title: string;
	author: string;
	time: string;
}

interface NewsItem {
	title: string;
	domain: string;
	points: number;
	comments: number;
	time: string;
}

interface VideoItem {
	title: string;
	author: string;
	duration: string;
	thumbnail?: string;
}

interface TwitchChannel {
	name: string;
	game: string;
	viewers: number;
	avatar?: string;
}

interface StockItem {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
}

// 模拟数据
const mockFeeds: FeedItem[] = [
	{
		title: "Understanding React Server Components",
		author: "Dan Abramov",
		time: "2h ago",
	},
	{
		title: "The Future of Web Development",
		author: "Sarah Drasner",
		time: "5h ago",
	},
	{ title: "TypeScript Best Practices", author: "Matt Pocock", time: "8h ago" },
];

const mockNews: NewsItem[] = [
	{
		title: "OpenAI announces GPT-5",
		domain: "openai.com",
		points: 842,
		comments: 234,
		time: "1h ago",
	},
	{
		title: "New JavaScript framework released",
		domain: "github.com",
		points: 156,
		comments: 45,
		time: "2h ago",
	},
	{
		title: "Vite 6.0 is now available",
		domain: "vitejs.dev",
		points: 523,
		comments: 89,
		time: "3h ago",
	},
	{
		title: "Rust becomes most loved language",
		domain: "stackoverflow.blog",
		points: 234,
		comments: 67,
		time: "4h ago",
	},
	{
		title: "Next.js 15 released with new features",
		domain: "nextjs.org",
		points: 445,
		comments: 123,
		time: "5h ago",
	},
];

const mockVideos: VideoItem[] = [
	{ title: "Building Modern Web Apps", author: "Fireship", duration: "12:34" },
	{ title: "React in 100 Seconds", author: "Fireship", duration: "3:45" },
	{ title: "TypeScript Tutorial", author: "Traversy Media", duration: "45:21" },
	{ title: "CSS Grid Explained", author: "Kevin Powell", duration: "15:30" },
	{
		title: "Full Stack Course",
		author: "Web Dev Simplified",
		duration: "1:23:45",
	},
];

const mockTwitchChannels: TwitchChannel[] = [
	{ name: "shroud", game: "Valorant", viewers: 45234 },
	{ name: "pokimane", game: "Just Chatting", viewers: 32156 },
	{ name: "xQc", game: " variety", viewers: 54123 },
];

const mockStocks: StockItem[] = [
	{
		symbol: "AAPL",
		name: "Apple Inc.",
		price: 178.52,
		change: 2.34,
		changePercent: 1.33,
	},
	{
		symbol: "GOOGL",
		name: "Alphabet Inc.",
		price: 141.8,
		change: -1.23,
		changePercent: -0.86,
	},
	{
		symbol: "MSFT",
		name: "Microsoft",
		price: 378.91,
		change: 4.56,
		changePercent: 1.22,
	},
	{
		symbol: "AMZN",
		name: "Amazon",
		price: 178.25,
		change: 3.12,
		changePercent: 1.78,
	},
	{
		symbol: "TSLA",
		name: "Tesla Inc.",
		price: 248.5,
		change: -5.67,
		changePercent: -2.23,
	},
	{
		symbol: "META",
		name: "Meta Platforms",
		price: 505.75,
		change: 8.9,
		changePercent: 1.79,
	},
];

// Calendar 组件
function CalendarWidget() {
	const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
	const dates = Array.from({ length: 35 }, (_, i) => i + 1);
	const today = 17;

	return (
		<div className="widget">
			<div className="widget-header">
				<span>April</span>
				<span className="text-muted-foreground">Week 17·2024</span>
			</div>
			<div className="widget-content">
				<div className="calendar-grid">
					{days.map((day) => (
						<div key={day} className="calendar-day-header">
							{day}
						</div>
					))}
					{dates.map((date) => (
						<div
							key={date}
							className={`calendar-day ${date === today ? "calendar-day-today" : ""}`}
						>
							{date}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// RSS Feed 组件
function RSSFeedWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>RSS FEED</span>
			</div>
			<div className="widget-content">
				<ul className="feed-list">
					{mockFeeds.map((feed) => (
						<li key={feed.title} className="feed-item">
							<button type="button" className="feed-title">
								{feed.title}
							</button>
							<div className="feed-meta">
								<span className="text-muted-foreground">{feed.author}</span>
								<span className="text-muted-foreground">·{feed.time}</span>
							</div>
						</li>
					))}
				</ul>
				<button type="button" className="show-more-btn">
					<span>SHOW MORE</span>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						role="img"
						aria-label="Show more"
					>
						<path
							d="M2 4l4 4 4-4"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

// Twitch Channels 组件
function TwitchChannelsWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>TWITCH CHANNELS</span>
			</div>
			<div className="widget-content">
				<ul className="twitch-list">
					{mockTwitchChannels.map((channel) => (
						<li key={channel.name} className="twitch-item">
							<div className="twitch-avatar">
								<svg
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="none"
									className="text-muted-foreground"
									role="img"
									aria-label={`${channel.name} avatar`}
								>
									<rect
										width="40"
										height="40"
										rx="8"
										fill="currentColor"
										opacity="0.2"
									/>
								</svg>
							</div>
							<div className="twitch-info">
								<div className="twitch-name">{channel.name}</div>
								<div className="text-muted-foreground text-xs">
									{channel.game}
								</div>
								<div className="twitch-stats">
									<span className="live-badge">LIVE</span>
									<span className="text-muted-foreground text-xs">
										{channel.viewers.toLocaleString()} viewers
									</span>
								</div>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

// Hacker News 组件
function HackerNewsWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>HACKER NEWS</span>
			</div>
			<div className="widget-content">
				<ul className="news-list">
					{mockNews.map((news) => (
						<li key={news.title} className="news-item">
							<button type="button" className="news-title">
								{news.title}
							</button>
							<div className="news-meta">
								<span className="text-muted-foreground text-xs">
									{news.points}
								</span>
								<span className="text-muted-foreground text-xs">
									{news.comments}
								</span>
								<span className="text-muted-foreground text-xs">
									{news.domain}
								</span>
								<span className="text-muted-foreground text-xs">
									{news.time}
								</span>
							</div>
						</li>
					))}
				</ul>
				<button type="button" className="show-more-btn">
					<span>SHOW MORE</span>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						role="img"
						aria-label="Show more"
					>
						<path
							d="M2 4l4 4 4-4"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

// Videos 组件
function VideosWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>VIDEOS</span>
			</div>
			<div className="widget-content">
				<div className="videos-grid">
					{mockVideos.map((video) => (
						<div key={video.title} className="video-card">
							<div className="video-thumbnail">
								<svg
									width="100%"
									height="100%"
									viewBox="0 0 160 90"
									fill="none"
									className="text-muted-foreground"
									role="img"
									aria-label={`${video.title} thumbnail`}
								>
									<rect
										width="160"
										height="90"
										fill="currentColor"
										opacity="0.1"
									/>
								</svg>
							</div>
							<div className="video-info">
								<button type="button" className="video-title text-sm">
									{video.title}
								</button>
								<div className="text-muted-foreground text-xs">
									{video.author}
								</div>
								<div className="text-muted-foreground text-xs">
									{video.duration}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// Reddit 组件
function RedditWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>/R/SUBREDDIT</span>
			</div>
			<div className="widget-content">
				<div className="reddit-content">
					<p className="text-muted-foreground text-sm">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
					<div className="reddit-meta">
						<span className="text-muted-foreground text-sm">234 points</span>
						<span className="text-muted-foreground text-sm">56 comments</span>
						<span className="text-primary text-sm">reddit.com</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Weather 组件
function WeatherWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>WEATHER</span>
			</div>
			<div className="widget-content">
				<div className="weather-info">
					<div className="weather-status text-lg">Overcast</div>
					<div className="text-muted-foreground text-sm">Feels like 5°C</div>
					<div className="weather-temp-chart">
						<div className="temp-values">
							{["6am", "9am", "12pm", "3pm", "6pm", "9pm"].map((time) => (
								<div key={time} className="temp-bar">
									<div
										className="temp-fill"
										style={{
											height: `${30 + Math.random() * 40}%`,
										}}
									/>
									<span className="text-xs text-muted-foreground">{time}</span>
								</div>
							))}
						</div>
					</div>
					<div className="text-muted-foreground text-sm">Prague, Czechia</div>
				</div>
			</div>
		</div>
	);
}

// Stocks 组件
function StocksWidget() {
	return (
		<div className="widget">
			<div className="widget-header">
				<span>STOCKS</span>
			</div>
			<div className="widget-content">
				<ul className="stocks-list">
					{mockStocks.map((stock) => (
						<li key={stock.symbol} className="stock-item">
							<div className="stock-info">
								<div className="stock-symbol">{stock.symbol}</div>
								<div className="text-muted-foreground text-xs">
									{stock.name}
								</div>
							</div>
							<div className="stock-values">
								<div
									className={`stock-change ${
										stock.change >= 0 ? "stock-positive" : "stock-negative"
									}`}
								>
									<span>{stock.change >= 0 ? "+" : ""}</span>
									{stock.changePercent.toFixed(2)}%
								</div>
								<div className="stock-price">${stock.price.toFixed(2)}</div>
							</div>
							<div className="stock-chart">
								<svg
									width="60"
									height="30"
									viewBox="0 0 60 30"
									role="img"
									aria-label={`${stock.symbol} chart`}
								>
									<path
										d={Array.from({ length: 6 }, (_, i) => {
											const x = i * 12;
											const y = 15 + (Math.random() - 0.5) * 20;
											return `${i === 0 ? "M" : "L"} ${x} ${y}`;
										}).join(" ")}
										fill="none"
										stroke={stock.change >= 0 ? "#22c55e" : "#ef4444"}
										strokeWidth="2"
									/>
								</svg>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

// 主页面
export function TestPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const pages = [1, 2, 3, 4];

	return (
		<div className="min-h-screen bg-background text-foreground p-6">
			<div className="w-full">
				{/* 页面导航 */}
				<PageHeader
					pages={pages}
					currentPage={currentPage}
					onPageChange={setCurrentPage}
				/>

				{/* 多栏布局 */}
				<div className="flex gap-5">
					<div className="w-1/5  flex flex-col gap-5">
						<CalendarWidget />
						<RSSFeedWidget />
						<TwitchChannelsWidget />
					</div>

					<div className="w-2/5 flex flex-col gap-5">
						<HackerNewsWidget />
						<VideosWidget />
						<RedditWidget />
					</div>

					<div className="w-1/5 flex flex-col gap-5">
						<WeatherWidget />
						<StocksWidget />
					</div>
				</div>
			</div>
		</div>
	);
}
