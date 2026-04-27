"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loadBookings,
  selectAllBookings,
  updateBooking,
} from "@/store/slices/bookingSlice";
import { fetchDentists, type Dentist } from "@/data/dentists";
import MuiButton from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const allBookings = useAppSelector(selectAllBookings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);
  const [formData, setFormData] = useState({
    date: "",
    dentistId: "",
  });

  const bookingId = params.id as string;
  const booking = allBookings.find((b) => b.id === bookingId);

  // Format booking date to datetime-local input format
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    // Handle both ISO format (2024-01-15T10:30:00) and with space (2024-01-15 10:30:00)
    const normalized = dateStr.replace(" ", "T");
    return normalized.slice(0, 16); // Return YYYY-MM-DDTHH:mm
  };

  useEffect(() => {
    const isAdmin = session?.user?.role === "admin";
    if (!isAdmin) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadDentists = async () => {
      try {
        const data = await fetchDentists();
        setDentistsList(data);
      } catch (error) {
        console.error("Failed to load dentists:", error);
        toast.error("Failed to load dentists");
      }
    };
    loadDentists();
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      dispatch(loadBookings(session.accessToken));
    }
  }, [session]);

  useEffect(() => {
    if (booking) {
      setFormData({
        date: formatDateForInput(booking.date),
        dentistId: booking.dentistId,
      });
      setLoading(false);
    }
  }, [booking]);

  const todayStr = new Date().toLocaleDateString("en-CA");

  const handleSave = async () => {
    if (!formData.date || !formData.dentistId) {
      toast.error("Please fill in all fields");
      return;
    }

    const selectedDate = formData.date.split("T")[0];
    if (selectedDate < todayStr) {
      toast.error("Cannot set a booking date in the past");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateBooking({
          bookingId: bookingId,
          dentistId: formData.dentistId,
          date: formData.date,
          token: session?.accessToken || "",
        }),
      );
      await dispatch(loadBookings(session?.accessToken || ""));
      toast.success("Booking updated successfully");
      router.push("/admin");
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <p className="text-slate-500 mt-4">Loading...</p>
        </Box>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert severity="error">Booking not found</Alert>
          <MuiButton
            startIcon={<ArrowLeft size={16} />}
            onClick={() => router.push("/admin")}
            sx={{ mt: 2 }}
          >
            Back to Admin
          </MuiButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <MuiButton
          startIcon={<ArrowLeft size={16} />}
          onClick={() => router.push("/admin")}
          sx={{ mb: 3, color: "#475569" }}
        >
          Back
        </MuiButton>

        <Card sx={{ borderRadius: "16px", border: "1px solid #f1f5f9" }}>
          <CardHeader
            title="Edit Booking"
            subheader={`Patient: ${booking.userName}`}
            sx={{
              pb: 2,
              "& .MuiCardHeader-title": {
                fontWeight: 600,
                fontSize: "1.25rem",
              },
              "& .MuiCardHeader-subheader": {
                fontSize: "0.875rem",
              },
            }}
          />
          <CardContent sx={{ pt: 0 }}>
            <div className="space-y-6">
              {/* Patient Info */}
              <div>
                <h3 className="text-slate-700 font-semibold mb-3">
                  Patient Information
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="text-slate-600">Name:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {booking.userName}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-600">Email:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {booking.userEmail}
                    </span>
                  </p>
                </div>
              </div>

              {/* Current Booking Date */}
              <div>
                <h3 className="text-slate-700 font-semibold mb-3">Date</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">
                      {booking.date
                        ? (() => {
                          const d = new Date(booking.date);
                          const day = String(d.getDate()).padStart(2, "0");
                          const month = String(d.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()
                        : "-"}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${booking.date && new Date(booking.date) >= new Date()
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {booking.date && new Date(booking.date) >= new Date()
                        ? "Upcoming"
                        : "Past"}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs text-slate-500 mb-1">Dentist:</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {booking.dentistName || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div>
                <h3 className="text-slate-700 font-semibold mb-5">
                  Appointment Details
                </h3>
                <div className="space-y-6">
                  <FormControl fullWidth>
                    <InputLabel>Dentist</InputLabel>
                    <Select
                      value={formData.dentistId}
                      label="Dentist"
                      onChange={(e) =>
                        setFormData({ ...formData, dentistId: e.target.value })
                      }
                      sx={{ borderRadius: "8px" }}
                    >
                      {dentistsList.map((dentist) => (
                        <MenuItem key={dentist._id} value={dentist._id}>
                          {dentist.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <div></div>
                  <input
                    type="date"
                    value={formData.date ? formData.date.split("T")[0] : ""}
                    min={todayStr}
                    onChange={(e) => {
                      const time = formData.date.split("T")[1] || "00:00";
                      setFormData({
                        ...formData,
                        date: `${e.target.value}T${time}`,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
                <MuiButton
                  variant="outlined"
                  onClick={() => router.push("/admin")}
                  disabled={saving}
                  sx={{
                    borderRadius: "10px",
                    borderColor: "#e2e8f0",
                    color: "#374151",
                  }}
                >
                  Cancel
                </MuiButton>
                <MuiButton
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    borderRadius: "10px",
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                    "&:disabled": { bgcolor: "#93c5fd" },
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </MuiButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
