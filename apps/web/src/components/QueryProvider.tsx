import { queryClient } from "@/lib/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const client = queryClient();

	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
