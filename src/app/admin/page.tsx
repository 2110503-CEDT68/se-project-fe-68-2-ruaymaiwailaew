"use client";
import { fetchDentists, type Dentist } from "@/data/dentists";
import { banUser, getUsers, unbanUser, type UserPayload } from "@/lib/bookingApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteBooking, loadBookings, selectAllBookings } from "@/store/slices/bookingSlice";
import { deleteReview, loadReviews, selectAllReviews } from "@/store/slices/reviewSlice";
import Avatar from "@mui/material/Avatar";
import MuiButton from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  LayoutDashboard,
  MessageSquare,
  Search,
  Star,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SortKey = "userName" | "date" | "dentistName";
type SortDir = "asc" | "desc";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div
        className="text-white"
        style={{ fontSize: "1.75rem", fontWeight: 700 }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const allBookings = useAppSelector(selectAllBookings);
  const allReviews = useAppSelector(selectAllReviews);

  const [activeTab, setActiveTab] = useState(0);
  const [bookingSearch, setBookingSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Confirm dialogs
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(
    null,
  );
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);

  // Users tab state
  const [usersList, setUsersList] = useState<UserPayload[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [banningUser, setBanningUser] = useState<UserPayload | null>(null);
  const [banReason, setBanReason] = useState("");
  const [unbanningUserId, setUnbanningUserId] = useState<string | null>(null);
  const [banActionLoading, setBanActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) router.push("/login");
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadDentists = async () => {
      try {
        const data = await fetchDentists();
        setDentistsList(data);

        if (session?.accessToken) {
          await Promise.all(
            data.map((d) =>
              dispatch(loadReviews({ dentistId: d._id, token: session.accessToken! })),
            ),
          );
        }
      } catch (error) {
        console.error('Failed to load dentists:', error);
      }
    };
    loadDentists();
  }, [session?.accessToken, dispatch, isAdmin]);

  useEffect(() => {
    if (!session) return;
    if (!isAdmin) {
      router.push("/login");
      return;
    }
    dispatch(loadBookings(session.accessToken!));
  }, [session]);

  // Load users when Users tab is active
  useEffect(() => {
    if (activeTab !== 2 || !session?.accessToken) return;
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const data = await getUsers(session.accessToken!);
        setUsersList(data);
      } catch (err: any) {
        toast.error(err.message ?? "Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, [activeTab, session?.accessToken]);

  const safeDentists = Array.isArray(dentistsList) ? dentistsList : [];
  const getDentistName = (id: string) =>
    safeDentists.find((d) => d._id === id)?.name ?? "Unknown";
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
      )
    ) : (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1 opacity-20" />
    );

  const filteredBookings = allBookings
    .filter((b) => {
      const q = bookingSearch.toLowerCase();
      return (
        b.userName.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        getDentistName(b.dentistId).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let vA: string, vB: string;
      if (sortKey === "userName") {
        vA = a.userName;
        vB = b.userName;
      } else if (sortKey === "dentistName") {
        vA = getDentistName(a.dentistId);
        vB = getDentistName(b.dentistId);
      } else {
        vA = a.date;
        vB = b.date;
      }
      return sortDir === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });

  const filteredReviews = allReviews
    .filter((r) => {
      const q = reviewSearch.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        getDentistName(r.dentistId).toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const upcomingCount = allBookings.filter(
    (b) => new Date(b.date) >= new Date(),
  ).length;
  const uniquePatients = new Set(allBookings.map((b) => b.userId)).size;

  const handleDeleteBooking = async () => {
    if (!deletingBookingId) return;
    await dispatch(deleteBooking({ 
      bookingId: deletingBookingId, 
      token: session?.accessToken || "" 
    }));
    toast.success("Booking deleted");
    setDeletingBookingId(null);
  };

  const handleDeleteReview = async () => {
    if (!deletingReviewId) return;
    await dispatch(deleteReview({ 
      reviewId: deletingReviewId, 
      token: session?.accessToken || "" 
    }));
    toast.success("Review deleted");
    setDeletingReviewId(null);
  };

  const handleBanUser = async () => {
    if (!banningUser || !banReason.trim()) return;
    setBanActionLoading(true);
    try {
      await banUser(session?.accessToken || "", banningUser._id, banReason.trim());
      setUsersList((prev) =>
        prev.map((u) =>
          u._id === banningUser._id
            ? { ...u, isBanned: true, banReason: banReason.trim() }
            : u
        )
      );
      toast.success(`${banningUser.name} has been banned`);
      setBanningUser(null);
      setBanReason("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to ban user");
    } finally {
      setBanActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!unbanningUserId) return;
    setBanActionLoading(true);
    try {
      await unbanUser(session?.accessToken || "", unbanningUserId);
      setUsersList((prev) =>
        prev.map((u) =>
          u._id === unbanningUserId
            ? { ...u, isBanned: false, banReason: "" }
            : u
        )
      );
      const user = usersList.find((u) => u._id === unbanningUserId);
      toast.success(`${user?.name ?? "User"} has been unbanned`);
      setUnbanningUserId(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to unban user");
    } finally {
      setBanActionLoading(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="text-white mb-1"
                  style={{ fontSize: "1.5rem", fontWeight: 700 }}
                >
                  Admin Dashboard
                </h1>
                <p className="text-slate-400 text-sm">
                  Manage appointments and patient reviews
                </p>
              </div>
              <MuiButton
                variant="contained"
                startIcon={<UserPlus size={16} />}
                onClick={() => router.push("/admin/create-account")}
                sx={{
                  borderRadius: "10px",
                  bgcolor: "#2563eb",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                Create Account
              </MuiButton>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Bookings"
              value={allBookings.length}
              icon={Calendar}
              color="text-blue-400"
            />
            <StatCard
              label="Upcoming"
              value={upcomingCount}
              icon={LayoutDashboard}
              color="text-green-400"
            />
            <StatCard
              label="Unique Patients"
              value={uniquePatients}
              icon={Users}
              color="text-purple-400"
            />
            <StatCard
              label="Total Reviews"
              value={allReviews.length}
              icon={Star}
              color="text-amber-400"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* MUI Tabs */}
        <Paper
          sx={{
            mb: 3,
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #f1f5f9",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              px: 1,
              pt: 0.5,
              "& .MuiTabs-indicator": { borderRadius: 2, height: 3 },
            }}
          >
            <Tab
              icon={<Calendar size={15} />}
              iconPosition="start"
              label={`Appointments (${allBookings.length})`}
              sx={{ fontWeight: 500, minHeight: 48 }}
            />
            <Tab
              icon={<MessageSquare size={15} />}
              iconPosition="start"
              label={`Reviews (${allReviews.length})`}
              sx={{ fontWeight: 500, minHeight: 48 }}
            />
            <Tab
              icon={<Users size={15} />}
              iconPosition="start"
              label={`Users (${usersList.length})`}
              sx={{ fontWeight: 500, minHeight: 48 }}
            />
          </Tabs>
        </Paper>

        {/* ── BOOKINGS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Paper
            sx={{
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              overflow: "hidden",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 600 }}>
                  All Appointments
                </h2>
                <p className="text-slate-400 text-sm">
                  {filteredBookings.length} result
                  {filteredBookings.length !== 1 ? "s" : ""}
                </p>
              </div>
              <TextField
                placeholder="Search patients or dentists..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                size="small"
                sx={{ width: { xs: "100%", sm: 260 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={15} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <h3 className="text-slate-700 mb-1" style={{ fontWeight: 600 }}>
                  {bookingSearch ? "No results found" : "No bookings yet"}
                </h3>
                <p className="text-slate-400 text-sm">
                  {bookingSearch
                    ? "Try a different search term"
                    : "Patient appointments will appear here"}
                </p>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <button
                          onClick={() => handleSort("userName")}
                          className="flex items-center hover:text-slate-800 transition-colors"
                        >
                          Patient <SortIcon col="userName" />
                        </button>
                      </TableCell>
                      <TableCell
                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                      >
                        Email
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleSort("dentistName")}
                          className="flex items-center hover:text-slate-800 transition-colors"
                        >
                          Dentist <SortIcon col="dentistName" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleSort("date")}
                          className="flex items-center hover:text-slate-800 transition-colors"
                        >
                          Date <SortIcon col="date" />
                        </button>
                      </TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const dentist = dentistsList.find(
                        (d) => d._id === booking.dentistId,
                      );
                      const isUpcoming = new Date(booking.date) >= new Date();
                      return (
                        <TableRow key={booking.id} hover>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: "#dbeafe",
                                  color: "#2563eb",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                {booking.userName.charAt(0).toUpperCase()}
                              </Avatar>
                              <span
                                className="text-slate-700 text-sm"
                                style={{ fontWeight: 500 }}
                              >
                                {booking.userName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            sx={{ display: { xs: "none", sm: "table-cell" } }}
                          >
                            <span className="text-slate-500 text-sm">
                              {booking.userEmail}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-xs font-bold">
                                  {dentist?.name.split(" ").pop()?.charAt(0)}
                                </span>
                              </div>
                              <span className="text-slate-700 text-sm">
                                {getDentistName(booking.dentistId)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 text-sm">
                                {formatDate(booking.date)}
                              </span>
                              <Chip
                                label={isUpcoming ? "Upcoming" : "Past"}
                                size="small"
                                sx={{
                                  display: { xs: "none", lg: "inline-flex" },
                                  bgcolor: isUpcoming ? "#f0fdf4" : "#f8fafc",
                                  color: isUpcoming ? "#15803d" : "#94a3b8",
                                  border: `1px solid ${isUpcoming ? "#bbf7d0" : "#e2e8f0"}`,
                                  fontSize: "0.7rem",
                                  fontWeight: 500,
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Tooltip title="Edit booking">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    router.push(
                                      `/admin/edit-booking/${booking.id}`,
                                    )
                                  }
                                  sx={{
                                    color: "#94a3b8",
                                    "&:hover": {
                                      color: "#2563eb",
                                      bgcolor: "#eff6ff",
                                    },
                                    borderRadius: "8px",
                                  }}
                                >
                                  <Edit size={15} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete booking">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setDeletingBookingId(booking.id)
                                  }
                                  sx={{
                                    color: "#94a3b8",
                                    "&:hover": {
                                      color: "#dc2626",
                                      bgcolor: "#fff1f2",
                                    },
                                    borderRadius: "8px",
                                  }}
                                >
                                  <Trash2 size={15} />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* ── REVIEWS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 1 && (
          <Paper
            sx={{
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              overflow: "hidden",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 600 }}>
                  All Reviews
                </h2>
                <p className="text-slate-400 text-sm">
                  {filteredReviews.length} result
                  {filteredReviews.length !== 1 ? "s" : ""}
                </p>
              </div>
              <TextField
                placeholder="Search reviews..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                size="small"
                sx={{ width: { xs: "100%", sm: 260 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={15} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>

            {filteredReviews.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <h3 className="text-slate-700 mb-1" style={{ fontWeight: 600 }}>
                  {reviewSearch ? "No results found" : "No reviews yet"}
                </h3>
                <p className="text-slate-400 text-sm">
                  {reviewSearch
                    ? "Try a different search term"
                    : "Patient reviews will appear here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredReviews.map((review) => {
                  const dentist = dentistsList.find(
                    (d) => d._id === review.dentistId,
                  );
                  return (
                    <div
                      key={review.id}
                      className="p-5 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "#dbeafe",
                            color: "#2563eb",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          {review.userName.charAt(0).toUpperCase()}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                <span
                                  className="text-slate-800 text-sm"
                                  style={{ fontWeight: 600 }}
                                >
                                  {review.userName}
                                </span>
                                <span className="text-slate-300">→</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 text-xs font-bold">
                                      {dentist?.name.split(" ").pop()?.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="text-blue-600 text-sm">
                                    {getDentistName(review.dentistId)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Rating
                                  value={review.rating}
                                  readOnly
                                  size="small"
                                />
                                <span className="text-xs text-slate-400">
                                  {review.updatedAt
                                    ? `Edited ${formatDate(review.updatedAt)}`
                                    : formatDate(review.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                "{review.comment}"
                              </p>
                            </div>
                            <Tooltip title="Delete review">
                              <IconButton
                                size="small"
                                onClick={() => setDeletingReviewId(review.id)}
                                sx={{
                                  color: "#cbd5e1",
                                  "&:hover": {
                                    color: "#dc2626",
                                    bgcolor: "#fff1f2",
                                  },
                                  borderRadius: "8px",
                                  flexShrink: 0,
                                }}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Paper>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 2 && (
          <Paper
            sx={{
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              overflow: "hidden",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 600 }}>
                  User Management
                </h2>
                <p className="text-slate-400 text-sm">
                  {filteredUsers.length} result
                  {filteredUsers.length !== 1 ? "s" : ""}
                </p>
              </div>
              <TextField
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                size="small"
                sx={{ width: { xs: "100%", sm: 260 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={15} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>

            {usersLoading ? (
              <div className="flex justify-center items-center py-16">
                <CircularProgress size={32} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <h3 className="text-slate-700 mb-1" style={{ fontWeight: 600 }}>
                  {userSearch ? "No results found" : "No users yet"}
                </h3>
                <p className="text-slate-400 text-sm">
                  {userSearch
                    ? "Try a different search term"
                    : "Registered users will appear here"}
                </p>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: user.isBanned ? "#fee2e2" : "#dbeafe",
                                color: user.isBanned ? "#dc2626" : "#2563eb",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                              }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <span
                              className="text-slate-700 text-sm"
                              style={{ fontWeight: 500 }}
                            >
                              {user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          <span className="text-slate-500 text-sm">{user.email}</span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            sx={{
                              bgcolor: user.role === "admin" ? "#eff6ff" : user.role === "dentist" ? "#f0fdf4" : "#f8fafc",
                              color: user.role === "admin" ? "#2563eb" : user.role === "dentist" ? "#15803d" : "#64748b",
                              border: `1px solid ${user.role === "admin" ? "#bfdbfe" : user.role === "dentist" ? "#bbf7d0" : "#e2e8f0"}`,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {user.isBanned ? (
                            <Tooltip title={user.banReason ? `Reason: ${user.banReason}` : "Banned"}>
                              <Chip
                                label="Banned"
                                size="small"
                                sx={{
                                  bgcolor: "#fff1f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              label="Active"
                              size="small"
                              sx={{
                                bgcolor: "#f0fdf4",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {user.isBanned ? (
                              <MuiButton
                                variant="contained"
                                size="small"
                                onClick={() => setUnbanningUserId(user._id)}
                                sx={{
                                  borderRadius: "8px",
                                  bgcolor: "#15803d",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  textTransform: "none",
                                  "&:hover": { bgcolor: "#166534" },
                                }}
                              >
                                Unban
                              </MuiButton>
                            ) : (
                              <MuiButton
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  setBanningUser(user);
                                  setBanReason("");
                                }}
                                disabled={user.role === "admin"}
                                sx={{
                                  borderRadius: "8px",
                                  bgcolor: "#dc2626",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  textTransform: "none",
                                  "&:hover": { bgcolor: "#b91c1c" },
                                  "&.Mui-disabled": { bgcolor: "#f1f5f9", color: "#94a3b8" },
                                }}
                              >
                                Ban
                              </MuiButton>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </main>

      {/* Delete Booking Dialog */}
      <Dialog
        open={!!deletingBookingId}
        onClose={() => setDeletingBookingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Booking?</DialogTitle>
        <DialogContent>
          <p className="text-slate-500 text-sm">
            This will permanently delete the appointment for{" "}
            <strong className="text-slate-700">
              {allBookings.find((b) => b.id === deletingBookingId)?.userName}
            </strong>
            . This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={() => setDeletingBookingId(null)}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              borderColor: "#e2e8f0",
              color: "#374151",
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleDeleteBooking}
            variant="contained"
            sx={{
              borderRadius: "10px",
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Delete Review Dialog */}
      <Dialog
        open={!!deletingReviewId}
        onClose={() => setDeletingReviewId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Review?</DialogTitle>
        <DialogContent>
          <p className="text-slate-500 text-sm">
            Delete{" "}
            <strong className="text-slate-700">
              {allReviews.find((r) => r.id === deletingReviewId)?.userName}
            </strong>
            's review? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={() => setDeletingReviewId(null)}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              borderColor: "#e2e8f0",
              color: "#374151",
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleDeleteReview}
            variant="contained"
            sx={{
              borderRadius: "10px",
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog
        open={!!banningUser}
        onClose={() => { setBanningUser(null); setBanReason(""); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Ban User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            You are about to ban{" "}
            <strong className="text-slate-700">{banningUser?.name}</strong>.
            Please provide a reason.
          </DialogContentText>
          <TextField
            autoFocus
            label="Reason"
            placeholder="e.g. misinformation, spam..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={() => { setBanningUser(null); setBanReason(""); }}
            variant="outlined"
            disabled={banActionLoading}
            sx={{ borderRadius: "10px", borderColor: "#e2e8f0", color: "#374151" }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleBanUser}
            variant="contained"
            disabled={!banReason.trim() || banActionLoading}
            sx={{ borderRadius: "10px", bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
          >
            {banActionLoading ? <CircularProgress size={16} color="inherit" /> : "Ban User"}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog
        open={!!unbanningUserId}
        onClose={() => setUnbanningUserId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Unban User?</DialogTitle>
        <DialogContent>
          <p className="text-slate-500 text-sm">
            Remove ban for{" "}
            <strong className="text-slate-700">
              {usersList.find((u) => u._id === unbanningUserId)?.name}
            </strong>
            ? They will regain access to the platform.
          </p>
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={() => setUnbanningUserId(null)}
            variant="outlined"
            disabled={banActionLoading}
            sx={{ borderRadius: "10px", borderColor: "#e2e8f0", color: "#374151" }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleUnbanUser}
            variant="contained"
            disabled={banActionLoading}
            sx={{ borderRadius: "10px", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
          >
            {banActionLoading ? <CircularProgress size={16} color="inherit" /> : "Unban User"}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
