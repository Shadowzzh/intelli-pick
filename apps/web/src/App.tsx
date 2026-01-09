import { ContentList } from "./components/content/ContentList";
import { EntityList } from "./components/entity/EntityList";
import { AppLayout } from "./components/layout/AppLayout";
import { GridColumn } from "./components/layout/GridColumn";
import { StatsGrid } from "./components/stats/StatsGrid";
import { useRealtime } from "./hooks/useRealtime";
import { Routes, Route } from "react-router-dom";
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
		<Routes>
			<Route path="/" element={<Dashboard />} />
			<Route path="/test" element={<TestPage />} />
		</Routes>
	);
}

export default App;
