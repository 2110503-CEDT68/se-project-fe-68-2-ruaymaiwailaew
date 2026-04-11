"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MuiButton from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Calendar,
  Award,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updateBooking,
  deleteBooking,
  selectAllBookings,
  loadBookings,
} from "@/store/slices/bookingSlice";
import { selectAllReviews } from "@/store/slices/reviewSlice";
import { fetchDentists, type Dentist } from "@/data/dentists";
import { toast } from "sonner";

export default function MyBooking() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const allBookings = useAppSelector(selectAllBookings);
  const allReviews = useAppSelector(selectAllReviews);
  const currentUserId = user?.id ? String(user.id) : "";
  const booking =
    allBookings.find((b) => String(b.userId) === currentUserId) ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(booking?.date ?? "");
  const [editDentistId, setEditDentistId] = useState(booking?.dentistId ?? "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(true);

  useEffect(() => {
    if (!session) return;

    const loadDentists = async () => {
      try {
        const data = await fetchDentists();
        setDentistsList(data);
      } catch (error) {
        console.error("Failed to load dentists:", error);
        toast.error("Failed to load dentists");
      } finally {
        setLoadingDentists(false);
      }
    };
    loadDentists();
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      dispatch(loadBookings(session.accessToken));
    }
  }, [session]);

  const safeDentists = Array.isArray(dentistsList) ? dentistsList : [];
  const dentist = booking
    ? safeDentists.find((d) => d._id === booking.dentistId)
    : null;

  const getDentistReviewCount = (id: string) =>
    allReviews.filter((r) => r.dentistId === id).length;
  const getDentistAvgRating = (id: string) => {
    const r = allReviews.filter((rv) => rv.dentistId === id);
    return r.length === 0
      ? 0
      : r.reduce((s, rv) => s + rv.rating, 0) / r.length;
  };

  const handleSave = async () => {
    if (!editDate || !editDentistId) {
      toast.error("Please fill in all fields");
      return;
    }
    const sel = new Date(editDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sel < today) {
      toast.error("Please select a future date");
      return;
    }

    const result = await dispatch(
      updateBooking({
        bookingId: booking!.id,
        dentistId: editDentistId,
        date: editDate,
        token: session?.accessToken || "",
      }),
    );
    if (updateBooking.fulfilled.match(result)) {
      toast.success("Booking updated successfully!");
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await dispatch(
      deleteBooking({
        bookingId: booking!.id,
        token: session?.accessToken || "",
      }),
    );
    toast.success("Booking cancelled successfully");
    router.push("/dashboard");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-7 h-7 text-blue-400" />
            </div>
            <h2
              className="text-slate-800 mb-2"
              style={{ fontSize: "1.25rem", fontWeight: 600 }}
            >
              No Appointment Yet
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              You don't have any upcoming appointments. Book one now and let our
              expert dentists take care of your smile.
            </p>
            <MuiButton
              variant="contained"
              onClick={() => router.push("/create-booking")}
              startIcon={<Plus size={16} />}
              sx={{ height: 42, borderRadius: "10px", fontWeight: 600 }}
            >
              Book an Appointment
            </MuiButton>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-slate-900"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              My Appointment
            </h1>
            <p className="text-slate-400 text-sm">
              Manage your upcoming dental visit
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full text-sm">
            <CheckCircle className="w-3.5 h-3.5" />
            Confirmed
          </div>
        </div>

        {isEditing ? (
          /* ── Edit Form ─────────────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-800" style={{ fontWeight: 600 }}>
                Edit Appointment
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              <FormControl fullWidth size="small">
                <InputLabel>Dentist</InputLabel>
                <Select
                  value={editDentistId}
                  onChange={(e) => setEditDentistId(e.target.value)}
                  label="Dentist"
                  disabled={loadingDentists}
                  sx={{ borderRadius: "10px" }}
                >
                  {dentistsList.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      <div className="flex flex-col py-0.5">
                        <span style={{ fontWeight: 500 }}>{d.name}</span>
                        <span className="text-xs text-slate-400">
                          {d.areaOfExpertise}
                        </span>
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <div className="my-8" />

              <TextField
                label="Appointment Date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                inputProps={{ min: new Date().toISOString().split("T")[0] }}
                required
                InputLabelProps={{ shrink: true }}
              />

              <div className="my-10" />

              <div className="flex gap-3 pt-2">
                <MuiButton
                  variant="contained"
                  onClick={handleSave}
                  sx={{
                    flex: 1,
                    height: 44,
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  Save Changes
                </MuiButton>
                <MuiButton
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  sx={{
                    flex: 1,
                    height: 44,
                    borderRadius: "10px",
                    borderColor: "#e2e8f0",
                    color: "#374151",
                  }}
                >
                  Cancel
                </MuiButton>
              </div>
            </div>
          </div>
        ) : (
          /* ── View Mode ─────────────────────────────────────────────── */
          <div className="space-y-4">
            {/* Dentist Card */}
            {dentist && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex gap-5 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 mb-1">
                      Your Dentist
                    </div>
                    <h3
                      className="text-slate-800 mb-1"
                      style={{ fontWeight: 600 }}
                    >
                      {dentist.name}
                    </h3>
                    <p className="text-blue-600 text-sm mb-2">
                      {dentist.areaOfExpertise}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        {dentist.yearsOfExperience} yrs exp
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Rating
                          value={getDentistAvgRating(dentist._id)}
                          precision={0.5}
                          readOnly
                          size="small"
                          sx={{ fontSize: "0.85rem" }}
                        />
                        <span>({getDentistReviewCount(dentist._id)})</span>
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/dentist/${dentist._id}`)}
                      className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      View Reviews
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3
                className="text-slate-600 text-sm mb-4"
                style={{ fontWeight: 600 }}
              >
                APPOINTMENT DETAILS
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Date</div>
                    <div className="text-slate-800" style={{ fontWeight: 500 }}>
                      {formatDate(booking.date)}
                    </div>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Status</div>
                    <div className="text-green-600" style={{ fontWeight: 500 }}>
                      Confirmed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <MuiButton
                variant="outlined"
                startIcon={<Edit size={16} />}
                onClick={() => {
                  const bookingDate = booking.date
                    ? booking.date.split("T")[0]
                    : "";
                  setEditDate(bookingDate);
                  setEditDentistId(booking.dentistId);
                  setIsEditing(true);
                }}
                sx={{
                  flex: 1,
                  height: 44,
                  borderRadius: "10px",
                  borderColor: "#e2e8f0",
                  color: "#374151",
                  "&:hover": {
                    borderColor: "#93c5fd",
                    color: "#2563eb",
                    bgcolor: "#eff6ff",
                  },
                }}
              >
                Edit Appointment
              </MuiButton>
              <MuiButton
                variant="outlined"
                startIcon={<Trash2 size={16} />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{
                  flex: 1,
                  height: 44,
                  borderRadius: "10px",
                  borderColor: "#fecaca",
                  color: "#ef4444",
                  "&:hover": { bgcolor: "#fff1f2", borderColor: "#f87171" },
                }}
              >
                Cancel Appointment
              </MuiButton>
            </div>
          </div>
        )}

        {/* MUI Confirm Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Cancel Appointment?</DialogTitle>
          <DialogContent>
            <p className="text-slate-500 text-sm leading-relaxed">
              This will permanently cancel your appointment with{" "}
              <strong className="text-slate-700">{dentist?.name}</strong> on{" "}
              <strong className="text-slate-700">
                {formatDate(booking.date)}
              </strong>
              . This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions>
            <MuiButton
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: "10px",
                borderColor: "#e2e8f0",
                color: "#374151",
              }}
            >
              Keep it
            </MuiButton>
            <MuiButton
              onClick={() => {
                setDeleteDialogOpen(false);
                handleDelete();
              }}
              variant="contained"
              sx={{
                borderRadius: "10px",
                bgcolor: "#dc2626",
                "&:hover": { bgcolor: "#b91c1c" },
              }}
            >
              Yes, cancel
            </MuiButton>
          </DialogActions>
        </Dialog>
      </main>
    </div>
  );
}
