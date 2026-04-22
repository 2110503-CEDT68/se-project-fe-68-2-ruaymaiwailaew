"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import MuiButton from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import {
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
  UserCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createBooking,
  loadBookings,
  selectAllBookings,
} from "@/store/slices/bookingSlice";
import { selectAllReviews } from "@/store/slices/reviewSlice";
import { fetchDentists, type Dentist } from "@/data/dentists";
import { toast } from "sonner";

export default function CreateBookingPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [date, setDate] = useState("");
  const [selectedDentistId, setSelectedDentistId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(true);

  const allBookings = useAppSelector(selectAllBookings);
  const allReviews = useAppSelector(selectAllReviews);
  const currentUserId = user?.id ? String(user.id) : "";
  const hasExistingBooking = allBookings.some(
    (b) => String(b.userId) === currentUserId,
  );

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
  const selectedDentist = safeDentists.find((d) => d._id === selectedDentistId);

  const getAvgRating = (dentistId: string) => {
    const r = allReviews.filter((rv) => rv.dentistId === dentistId);
    return r.length === 0
      ? 0
      : r.reduce((s, rv) => s + rv.rating, 0) / r.length;
  };

  const getReviewCount = (dentistId: string) =>
    allReviews.filter((rv) => rv.dentistId === dentistId).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedDentistId) {
      toast.error("Please fill in all fields");
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error("Please select a future date");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = await dispatch(
      createBooking({
        dentistId: selectedDentistId,
        date,
        token: session?.accessToken || "",
      }),
    );

    setIsSubmitting(false);

    if (createBooking.fulfilled.match(result)) {
      toast.success("Appointment booked successfully!");
      router.push("/my-booking");
    } else {
      toast.error((result.payload as string) || "Booking failed");
    }
  };

  /* ── Existing booking gate ── */
  if (hasExistingBooking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-lg mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2
              className="text-slate-800 mb-2"
              style={{ fontSize: "1.25rem", fontWeight: 700 }}
            >
              Booking Limit Reached
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You already have an active booking. You can only hold one
              appointment at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <MuiButton
                variant="contained"
                onClick={() => router.push("/my-booking")}
                startIcon={<Calendar size={16} />}
                sx={{
                  flex: 1,
                  height: 44,
                  borderRadius: "10px",
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                View My Booking
              </MuiButton>
              <MuiButton
                variant="outlined"
                onClick={() => router.push("/dashboard")}
                sx={{
                  flex: 1,
                  height: 44,
                  borderRadius: "10px",
                  borderColor: "#e2e8f0",
                  color: "#374151",
                }}
              >
                Back to Dashboard
              </MuiButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Main booking form ── */
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-slate-900 mb-1"
            style={{ fontSize: "1.5rem", fontWeight: 700 }}
          >
            Book an Appointment
          </h1>
          <p className="text-slate-400 text-sm">
            Choose your dentist and preferred date to confirm your visit
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span
                  className="text-slate-700 text-sm"
                  style={{ fontWeight: 600 }}
                >
                  Appointment Details
                </span>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-7">
                  {/* Dentist select */}
                  <div className="space-y-2">
                    <label
                      className="block text-sm text-slate-600"
                      style={{ fontWeight: 500 }}
                    >
                      Choose a Dentist <span className="text-red-400">*</span>
                    </label>
                    <FormControl fullWidth>
                      <InputLabel shrink>Choose a Dentist</InputLabel>
                      <Select
                        value={selectedDentistId}
                        onChange={(e) => setSelectedDentistId(e.target.value)}
                        label="Choose a Dentist"
                        displayEmpty
                        disabled={loadingDentists}
                        sx={{ borderRadius: "10px" }}
                      >
                        <MenuItem value="" disabled>
                          <span className="text-slate-400">
                            {loadingDentists
                              ? "Loading dentists..."
                              : "Select a dentist..."}
                          </span>
                        </MenuItem>
                        {dentistsList.map((d) => (
                          <MenuItem key={d._id} value={d._id}>
                            <div className="flex items-center gap-3 py-1">
                              <div className="w-8 h-8 rounded-full text-blue-600 bg-blue-50 flex items-center justify-center flex-shrink-0">
                                {d.name.split(" ").pop()?.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{d.name}</div>
                                <div className="text-xs text-slate-400">
                                  {d.areaOfExpertise}
                                </div>
                              </div>
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>

                  {/* Divider between fields */}
                  <div className="border-t border-slate-100" />

                  {/* Date */}
                  <div className="space-y-2">
                    <label
                      className="block text-sm text-slate-600"
                      style={{ fontWeight: 500 }}
                    >
                      Appointment Date <span className="text-red-400">*</span>
                    </label>
                    <TextField
                      label="Appointment Date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      slotProps={{
                        htmlInput: {
                          min: new Date().toISOString().split("T")[0],
                        },
                        inputLabel: { shrink: true },
                      }}
                      required
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                      }}
                    />
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-700 text-sm leading-relaxed">
                      You can book <strong>one appointment at a time</strong>.
                      You can edit or cancel from "My Booking".
                    </p>
                  </div>

                  {/* Submit */}
                  <MuiButton
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSubmitting || !date || !selectedDentistId}
                    endIcon={!isSubmitting && <ArrowRight size={16} />}
                    sx={{
                      height: 50,
                      borderRadius: "10px",
                      fontWeight: 700,
                      boxShadow: "none",
                      "&:hover": { boxShadow: "none" },
                    }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Confirming...
                      </span>
                    ) : (
                      "Confirm Appointment"
                    )}
                  </MuiButton>
                </form>
              </div>
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dentist preview card */}
            {selectedDentist ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 space-y-3">
                  <div>
                    <h3
                      className="text-slate-800 mb-0.5"
                      style={{ fontWeight: 700 }}
                    >
                      {selectedDentist.name}
                    </h3>
                    <Chip
                      label={selectedDentist.areaOfExpertise}
                      size="small"
                      sx={{
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: 500,
                        fontSize: "0.7rem",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    {selectedDentist.yearsOfExperience} years of experience
                  </div>
                  {getReviewCount(selectedDentist._id) > 0 ? (
                    <div className="flex items-center gap-2">
                      <Rating
                        value={getAvgRating(selectedDentist._id)}
                        precision={0.1}
                        readOnly
                        size="small"
                        sx={{ color: "#f59e0b" }}
                      />
                      <span className="text-sm text-slate-500">
                        {getAvgRating(selectedDentist._id).toFixed(1)}
                        <span className="text-slate-400 text-xs ml-1">
                          ({getReviewCount(selectedDentist._id)} reviews)
                        </span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No reviews yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">
                  Select a dentist to preview their profile
                </p>
              </div>
            )}

            {/* Booking summary */}
            {(date || selectedDentist) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span
                    className="text-slate-700 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Appointment Summary
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {selectedDentist && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Dentist</span>
                      <span
                        className="text-slate-700"
                        style={{ fontWeight: 500 }}
                      >
                        {selectedDentist.name}
                      </span>
                    </div>
                  )}
                  {date && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Date</span>
                      <span
                        className="text-slate-700"
                        style={{ fontWeight: 500 }}
                      >
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {selectedDentist && date && (
                    <div className="pt-3 border-t border-slate-100">
                      <div
                        className="flex items-center gap-1.5 text-green-600 text-xs"
                        style={{ fontWeight: 500 }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ready to confirm
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
