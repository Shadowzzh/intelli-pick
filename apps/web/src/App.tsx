import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { ContentHomePage } from "./pages/ContentHomePage";
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
				<Route path="/test" element={<TestPage />} />
			</Routes>
		</ErrorBoundary>
	);
}

export default App;
