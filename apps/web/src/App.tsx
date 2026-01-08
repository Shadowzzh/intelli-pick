import { ContentList } from "./components/content/ContentList";
import { EntityList } from "./components/entity/EntityList";
import { AppLayout } from "./components/layout/AppLayout";
import { GridColumn } from "./components/layout/GridColumn";
import { StatsGrid } from "./components/stats/StatsGrid";
import { useRealtime } from "./hooks/useRealtime";

function App() {
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

export default App;
