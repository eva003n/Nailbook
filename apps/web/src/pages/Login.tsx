/**
 * §6.1 Login Page

 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/layout/Logo";
import {z} from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const loginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72)
  /* .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {message: "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character."}) */
})

type LoginData = z.infer<typeof loginFormSchema>

export default function Login() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
  });
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginData) => {
    // e.preventDefault();

    try {
      await login(data.email, data.password);
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message ?? "Couldn't sign in. Check your email and password.");
    }
  };

  return (
    <div className="flex min-h-dvh bg-paper text-ink">
      <main className="flex flex-1 flex-col px-6 pt-[calc(env(safe-area-inset-top)+40px)] pb-[calc(env(safe-area-inset-bottom)+32px)] md:items-center md:justify-center md:py-16">
        <div className="flex w-full max-w-100 flex-1 flex-col md:flex-none">
          <Logo size={28} />

          <h1 className="mt-14 font-display text-[2.125rem] leading-9.5 font-bold tracking-[-0.02em] md:mt-12">Sign in to your salon</h1>
          <p className="mt-2.5 text-base leading-6 text-ink-2">Approve bookings and track M-Pesa payments from one place.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-9 flex flex-1 flex-col gap-4.5" noValidate>
            {error && (
              <div role="alert" className="rounded-(--radius-md) bg-error-bg px-4 py-3 text-sm leading-5 font-medium text-error">
                {error}
              </div>
            )}

            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} required autoComplete="email" inputMode="email" />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                error={errors.password?.message}
                required
                autoComplete="current-password"
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-7 right-1 flex h-11 w-11 items-center justify-center rounded-(--radius-md) text-ink-2 hover:text-plum-deep"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>

            <div className="mt-auto pt-6 md:mt-4 md:pt-0">
              <Button type="submit" size="lg" loading={isLoading}>
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
