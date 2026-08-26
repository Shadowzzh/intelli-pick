import { AUTH_UNAUTHORIZED_EVENT, api } from "@/lib/api";
import { socketManager } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

interface AuthUser {
	username: string;
}

interface LoginInput {
	username: string;
	password: string;
	remember: boolean;
}

interface AuthContextValue {
	user: AuthUser | null;
	isLoading: boolean;
	login(input: LoginInput): Promise<void>;
	logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const clearSession = useCallback(() => {
		socketManager.disconnect();
		queryClient.clear();
		setUser(null);
	}, [queryClient]);

	useEffect(() => {
		let active = true;

		api
			.get<AuthUser>("/api/v1/auth/session")
			.then((session) => {
				if (active) {
					setUser(session);
				}
			})
			.catch(() => {
				if (active) {
					setUser(null);
				}
			})
			.finally(() => {
				if (active) {
					setIsLoading(false);
				}
			});

		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
		return () => {
			window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
		};
	}, [clearSession]);

	const login = useCallback(async (input: LoginInput) => {
		const session = await api.post<AuthUser>("/api/v1/auth/login", input);
		setUser(session);
	}, []);

	const logout = useCallback(async () => {
		await api.post<{ loggedOut: boolean }>("/api/v1/auth/logout");
		clearSession();
	}, [clearSession]);

	const value = useMemo(
		() => ({ user, isLoading, login, logout }),
		[user, isLoading, login, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
