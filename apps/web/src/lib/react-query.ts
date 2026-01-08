import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | undefined;

export function queryClient() {
	if (!client) {
		client = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 1000 * 60 * 5, // 5 minutes
					gcTime: 1000 * 60 * 30, // 30 minutes
					refetchOnWindowFocus: false,
					refetchOnReconnect: true,
					retry: (failureCount, error) => {
						// Don't retry on 4xx errors
						const err = error as { statusCode?: number } | undefined;
						if (
							err?.statusCode &&
							err.statusCode >= 400 &&
							err.statusCode < 500
						) {
							return false;
						}
						return failureCount < 3;
					},
					retryDelay: (attemptIndex) =>
						Math.min(1000 * 2 ** attemptIndex, 30000),
				},
			},
		});
	}
	return client;
}
