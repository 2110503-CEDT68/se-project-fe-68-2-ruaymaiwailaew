"use client";

import { useState } from "react";
import { useAuthUser, useDeleteAccount } from "@/lib/useAuth";
import { AlertTriangle, Trash2, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

// ── component ──────────────────────────────────────────
export default function DeleteAccountPage() {
  const { user } = useAuthUser();
  const { deleteAccount, isLoading, error } = useDeleteAccount();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const success = await deleteAccount(password);
    if(success) router.push('/login');
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-slate-800">Delete Account</h1>
        <p className="text-xs text-slate-400 mt-3">
          Permanently remove your account and all associated data
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
        <ShieldAlert size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-700">This action is irreversible</p>
          <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
            <li>Your account will be permanently deleted</li>
            <li>All your booking history will be removed</li>
            <li>You will be immediately signed out</li>
            <li>This cannot be undone</li>
          </ul>
        </div>
      </div>

      {/* Account preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{user?.name ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email ?? ""}</p>
        </div>
      </div>

      {/* Confirm card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <p className="font-semibold text-slate-700 text-sm">Confirm Deletion</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your password to confirm you want to delete this account
          </p>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Checkbox confirm */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-500 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition">
              I understand that deleting my account is permanent and cannot be recovered
            </span>
          </label>

          <hr className="border-slate-100" />

          {/* Password input */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Your Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value);}}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 outline-none transition
                  focus:ring-2 focus:ring-red-400 focus:border-red-400
                  placeholder:text-slate-300"
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleDelete}
          disabled={isLoading || !confirmed || !password}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg
            hover:bg-red-700 transition
            disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          {isLoading ? "Deleting..." : "Delete My Account"}
        </button>
       
      </div>
    </div>
  );
}