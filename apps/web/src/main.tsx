import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthProvider";
import { QueryProvider } from "./components/QueryProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ThemeProvider
			defaultTheme="dark"
			storageKey="intellipick-theme"
			attribute="class"
		>
			<QueryProvider>
				<AuthProvider>
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</AuthProvider>
			</QueryProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
