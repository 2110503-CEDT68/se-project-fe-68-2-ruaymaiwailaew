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
import LinearProgress from "@mui/material/LinearProgress";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Eye, EyeOff, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const strengthMeta = [
  { label: "", color: "error" as const, value: 0 },
  { label: "Weak", color: "error" as const, value: 33 },
  { label: "Good", color: "warning" as const, value: 66 },
  { label: "Strong", color: "success" as const, value: 100 },
];

export default function RegisterPage() {
  const [openDoc, setOpenDoc] = useState<"terms" | "privacy" | null>(null);
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [showPrivacyError, setShowPrivacyError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, status } = useAuthUser();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, status, router]);

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const {
    label: strengthLabel,
    color: strengthColor,
    value: strengthValue,
  } = strengthMeta[passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !telephone || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!privacyPolicyAccepted) {
      setShowPrivacyError(true);
      return;
    }

    setShowPrivacyError(false);

    setIsLoading(true);
    try {
      // Call backend register API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          telephone,
          privacyPolicyAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        accessToken: data.token,
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Account created! Welcome!");
        router.push("/dashboard");
      } else {
        toast.error("Account created but sign in failed. Please try again.");
        router.push("/login");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password;
  const passwordsMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('/img/homepage_bg.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 2 5 5 5 9c0 2.5 1.2 5.5 2.5 8.5C8.5 20.5 9.5 22 12 22s3.5-1.5 4.5-4.5C17.8 14.5 19 11.5 19 9c0-4-3-7-7-7z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
            </div>
            <span className="text-white text-xl" style={{ fontWeight: 600 }}>
              DentistBooking
            </span>
          </Link>
        </div>
        <div className="relative">
          <h2
            className="text-white mb-4"
            style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.3 }}
          >
            Start Your Dental Care Journey Today
          </h2>
          <p className="text-blue-200 leading-relaxed">
            Create a free account and book your first dental appointment in
            minutes.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "Free to join", desc: "No hidden fees" },
              { label: "Easy booking", desc: "Book in minutes" },
              { label: "Top dentists", desc: "6+ specialists" },
              { label: "Flexible", desc: "Edit anytime" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="text-white text-sm" style={{ fontWeight: 600 }}>
                  {item.label}
                </div>
                <div className="text-blue-200 text-xs mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-blue-300 text-xs">
          © 2026 DentistBooking. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-10">
        <div className="max-w-sm w-full mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h1
              className="text-slate-900 mb-2"
              style={{ fontSize: "1.75rem", fontWeight: 700 }}
            >
              Create your account
            </h1>
            <p className="text-slate-500 text-sm">
              Join us and start booking dental appointments easily
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Telephone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="0xxxxxxxxx"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </div>

            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            {/* Password Section */}
            <div className="pt-1 border-t border-slate-100">
              <p
                className="text-xs text-slate-400 mb-4 mt-3"
                style={{ fontWeight: 500 }}
              >
                PASSWORD
              </p>
              <div className="space-y-5">
                {/* Password with strength meter */}
                <div>
                  <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
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
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <LinearProgress
                        variant="determinate"
                        value={strengthValue}
                        color={strengthColor}
                        sx={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          bgcolor: "#e2e8f0",
                        }}
                      />
                      <span className="text-xs text-slate-400">
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  fullWidth
                  error={passwordsMismatch}
                  helperText={passwordsMismatch ? "Passwords do not match" : ""}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {passwordsMatch ? (
                            <Check size={16} color="#16a34a" />
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                              sx={{ color: "#94a3b8" }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <div className="mt-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="privacy-policy-checkbox"
                      checked={privacyPolicyAccepted}
                      onChange={(e) => {
                        setPrivacyPolicyAccepted(e.target.checked);
                        if (e.target.checked) {
                          setShowPrivacyError(false);
                        }
                      }}
                      sx={{
                        p: "2px",
                        mt: 0,
                        "& .MuiSvgIcon-root": {
                          fontSize: 18,
                        },
                      }}
                    />
                    <label
                      htmlFor="privacy-policy-checkbox"
                      className="text-xs text-slate-600 leading-relaxed mt-0.5"
                    >
                      By creating an account, you agree to our{" "}
                      <button
                        type="button"
                        className="text-blue-600 underline underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDoc("terms");
                        }}
                      >
                        Terms
                      </button>{" "}
                      and have read and acknowledge the{" "}
                      <button
                        type="button"
                        className="text-blue-600 underline underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDoc("privacy");
                        }}
                      >
                        Global Privacy Statement
                      </button>
                      .
                    </label>
                  </div>
                  {showPrivacyError && (
                    <p className="text-red-600 text-xs mt-1">
                      You must agree to the privacy policy to continue
                    </p>
                  )}
                </div>
              </div>
            </div>

            <MuiButton
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{
                height: 46,
                borderRadius: "10px",
                mt: 1,
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </MuiButton>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700"
              style={{ fontWeight: 500 }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <Dialog
        open={openDoc === "terms"}
        onClose={() => setOpenDoc(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Terms</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-3 text-sm text-slate-700 leading-6">
            <p>
              By creating an account, you agree to use DentistBooking lawfully
              and provide accurate registration details.
            </p>
            <p>
              You are responsible for keeping your credentials secure and for
              activities under your account.
            </p>
            <p>
              We may update these terms over time. Continued use means you
              accept the latest version.
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpenDoc(null)}>Close</MuiButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDoc === "privacy"}
        onClose={() => setOpenDoc(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Global Privacy Statement</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-3 text-sm text-slate-700 leading-6">
            <p>
              We collect information such as name, email, and phone number to
              provide booking and account services.
            </p>
            <p>
              Your information is used for service delivery, security, and
              support. We do not use your personal data beyond legitimate
              service purposes.
            </p>
            <p>
              You may request updates or deletion of your personal information
              in line with applicable laws.
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpenDoc(null)}>Close</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
