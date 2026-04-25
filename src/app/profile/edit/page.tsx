"use client";

import { useState, useEffect } from "react";
import { useAuthUser, useUpdateProfile } from "@/lib/useAuth";
import { User, Phone, CheckCircle, Stethoscope, Clock, AlertCircle, Loader2, Eye, EyeOff, Lock } from "lucide-react";

// ── types ──────────────────────────────────────────────
interface Dentist {
  _id: string;
  name: string;
  yearsOfExperience: number;
  areaOfExpertise: string;
}

// ── helpers ────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const DENTISTS_URL = `${BASE_URL}/dentists`;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data: T = text ? JSON.parse(text) : ({} as T);
  if (!res.ok) {
    const message = (data as any)?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function getDentistById(token: string, id: string): Promise<Dentist | null> {
  const res = await fetch(`${DENTISTS_URL}/${id}`, { headers: authHeaders(token) });
  console.log("📡 [getDentistById] status:", res.status, res.statusText);
  const data = await handleResponse<any>(res);
  console.log("📦 [getDentistById] raw:", JSON.stringify(data, null, 2));
  const d = data?.data ?? data;
  return {
    _id: String(d._id ?? d.id ?? ""),
    name: d.name ?? "",
    yearsOfExperience: d.yearsOfExperience ?? 0,
    areaOfExpertise: d.areaOfExpertise ?? "",
  };
}

async function updateDentist(
  token: string,
  id: string,
  payload: { yearsOfExperience: number; areaOfExpertise: string }
): Promise<void> {
  const res = await fetch(`${DENTISTS_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  console.log("📡 [updateDentist] status:", res.status, res.statusText);
  await handleResponse(res);
  console.log("✅ [updateDentist] success");
}

// ── sub-components ─────────────────────────────────────
function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </div>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  maxLength,
  min,
  max,
  accent = "blue",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  accent?: "blue" | "green";
}) {
  const focusColor =
    accent === "green"
      ? "focus:ring-green-500 focus:border-green-500"
      : "focus:ring-blue-500 focus:border-blue-500";

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      min={min}
      max={max}
      className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none transition
        ring-0 focus:ring-2 focus:ring-offset-0 ${focusColor}
        disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
        placeholder:text-slate-300`}
    />
  );
}

// ── main component ─────────────────────────────────────
export default function EditProfilePage() {
  const { user, accessToken } = useAuthUser();
  const { updateProfile, isLoading, error } = useUpdateProfile();

  const isDentist = (user as any)?.role === "dentist";
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "?";

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");

  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [areaOfExpertise, setAreaOfExpertise] = useState("");
  const [dentistLoading, setDentistLoading] = useState(false);
  const [dentistError, setDentistError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setTelephone((user as any).telephone ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!isDentist || !accessToken || !(user as any)?._id) return;
    setDentistLoading(true);
    getDentistById(accessToken, (user as any)._id)
      .then((d) => {
        setDentist(d);
        setYearsOfExperience(String(d?.yearsOfExperience ?? ""));
        setAreaOfExpertise(d?.areaOfExpertise ?? "");
      })
      .catch((e) => setDentistError(e.message))
      .finally(() => setDentistLoading(false));
  }, [isDentist, accessToken, (user as any)?._id]);

  const hasUserChanges =
    name !== (user?.name ?? "") || telephone !== ((user as any)?.telephone ?? "");

  const hasDentistChanges =
    isDentist &&
    (yearsOfExperience !== String(dentist?.yearsOfExperience ?? "") ||
      areaOfExpertise !== (dentist?.areaOfExpertise ?? ""));

  const hasChanges = (hasUserChanges || hasDentistChanges) && password.length > 0;

  const handleSave = async () => {
    setSuccess(false);
    setDentistError(null);
    const result = await updateProfile({ name, telephone, password });
    if (!result.success) return;
    if (isDentist && hasDentistChanges && accessToken && (user as any)?._id) {
      try {
        await updateDentist(accessToken, (user as any)._id, {
          yearsOfExperience: Number(yearsOfExperience),
          areaOfExpertise,
        });
      } catch (e: any) {
        setDentistError(e.message);
        return;
      }
    }
    setSuccess(true);
  };

  const handleReset = () => {
    setName(user?.name ?? "");
    setTelephone((user as any)?.telephone ?? "");
    setYearsOfExperience(String(dentist?.yearsOfExperience ?? ""));
    setAreaOfExpertise(dentist?.areaOfExpertise ?? "");
    setPassword("");
    setSuccess(false);
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-slate-800">Edit Profile</h1>
        <p className="text-xs text-slate-400 mt-0.5">Update your name and contact information</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {userInitial}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user?.name ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email ?? ""}</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <p className="font-semibold text-slate-700 text-sm">Personal Information</p>
          <p className="text-xs text-slate-400 mt-0.5">Only name and telephone can be changed</p>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Name */}
          <div>
            <FieldLabel icon={<User size={13} />} label="Full Name" />
            <InputField
              value={name}
              onChange={(v) => { setName(v); setSuccess(false); }}
              placeholder="Enter your full name"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Telephone */}
          <div>
            <FieldLabel icon={<Phone size={13} />} label="Telephone" />
            <InputField
              value={telephone}
              onChange={(v) => { setTelephone(v); setSuccess(false); }}
              placeholder="e.g. 0812345678"
              maxLength={10}
            />
          </div>

          <hr className="border-slate-100" />

          {/* Email read-only */}
          <div className="opacity-50">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Email (cannot be changed)</p>
            <InputField value={user?.email ?? ""} disabled />
          </div>

          <hr className="border-slate-100" />

          {/* Password confirm */}
          <div>
            <FieldLabel icon={<Lock size={13} />} label="Current Password (required to save)" />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setSuccess(false); }}
                placeholder="Enter your password to confirm changes"
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 outline-none transition
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dentist Information */}
      {isDentist && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-slate-200">
            <p className="font-semibold text-slate-700 text-sm">Dentist Information</p>
            <p className="text-xs text-slate-400 mt-0.5">Professional details visible to patients</p>
          </div>

          {dentistLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-green-500" />
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {/* Years of Experience */}
              <div>
                <FieldLabel icon={<Clock size={13} />} label="Years of Experience" />
                <InputField
                  type="number"
                  value={yearsOfExperience}
                  onChange={(v) => { setYearsOfExperience(v); setSuccess(false); }}
                  placeholder="e.g. 5"
                  min={0}
                  max={60}
                  accent="green"
                />
              </div>

              <hr className="border-slate-100" />

              {/* Area of Expertise */}
              <div>
                <FieldLabel icon={<Stethoscope size={13} />} label="Area of Expertise" />
                <InputField
                  value={areaOfExpertise}
                  onChange={(v) => { setAreaOfExpertise(v); setSuccess(false); }}
                  placeholder="e.g. Orthodontics"
                  accent="green"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {(error || dentistError) && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error ?? dentistError}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>Profile updated successfully</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-4 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-lg
            hover:border-slate-400 hover:text-slate-700 transition
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || dentistLoading || !hasChanges}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 transition flex items-center gap-2
            disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading || dentistLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}