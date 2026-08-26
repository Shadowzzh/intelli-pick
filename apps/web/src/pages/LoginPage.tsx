import { useAuth } from "@/auth/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

interface LoginLocationState {
	from?: {
		pathname: string;
		search?: string;
		hash?: string;
	};
}

export function LoginPage() {
	const { user, isLoading: isCheckingSession, login } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const passwordType = showPassword ? "text" : "password";
	const passwordToggleLabel = showPassword ? "隐藏密码" : "显示密码";
	const PasswordToggleIcon = showPassword ? EyeOff : Eye;

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		setIsSubmitting(true);

		try {
			await login({ username, password, remember });
			const state = location.state as LoginLocationState | null;
			const from = state?.from;
			const destination = from
				? `${from.pathname}${from.search || ""}${from.hash || ""}`
				: "/";
			navigate(destination, { replace: true });
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "登录失败，请稍后重试",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isCheckingSession && user) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="min-h-svh bg-background text-foreground">
			<header className="border-b border-border/80">
				<div className="mx-auto flex h-[48px] w-full max-w-[1200px] items-center px-[16px] sm:px-[24px]">
					<div className="flex items-center gap-[10px]">
						<div className="flex size-[32px] items-center justify-center rounded-[6px] border border-border bg-card text-[14px] font-bold text-primary">
							S
						</div>
						<div className="flex items-baseline gap-[8px]">
							<span className="text-[16px] font-bold leading-[20px]">Sift</span>
							<span className="text-[12px] leading-[16px] text-muted-foreground">
								知拾
							</span>
						</div>
					</div>
					<div className="ml-auto">
						<ThemeToggle className="size-[36px] [&_svg]:size-[16px]" />
					</div>
				</div>
			</header>

			<main className="flex min-h-[calc(100svh-48px)] w-full items-center justify-center px-[16px] py-[32px] sm:px-[24px]">
				<section className="w-full max-w-[384px]" aria-labelledby="login-title">
					<Card className="rounded-[8px] border-secondary shadow-sm">
						<CardHeader className="space-y-[8px] p-[20px] pb-[18px] sm:p-[24px] sm:pb-[20px]">
							<CardTitle
								id="login-title"
								className="text-[20px] leading-[24px] tracking-normal"
							>
								登录 Sift
							</CardTitle>
							<CardDescription className="text-[13px] leading-[18px]">
								进入你的信息筛选工作台
							</CardDescription>
						</CardHeader>
						<CardContent className="px-[20px] pb-[20px] pt-0 sm:px-[24px] sm:pb-[24px]">
							<form className="space-y-[20px]" onSubmit={handleSubmit}>
								{errorMessage && (
									<div
										className="flex items-start gap-[8px] rounded-[6px] border border-destructive/40 bg-destructive/10 px-[12px] py-[10px] text-[12px] leading-[16px] text-destructive"
										role="alert"
									>
										<AlertCircle className="mt-px size-[14px] shrink-0" />
										<span>{errorMessage}</span>
									</div>
								)}
								<div className="flex flex-col gap-[10px]">
									<Label
										htmlFor="username"
										className="text-[13px] leading-[16px]"
									>
										用户名
									</Label>
									<Input
										id="username"
										name="username"
										type="text"
										value={username}
										onChange={(event) => setUsername(event.target.value)}
										autoComplete="username"
										placeholder="请输入用户名"
										autoFocus
										disabled={isSubmitting}
										className="h-[40px] rounded-[6px] px-[12px] py-[8px] text-[13px] transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-0"
										required
									/>
								</div>

								<div className="flex flex-col gap-[10px]">
									<Label
										htmlFor="password"
										className="text-[13px] leading-[16px]"
									>
										密码
									</Label>
									<div className="relative">
										<Input
											id="password"
											name="password"
											type={passwordType}
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											autoComplete="current-password"
											placeholder="请输入密码"
											disabled={isSubmitting}
											className="h-[40px] rounded-[6px] px-[12px] py-[8px] pr-[40px] text-[13px] transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-0"
											required
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="absolute right-[4px] top-1/2 size-[32px] -translate-y-1/2 text-muted-foreground hover:text-foreground"
											onClick={() => setShowPassword((current) => !current)}
											disabled={isSubmitting}
											aria-label={passwordToggleLabel}
											title={passwordToggleLabel}
										>
											<PasswordToggleIcon className="size-[16px]" />
										</Button>
									</div>
								</div>

								<div className="flex items-center gap-[8px]">
									<Checkbox
										id="remember"
										name="remember"
										className="size-[16px] rounded-[3px]"
										checked={remember}
										onCheckedChange={(checked) => setRemember(checked === true)}
										disabled={isSubmitting}
									/>
									<Label
										htmlFor="remember"
										className="cursor-pointer text-[13px] font-normal leading-[16px] text-muted-foreground"
									>
										保持登录
									</Label>
								</div>

								<Button
									type="submit"
									className="h-[40px] w-full rounded-[6px] text-[13px]"
									disabled={isSubmitting || isCheckingSession}
								>
									{isSubmitting ? (
										<LoaderCircle className="size-[16px] animate-spin" />
									) : (
										<LogIn className="size-[16px]" />
									)}
									{isSubmitting ? "正在登录" : "登录"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	);
}
