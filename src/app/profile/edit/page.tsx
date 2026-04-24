"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/useAuth";
import { useUpdateProfile } from "@/lib/useAuth";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ArrowLeft, User, Phone, CheckCircle } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const { updateProfile, isLoading, error } = useUpdateProfile();

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [success, setSuccess] = useState(false);

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "?";

  // Pre-fill from session
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setTelephone((user as any).telephone ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    setSuccess(false);
    const result = await updateProfile({ name, telephone });
    if (result.success) setSuccess(true);
  };

  const hasChanges =
    name !== (user?.name ?? "") ||
    telephone !== ((user as any)?.telephone ?? "");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e2e8f0",
          px: { xs: 2, md: 4 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          size="small"
          sx={{
            border: "1.5px solid #e2e8f0",
            borderRadius: "50%",
            color: "#475569",
            "&:hover": { borderColor: "#2563eb", color: "#2563eb", bgcolor: "#eff6ff" },
          }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "1rem" }}>
          Edit Profile
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Avatar section */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            p: 4,
            mb: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            bgcolor: "white",
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "#dbeafe",
              color: "#2563eb",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {userInitial}
          </Avatar>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "1.1rem" }}>
              {user?.name ?? "—"}
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", mt: 0.3 }}>
              {user?.email ?? ""}
            </Typography>
          </Box>
        </Paper>

        {/* Form section */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "white",
          }}
        >
          {/* Section header */}
          <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Typography sx={{ fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>
              Personal Information
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem", mt: 0.3 }}>
              Only name and telephone can be changed
            </Typography>
          </Box>

          <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Name field */}
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

            {/* Telephone field */}
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

            {/* Email — read only */}
            <Divider />
            <Box sx={{ opacity: 0.6 }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", mb: 1 }}>
                Email (cannot be changed)
              </Typography>
              <TextField
                fullWidth
                value={user?.email ?? ""}
                disabled
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: "0.9rem",
                    bgcolor: "#f1f5f9",
                  },
                }}
              />
            </Box>
          </Box>

          {/* Alerts + Save button */}
          <Box sx={{ px: 3, pb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, fontSize: "0.82rem" }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                icon={<CheckCircle size={16} />}
                sx={{ borderRadius: 2, fontSize: "0.82rem" }}
              >
                Profile updated successfully
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
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
                Cancel
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
                {isLoading ? (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}