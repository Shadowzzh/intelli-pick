import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
				<LoaderCircle
					className="size-[20px] animate-spin"
					aria-label="正在加载"
				/>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}
