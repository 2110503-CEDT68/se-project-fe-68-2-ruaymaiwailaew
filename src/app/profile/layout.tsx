"use client";

import { useAuthUser } from "@/lib/useAuth";
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Trash2, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  danger?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Edit Profile",
    href: "/profile/edit",
    icon: <User size={18} />,
  },
  {
    label: "Delete Account",
    href: "/profile/delete",
    icon: <Trash2 size={18} />,
    danger: true,
  },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthUser();

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* ── Sidebar ── */}
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 260 },
          flexShrink: 0,
          bgcolor: "white",
          borderRight: { md: "1px solid #e2e8f0" },
          borderBottom: { xs: "1px solid #e2e8f0", md: "none" },
          display: "flex",
          flexDirection: "column",
          position: { md: "sticky" },
          top: { md: 64 }, // height of your Navbar
          height: { md: "calc(100vh - 64px)" },
        }}
      >
        {/* User summary */}
        <Box
          sx={{
            px: 3,
            py: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: "#dbeafe",
              color: "#2563eb",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {userInitial}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: "#1e293b",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name ?? "User"}
            </Typography>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email ?? ""}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Section label */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Account Settings
          </Typography>
        </Box>

        {/* Nav items */}
        <List sx={{ px: 1.5, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => router.push(item.href)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    bgcolor: active
                      ? item.danger
                        ? "#fff1f2"
                        : "#eff6ff"
                      : "transparent",
                    color: active
                      ? item.danger
                        ? "#dc2626"
                        : "#2563eb"
                      : item.danger
                      ? "#ef4444"
                      : "#475569",
                    "&:hover": {
                      bgcolor: item.danger ? "#fff1f2" : active ? "#eff6ff" : "#f8fafc",
                      color: item.danger ? "#dc2626" : active ? "#2563eb" : "#1e293b",
                    },
                    transition: "all 0.15s",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color: active
                        ? item.danger ? "#dc2626" : "#2563eb"
                        : item.danger ? "#f87171" : "#94a3b8",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "0.875rem",
                          fontWeight: active ? 600 : 500,
                          color: "inherit",
                        },
                      },
                    }}
                  />
                  {active && (
                    <Box
                      sx={{
                        width: 3,
                        height: 20,
                        bgcolor: item.danger ? "#dc2626" : "#2563eb",
                        borderRadius: 4,
                        ml: 1,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 2, md: 4 },
          maxWidth: { md: 720 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}