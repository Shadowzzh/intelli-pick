import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { ContentHomePage } from "./pages/ContentHomePage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { TestPage } from "./pages/TestPage";

function App() {
	return (
		<ErrorBoundary>
			<Routes>
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
		</ErrorBoundary>
	);
}

export default App;
