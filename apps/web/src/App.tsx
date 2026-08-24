import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Route, Routes, useLocation } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { ContentHomePage } from "./pages/ContentHomePage";
import { LoginPage } from "./pages/LoginPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { TestPage } from "./pages/TestPage";

function App() {
	const location = useLocation();
	const showDevtools = import.meta.env.DEV && location.pathname !== "/login";

	return (
		<ErrorBoundary>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route
					path="/"
					element={
						<ErrorBoundary>
							<ContentHomePage />
						</ErrorBoundary>
					}
				/>
				<Route
					path="/monitoring"
					element={
						<ErrorBoundary>
							<MonitoringPage />
						</ErrorBoundary>
					}
				/>
				<Route path="/test" element={<TestPage />} />
			</Routes>
			{showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
		</ErrorBoundary>
	);
}

export default App;
