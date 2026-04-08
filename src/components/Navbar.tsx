"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MuiButton from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface NavbarProps {
  variant?: "user" | "admin";
}

const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C8 2 5 5 5 9c0 2.5 1.2 5.5 2.5 8.5C8.5 20.5 9.5 22 12 22s3.5-1.5 4.5-4.5C17.8 14.5 19 11.5 19 9c0-4-3-7-7-7z"
      fill="white"
      opacity="0.9"
    />
  </svg>
);

export default function Navbar({ variant = "user" }: NavbarProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/login");
  };

  const user = session?.user;
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "?";
  const userName = user?.name ?? "User";
  const userEmail = user?.email ?? "";
  const userRole = user?.role ?? "user";
  const homeRoute = "/";

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "white",
          borderBottom: "1px solid #e2e8f0",
          color: "inherit",
          zIndex: 50,
        }}
      >
        <Toolbar
          sx={{
            maxWidth: "80rem",
            width: "100%",
            mx: "auto",
            px: { xs: 2, sm: 3, lg: 4 },
            minHeight: "64px !important",
          }}
        >
          {/* Logo */}
          <Link
            href={homeRoute}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: "#2563eb",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LogoIcon />
            </div>
            <span
              style={{ color: "#1e293b", fontSize: "1.1rem", fontWeight: 600 }}
            >
              Dentist<span style={{ color: "#2563eb" }}>Booking</span>
            </span>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {variant === "user" && (
              <>
                <MuiButton
                  startIcon={<LayoutDashboard size={16} />}
                  onClick={() => router.push("/dashboard")}
                  color="inherit"
                  sx={{
                    color: "#475569",
                    "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" },
                    borderRadius: 2,
                    px: 1.5,
                  }}
                >
                  Dashboard
                </MuiButton>
                {userRole === "user" && (
                  <MuiButton
                    startIcon={<Calendar size={16} />}
                    onClick={() => router.push("/my-booking")}
                    color="inherit"
                    sx={{
                      color: "#475569",
                      "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" },
                      borderRadius: 2,
                      px: 1.5,
                    }}
                  >
                    My Booking
                  </MuiButton>
                )}
                {userRole === "admin" && (
                  <MuiButton
                    startIcon={<LayoutDashboard size={16} />}
                    onClick={() => router.push("/admin")}
                    color="inherit"
                    sx={{
                      color: "#475569",
                      "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" },
                      borderRadius: 2,
                      px: 1.5,
                    }}
                  >
                    Admin
                  </MuiButton>
                )}
              </>
            )}
            {variant === "admin" && (
              <Chip
                icon={<Shield size={13} />}
                label="Admin Panel"
                size="small"
                sx={{
                  bgcolor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontWeight: 600,
                }}
              />
            )}

            {userEmail != "" && (
              <>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ mx: 1, my: 1.5 }}
                />

                {/* Avatar + Name */}
                <div className="flex items-center gap-2">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "#dbeafe",
                      color: "#2563eb",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {userInitial}
                  </Avatar>
                  <span
                    className="text-sm text-slate-700 hidden lg:block"
                    style={{ fontWeight: 500 }}
                  >
                    {userName}
                  </span>
                </div>

                <MuiButton
                  startIcon={<LogOut size={15} />}
                  onClick={handleLogout}
                  color="inherit"
                  sx={{
                    color: "#94a3b8",
                    "&:hover": { color: "#dc2626", bgcolor: "#fff1f2" },
                    borderRadius: 2,
                    px: 1.5,
                    ml: 0.5,
                  }}
                >
                  Logout
                </MuiButton>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <IconButton
            className="md:hidden"
            onClick={() => setDrawerOpen(true)}
            sx={{ color: "#64748b", display: { md: "none" } }}
          >
            <Menu size={22} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260 } }}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#dbeafe",
                color: "#2563eb",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {userInitial}
            </Avatar>
            <div>
              <div
                className="text-sm text-slate-800"
                style={{ fontWeight: 600 }}
              >
                {userName}
              </div>
              <div className="text-xs text-slate-400">{userEmail}</div>
            </div>
          </div>
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(false)}
            sx={{ color: "#94a3b8" }}
          >
            <X size={18} />
          </IconButton>
        </div>

        <List sx={{ px: 1, pt: 1 }}>
          {variant === "user" && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push("/dashboard");
                    setDrawerOpen(false);
                  }}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LayoutDashboard size={18} color="#64748b" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dashboard"
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      color: "#374151",
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push("/my-booking");
                    setDrawerOpen(false);
                  }}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Calendar size={18} color="#64748b" />
                  </ListItemIcon>
                  <ListItemText
                    primary="My Booking"
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      color: "#374151",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </>
          )}
          {variant === "admin" && (
            <ListItem disablePadding>
              <ListItemButton
                sx={{ borderRadius: 2, mb: 0.5 }}
                onClick={() => {
                  router.push("/dashboard");
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Shield size={18} color="#2563eb" />
                </ListItemIcon>
                <ListItemText
                  primary="Admin Panel"
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    color: "#1d4ed8",
                    fontWeight: 600,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>

        <Divider sx={{ mx: 2 }} />

        <List sx={{ px: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                mt: 0.5,
                "&:hover": { bgcolor: "#fff1f2" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogOut size={18} color="#f87171" />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  color: "#ef4444",
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
