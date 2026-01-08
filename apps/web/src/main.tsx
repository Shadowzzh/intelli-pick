import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryProvider } from "./components/QueryProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="intellipick-theme">
			<QueryProvider>
				<App />
			</QueryProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
