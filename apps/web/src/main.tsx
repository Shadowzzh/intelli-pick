import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryProvider } from "./components/QueryProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="intellipick-theme">
			<QueryProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</QueryProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
