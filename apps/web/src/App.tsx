import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { ContentHomePage } from "./pages/ContentHomePage";
import { ContentList } from "./components/content/ContentList";
import { EntityList } from "./components/entity/EntityList";
import { AppLayout } from "./components/layout/AppLayout";
import { GridColumn } from "./components/layout/GridColumn";
import { StatsGrid } from "./components/stats/StatsGrid";
import { useRealtime } from "./hooks/useRealtime";
import { TestPage } from "./pages/TestPage";

function Dashboard() {
	useRealtime();

	return (
		<AppLayout>
			<GridColumn size="small">
				<StatsGrid />
			</GridColumn>

			<GridColumn size="medium">
				<ContentList />
			</GridColumn>

			<GridColumn size="small">
				<EntityList />
			</GridColumn>
		</AppLayout>
	);
}

function App() {
	return (
		<ErrorBoundary>
			<Routes>
				<Route path="/" element={<Dashboard />} />
				<Route
					path="/content-home"
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
