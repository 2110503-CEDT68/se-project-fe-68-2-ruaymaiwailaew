"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Pencil, Trash2, ArrowLeft, Check } from "lucide-react";

interface ProfileDropdownProps {
  userName: string;
  userEmail: string;
  userInitial: string;
  onProfileUpdated?: (updated: { name: string; email: string }) => void;
}

type Mode = "view" | "edit";

export default function ProfileDropdown({
  userName,
  userEmail,
  onProfileUpdated,
}: ProfileDropdownProps) {
  const router = useRouter();

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const [mode, setMode] = useState<Mode>("view");

  // ── Internal display state ──────────────────────────────────────────────────
  // Stores the latest saved values so the profile box re-renders immediately
  // after Save — no need to wait for the parent to update props.
  const [currentName, setCurrentName] = useState(userName);
  const [currentEmail, setCurrentEmail] = useState(userEmail);
  const initial = currentName.charAt(0).toUpperCase();

  // ── Edit form state ─────────────────────────────────────────────────────────
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setAnchor(e.currentTarget);
    setMode("view");
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    setAnchor(null);
  }

  function handleStartEdit() {
    setEditName(currentName);
    setEditEmail(currentEmail);
    setError(null);
    setSuccess(false);
    setMode("edit");
  }

  async function handleSave() {
    if (!editName.trim() || !editEmail.trim()) {
      setError("Name and email are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ─── Replace with your real API call ────────────────────────────────────
      // const res = await fetch("/api/profile", {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      // });
      // if (!res.ok) throw new Error(await res.text());
      // ────────────────────────────────────────────────────────────────────────

      // Simulate network delay (remove when using real API)
      await new Promise((r) => setTimeout(r, 900));

      const saved = { name: editName.trim(), email: editEmail.trim() };

      // ① Update internal state → profile box changes immediately
      setCurrentName(saved.name);
      setCurrentEmail(saved.email);

      // ② Notify parent to sync if needed
      onProfileUpdated?.(saved);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMode("view");
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        sx={{ p: 0.5 }}
        aria-describedby="profile-popover"
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#dbeafe",
            color: "#2563eb",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: "0 0 0 3px #bfdbfe" },
          }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Popover
        id="profile-popover"
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              minWidth: 280,
            },
          },
        }}
      >
        {/* ── VIEW MODE ─────────────────────────────────────────────────────── */}
        {mode === "view" && (
          <>
            <Box
              sx={{
                bgcolor: "#f8fafc",
                px: 3,
                py: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "#dbeafe",
                  color: "#2563eb",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {initial}
              </Avatar>
              {/* currentName / currentEmail อัปเดตทันทีหลัง Save */}
              <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
                {currentName}
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
                {currentEmail}
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Pencil size={14} />}
                onClick={handleStartEdit}
                sx={{
                  borderRadius: 2,
                  borderColor: "#e2e8f0",
                  color: "#475569",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  textTransform: "none",
                  justifyContent: "flex-start",
                  "&:hover": { borderColor: "#2563eb", color: "#2563eb", bgcolor: "#eff6ff" },
                }}
              >
                Edit Profile
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Trash2 size={14} />}
                onClick={() => {
                  handleClose();
                  router.push("/profile/delete");
                }}
                sx={{
                  borderRadius: 2,
                  borderColor: "#fee2e2",
                  color: "#ef4444",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  textTransform: "none",
                  justifyContent: "flex-start",
                  "&:hover": { borderColor: "#ef4444", color: "#dc2626", bgcolor: "#fff1f2" },
                }}
              >
                Delete Account
              </Button>
            </Box>
          </>
        )}

        {/* ── EDIT MODE ─────────────────────────────────────────────────────── */}
        {mode === "edit" && (
          <>
            <Box
              sx={{
                bgcolor: "#f8fafc",
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setMode("view")}
                sx={{ color: "#64748b", "&:hover": { color: "#2563eb" } }}
              >
                <ArrowLeft size={16} />
              </IconButton>
              <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>
                Edit Profile
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                size="small"
                fullWidth
                disabled={loading}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                label="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                size="small"
                fullWidth
                disabled={loading}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              {error && (
                <Typography sx={{ color: "#ef4444", fontSize: "0.78rem" }}>
                  {error}
                </Typography>
              )}

              {success && (
                <Typography
                  sx={{
                    color: "#16a34a",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Check size={13} /> Saved successfully
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setMode("view")}
                  disabled={loading}
                  size="small"
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    color: "#64748b",
                    textTransform: "none",
                    fontSize: "0.82rem",
                    "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  size="small"
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    bgcolor: "#2563eb",
                    textTransform: "none",
                    fontSize: "0.82rem",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
                  }}
                  startIcon={
                    loading ? <CircularProgress size={12} sx={{ color: "white" }} /> : null
                  }
                >
                  {loading ? "Saving…" : "Save"}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}