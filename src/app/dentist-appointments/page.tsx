"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MuiButton from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import {
  Edit,
  Trash2,
  Calendar,
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  Stethoscope,
  Clock,
  Award,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  deleteBooking,
  loadBookings,
  selectAllBookings,
} from "@/store/slices/bookingSlice";
import { getDentists, type Dentist } from "@/lib/bookingApi";
import { toast } from "sonner";

type SortKey = "patientName" | "date";
type SortDir = "asc" | "desc";

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  loading?: boolean;
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
        {loading ? (
          <Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function DentistProfileBanner({
  dentist,
  loading,
}: {
  dentist: Dentist | null;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
      <Avatar
        sx={{
          width: 56,
          height: 56,
          bgcolor: "#3b82f6",
          fontSize: "1.4rem",
          fontWeight: 700,
        }}
      >
        {loading ? "…" : (dentist?.name?.charAt(0).toUpperCase() ?? "D")}
      </Avatar>
      <div className="flex-1">
        {loading ? (
          <>
            <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            <Skeleton variant="text" width={260} height={20} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
          </>
        ) : dentist ? (
          <>
            <h1
              className="text-white mb-0.5"
              style={{ fontSize: "1.2rem", fontWeight: 700 }}
            >
              Dr. {dentist.name}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1 text-blue-300">
                <Stethoscope className="w-3.5 h-3.5" />
                {dentist.areaOfExpertise || "General Dentistry"}
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <Clock className="w-3.5 h-3.5" />
                {dentist.yearsOfExperience} yr
                {dentist.yearsOfExperience !== 1 ? "s" : ""} experience
              </span>
            </div>
          </>
        ) : (
          <h1
            className="text-white"
            style={{ fontSize: "1.2rem", fontWeight: 700 }}
          >
            My Appointments
          </h1>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DentistAppointmentsPage() {
  const { data: session } = useSession();
  const isDentist = session?.user?.role === "dentist";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const allBookings = useAppSelector(selectAllBookings);
  const dentistBookings = allBookings.filter(
    (b) => b.dentistId === session?.user?.id,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  // Dentist profile state
  const [dentistInfo, setDentistInfo] = useState<Dentist | null>(null);
  const [dentistLoading, setDentistLoading] = useState(true);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDentist) {
      router.push("/login");
    }
  }, [isDentist, router]);

  // ── Load bookings ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken) return;
    dispatch(loadBookings(session.accessToken));
  }, [session?.accessToken, dispatch]);

  // ── Fetch dentist profile from backend ─────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken || !session?.user?.id) return;

    setDentistLoading(true);
    getDentists(session.accessToken)
      .then((dentists) => {
        const me = dentists.find((d) => d._id === session.user?.id);
        setDentistInfo(me ?? null);
      })
      .catch((err) => {
        console.error("[dentist-appointments] failed to load dentist info:", err);
      })
      .finally(() => setDentistLoading(false));
  }, [session?.accessToken, session?.user?.id]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
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

  const filteredBookings = dentistBookings
    .filter((b) => {
      const q = searchQuery.toLowerCase();
      return (
        b.userName.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let vA: string, vB: string;
      if (sortKey === "patientName") {
        vA = a.userName;
        vB = b.userName;
      } else {
        vA = a.date;
        vB = b.date;
      }
      return sortDir === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });

  const upcomingCount = dentistBookings.filter(
    (b) => new Date(b.date) >= new Date(),
  ).length;

  const handleDeleteBooking = async () => {
    if (!deletingBookingId) return;
    try {
      await dispatch(
        deleteBooking({
          bookingId: deletingBookingId,
          token: session?.accessToken || "",
        }),
      );
      toast.success("Appointment deleted");
      setDeletingBookingId(null);
    } catch {
      toast.error("Failed to delete appointment");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Stats / Profile Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Dentist profile */}
          <DentistProfileBanner dentist={dentistInfo} loading={dentistLoading} />

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Appointments"
              value={dentistBookings.length}
              icon={Calendar}
              color="text-blue-400"
            />
            <StatCard
              label="Upcoming"
              value={upcomingCount}
              icon={Calendar}
              color="text-green-400"
            />
            <StatCard
              label="Unique Patients"
              value={new Set(dentistBookings.map((b) => b.userId)).size}
              icon={Users}
              color="text-purple-400"
            />
            <StatCard
              label="Experience"
              value={
                dentistLoading
                  ? "—"
                  : dentistInfo
                  ? `${dentistInfo.yearsOfExperience} yr${dentistInfo.yearsOfExperience !== 1 ? "s" : ""}`
                  : "—"
              }
              icon={Award}
              color="text-amber-400"
              loading={dentistLoading}
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Specialty badge (shown when data loaded) */}
        {!dentistLoading && dentistInfo?.areaOfExpertise && (
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-500" />
            <span className="text-slate-600 text-sm">
              Specialising in{" "}
              <span className="font-semibold text-slate-800">
                {dentistInfo.areaOfExpertise}
              </span>
            </span>
          </div>
        )}

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
                Appointments
              </h2>
              <p className="text-slate-400 text-sm">
                {filteredBookings.length} result
                {filteredBookings.length !== 1 ? "s" : ""}
              </p>
            </div>
            <TextField
              placeholder="Search patients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                {searchQuery ? "No results found" : "No appointments yet"}
              </h3>
              <p className="text-slate-400 text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : "Your appointments will appear here"}
              </p>
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <button
                        onClick={() => handleSort("patientName")}
                        className="flex items-center hover:text-slate-800 transition-colors"
                      >
                        Patient <SortIcon col="patientName" />
                      </button>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      Email
                    </TableCell>
                    {/* Dentist column populated from backend */}
                    <TableCell
                      sx={{ display: { xs: "none", md: "table-cell" } }}
                    >
                      Dentist
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center hover:text-slate-800 transition-colors"
                      >
                        Date <SortIcon col="date" />
                      </button>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const isUpcoming = new Date(booking.date) >= new Date();
                    return (
                      <TableRow key={booking.id} hover>
                        {/* Patient */}
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

                        {/* Email */}
                        <TableCell
                          sx={{ display: { xs: "none", sm: "table-cell" } }}
                        >
                          <span className="text-slate-500 text-sm">
                            {booking.userEmail}
                          </span>
                        </TableCell>

                        {/* Dentist – real data from database */}
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="text-slate-700 text-sm"
                              style={{ fontWeight: 500 }}
                            >
                              {dentistLoading ? (
                                <Skeleton variant="text" width={100} />
                              ) : (
                                `Dr. ${booking.dentistName || dentistInfo?.name || "—"}`
                              )}
                            </span>
                            {!dentistLoading && dentistInfo?.areaOfExpertise && (
                              <span className="text-xs text-blue-500">
                                {dentistInfo.areaOfExpertise}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <span className="text-slate-700 text-sm">
                            {formatDate(booking.date)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={isUpcoming ? "Upcoming" : "Past"}
                            size="small"
                            sx={{
                              bgcolor: isUpcoming ? "#f0fdf4" : "#f8fafc",
                              color: isUpcoming ? "#15803d" : "#94a3b8",
                              border: `1px solid ${
                                isUpcoming ? "#bbf7d0" : "#e2e8f0"
                              }`,
                              fontSize: "0.7rem",
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip title="Edit appointment">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  router.push(
                                    `/dentist-appointments/${booking.id}/edit`,
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
                            <Tooltip title="Delete appointment">
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
      </main>

      {/* Delete Appointment Dialog */}
      <Dialog
        open={!!deletingBookingId}
        onClose={() => setDeletingBookingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
          Delete Appointment?
        </DialogTitle>
        <DialogContent>
          <p className="text-slate-500 text-sm mt-2">
            This will permanently delete the appointment with{" "}
            <strong className="text-slate-700">
              {allBookings.find((b) => b.id === deletingBookingId)?.userName}
            </strong>
            . This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <MuiButton
            onClick={() => setDeletingBookingId(null)}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              borderColor: "#e2e8f0",
              color: "#374151",
              textTransform: "none",
              fontWeight: 500,
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
              color: "white",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
