"use client";

import { useState, useEffect } from "react";
import { useAuthUser,useUpdateProfile } from "@/lib/useAuth";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { User, Phone, CheckCircle } from "lucide-react";

export default function EditProfilePage() {
  const { user } = useAuthUser();
  const { updateProfile, isLoading, error } = useUpdateProfile();

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [success, setSuccess] = useState(false);

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "?";

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setTelephone((user as any).telephone ?? "");
    }
  }, [user]);

  const hasChanges =
    name !== (user?.name ?? "") ||
    telephone !== ((user as any)?.telephone ?? "");

  const handleSave = async () => {
    setSuccess(false);
    const result = await updateProfile({ name, telephone });
    if (result.success) setSuccess(true);
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1.25rem" }}>
          Edit Profile
        </Typography>
        <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", mt: 0.3 }}>
          Update your name and contact information
        </Typography>
      </Box>

      {/* Avatar card */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          p: 3,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 3,
          bgcolor: "white",
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
          }}
        >
          {userInitial}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "1rem" }}>
            {user?.name ?? "—"}
          </Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem", mt: 0.3 }}>
            {user?.email ?? ""}
          </Typography>
        </Box>
      </Paper>

      {/* Form card */}
      <Paper
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden", bgcolor: "white" }}
      >
        <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <Typography sx={{ fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>
            Personal Information
          </Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem", mt: 0.3 }}>
            Only name and telephone can be changed
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Name */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <User size={14} color="#64748b" />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>
                Full Name
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={name}
              onChange={(e) => { setName(e.target.value); setSuccess(false); }}
              placeholder="Enter your full name"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: "0.9rem",
                  "&:hover fieldset": { borderColor: "#2563eb" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 1.5 },
                },
              }}
            />
          </Box>

          <Divider />

          {/* Telephone */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Phone size={14} color="#64748b" />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>
                Telephone
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={telephone}
              onChange={(e) => { setTelephone(e.target.value); setSuccess(false); }}
              placeholder="e.g. 0812345678"
              size="small"
              inputProps={{ maxLength: 10 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: "0.9rem",
                  "&:hover fieldset": { borderColor: "#2563eb" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 1.5 },
                },
              }}
            />
          </Box>

          <Divider />

          {/* Email — read only */}
          <Box sx={{ opacity: 0.55 }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", mb: 1 }}>
              Email (cannot be changed)
            </Typography>
            <TextField
              fullWidth
              value={user?.email ?? ""}
              disabled
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.9rem", bgcolor: "#f1f5f9" },
              }}
            />
          </Box>
        </Box>

        {/* Alerts + actions */}
        <Box sx={{ px: 3, pb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, fontSize: "0.82rem" }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" icon={<CheckCircle size={16} />} sx={{ borderRadius: 2, fontSize: "0.82rem" }}>
              Profile updated successfully
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setName(user?.name ?? "");
                setTelephone((user as any)?.telephone ?? "");
                setSuccess(false);
              }}
              disabled={!hasChanges}
              sx={{
                borderRadius: 2,
                borderColor: "#e2e8f0",
                color: "#475569",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.85rem",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              sx={{
                borderRadius: 2,
                bgcolor: "#2563eb",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                px: 3,
                boxShadow: "none",
                "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
                "&:disabled": { bgcolor: "#e2e8f0", color: "#94a3b8" },
              }}
            >
              {isLoading ? <CircularProgress size={16} sx={{ color: "white" }} /> : "Save Changes"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}