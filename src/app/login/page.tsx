"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuthUser } from "@/lib/useAuth";
import TextField from "@mui/material/TextField";
import MuiButton from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { Eye, EyeOff, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, status } = useAuthUser();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Call backend login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Sign in with NextAuth using the token
      const result = await signIn("credentials", {
        email,
        password,
        accessToken: data.token,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication failed");
      } else if (result?.ok) {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex ">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('/img/homepage_bg.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Logo */}
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 2 5 5 5 9c0 2.5 1.2 5.5 2.5 8.5C8.5 20.5 9.5 22 12 22s3.5-1.5 4.5-4.5C17.8 14.5 19 11.5 19 9c0-4-3-7-7-7z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
            </div>
            <span
              className="text-white"
              style={{ fontSize: "1.2rem", fontWeight: 700 }}
            >
              DentistBooking
            </span>
          </Link>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <h2
              className="text-white mb-3"
              style={{ fontSize: "2.1rem", fontWeight: 700, lineHeight: 1.25 }}
            >
              Your Journey to a<br />
              Healthier Smile
            </h2>
            <p className="text-blue-200 leading-relaxed text-sm">
              Access your account to manage appointments and connect with
              Thailand's top dental professionals.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Instant appointment booking",
              "Edit or cancel anytime",
              "Expert dental professionals",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-blue-300/70 text-xs">
          © 2026 DentistBooking. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Back link
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-10 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link> */}

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-slate-900 mb-1.5"
              style={{ fontSize: "1.875rem", fontWeight: 700 }}
            >
              Welcome back
            </h1>
            <p className="text-slate-400 text-sm">
              Sign in to manage your dental appointments
            </p>
          </div>

          {/* Form card */}
          <div className="bg-slate-50 rounded-2xl p-8 mb-6 border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm text-slate-600"
                  style={{ fontWeight: 500 }}
                >
                  Email address
                </label>
                <TextField
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  fullWidth
                  autoComplete="email"
                  sx={{
                    bgcolor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                    "& .MuiInputLabel-root": { display: "none" },
                    "& legend": { display: "none" },
                    "& fieldset": { top: 0 },
                  }}
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm text-slate-600"
                  style={{ fontWeight: 500 }}
                >
                  Password
                </label>
                <TextField
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  fullWidth
                  autoComplete="current-password"
                  sx={{
                    bgcolor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                    "& .MuiInputLabel-root": { display: "none" },
                    "& legend": { display: "none" },
                    "& fieldset": { top: 0 },
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: "#94a3b8" }}
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>

              <MuiButton
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                sx={{
                  height: 48,
                  borderRadius: "10px",
                  mt: 2,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </MuiButton>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mb-6">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700"
              style={{ fontWeight: 600 }}
            >
              Create one free
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span
                className="text-slate-400 text-xs"
                style={{ fontWeight: 600, letterSpacing: "0.05em" }}
              >
                DEMO CREDENTIALS
              </span>
            </div>
            <Divider sx={{ mb: 2.5 }} />
            <MuiButton
              variant="outlined"
              fullWidth
              onClick={() => {
                setEmail("admin@dentist.com");
                setPassword("admin123");
              }}
              sx={{
                justifyContent: "flex-start",
                px: 2,
                py: 1.25,
                borderRadius: "10px",
                borderColor: "#e2e8f0",
                bgcolor: "#f8fafc",
                color: "#374151",
                textAlign: "left",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#93c5fd",
                  bgcolor: "#eff6ff",
                  color: "#1d4ed8",
                },
              }}
            >
              <div>
                <div className="text-xs text-slate-400 mb-0.5">
                  Admin Account
                </div>
                <div className="text-sm" style={{ fontWeight: 600 }}>
                  admin@dentist.com / admin123
                </div>
              </div>
            </MuiButton>
          </div>
        </div>
      </div>
    </div>
  );
}
