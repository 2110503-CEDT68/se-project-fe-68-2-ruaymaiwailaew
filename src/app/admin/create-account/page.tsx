"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TextField from "@mui/material/TextField";
import MuiButton from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Loader2,
  Shield,
  User,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

type Role = "user" | "admin" | "dentist";

const strengthMeta = [
  { label: "", color: "error" as const, value: 0 },
  { label: "Weak", color: "error" as const, value: 33 },
  { label: "Good", color: "warning" as const, value: 66 },
  { label: "Strong", color: "success" as const, value: 100 },
];

const roleMeta: Record<Role, { label: string; icon: React.ReactNode }> = {
  user: { label: "User", icon: <User size={16} /> },
  admin: { label: "Admin", icon: <Shield size={16} /> },
  dentist: { label: "Dentist", icon: <Stethoscope size={16} /> },
};

export default function AdminCreateAccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/login");
    }
  }, [session, status, router]);

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

  const handleRoleCheck = (role: Role) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !telephone || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!selectedRole) {
      toast.error("Please select a role");
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

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/admin-create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          telephone,
          email,
          password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Create account failed");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Create account failed. Please try again.");
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/img/homepage_bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative">
          <Link href="/admin" className="flex items-center gap-2">
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
            Create New Account
          </h2>
          <p className="text-blue-200 leading-relaxed">
            Admin can register user, dentist, or admin accounts from one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "User", desc: "General booking account" },
              { label: "Dentist", desc: "Manage appointments" },
              { label: "Admin", desc: "System management" },
              { label: "Secure", desc: "Role-based access" },
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

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-10">
        <div className="max-w-sm w-full mx-auto">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Admin
          </button>

          <div className="mb-8">
            <h1
              className="text-slate-900 mb-2"
              style={{ fontSize: "1.75rem", fontWeight: 700 }}
            >
              Create account
            </h1>
            <p className="text-slate-500 text-sm">
              Fill in details and check one role for this new account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="0xx-xxx-xxxx"
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

            <div className="pt-1 border-t border-slate-100">
              <p
                className="text-xs text-slate-400 mb-3 mt-3"
                style={{ fontWeight: 500 }}
              >
                SELECT ROLE (CHECK ONE)
              </p>
              <FormGroup>
                {(Object.keys(roleMeta) as Role[]).map((role) => (
                  <FormControlLabel
                    key={role}
                    control={
                      <Checkbox
                        checked={selectedRole === role}
                        onChange={() => handleRoleCheck(role)}
                      />
                    }
                    label={
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        {roleMeta[role].icon}
                        {roleMeta[role].label}
                      </span>
                    }
                  />
                ))}
              </FormGroup>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <p
                className="text-xs text-slate-400 mb-4 mt-3"
                style={{ fontWeight: 500 }}
              >
                PASSWORD
              </p>
              <div className="space-y-5">
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
                      <span className="text-xs text-slate-400">{strengthLabel}</span>
                    </div>
                  )}
                </div>

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
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
        </div>
      </div>
    </div>
  );
}
