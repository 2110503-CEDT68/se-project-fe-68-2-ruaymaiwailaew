"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { Pencil } from "lucide-react";

interface ProfileBox {
  userName: string;
  userEmail: string;
  userInitial: string;
}

export default function ProfileBox({
  userName,
  userEmail,
  userInitial,
}: ProfileBox) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
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
          {userInitial}
        </Avatar>
      </IconButton>

      <Popover
        id="profile-popover"
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
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
              minWidth: 240,
            },
          },
        }}
      >
        {/* Profile info */}
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
            {userInitial}
          </Avatar>
          <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
            {userName}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
            {userEmail}
          </Typography>
        </Box>

        <Divider />

        {/* Edit button */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Pencil size={14} />}
            onClick={() => {
              setAnchor(null);
              router.push("/profile/edit");
            }}
            sx={{
              borderRadius: 2,
              borderColor: "#e2e8f0",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                borderColor: "#2563eb",
                color: "#2563eb",
                bgcolor: "#eff6ff",
              },
            }}
          >
            Edit Profile
          </Button>
        </Box>
      </Popover>
    </>
  );
}