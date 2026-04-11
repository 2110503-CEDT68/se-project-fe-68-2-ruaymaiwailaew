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
import MuiButton from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

export default function DentistEditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const allBookings = useAppSelector(selectAllBookings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
  });
  const [error, setError] = useState<string | null>(null);

  const bookingId = params.id as string;
  const booking = allBookings.find((b) => b.id === bookingId);

  // Format booking date to datetime-local input format
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const normalized = dateStr.replace(" ", "T");
    return normalized.slice(0, 16); // Return YYYY-MM-DDTHH:mm
  };

  useEffect(() => {
    const isDentist = session?.user?.role === "dentist";
    if (!isDentist) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    if (session?.accessToken) {
      dispatch(loadBookings(session.accessToken));
    }
  }, [session?.accessToken, dispatch]);

  useEffect(() => {
    if (booking) {
      // Verify that the dentist owns this booking
      if (booking.dentistId !== session?.user?.id) {
        setError("You are not authorized to edit this appointment");
        return;
      }
      setFormData({
        date: formatDateForInput(booking.date),
      });
      setLoading(false);
    }
  }, [booking, session?.user?.id]);

  const handleSave = async () => {
    if (!formData.date) {
      toast.error("Please select a date and time");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateBooking({
          bookingId: bookingId,
          dentistId: booking?.dentistId || "",
          date: formData.date,
          token: session?.accessToken || "",
        }),
      );
      await dispatch(loadBookings(session?.accessToken || ""));
      toast.success("Appointment updated successfully");
      router.push("/dentist-appointments");
    } catch (err) {
      toast.error("Failed to update appointment");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push("/dentist-appointments")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Appointments
          </button>
          <Alert severity="error">{error}</Alert>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push("/dentist-appointments")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Appointments
          </button>
          <Alert severity="error">Appointment not found</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dentist-appointments")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Appointments
        </button>

        {/* Main Card */}
        <Card
          sx={{
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
            boxShadow: "none",
          }}
        >
          <CardHeader
            title="Edit Appointment"
            subheader="Update the appointment date and time"
            sx={{
              borderBottom: "1px solid #f1f5f9",
              "& .MuiCardHeader-title": {
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#0f172a",
              },
              "& .MuiCardHeader-subheader": {
                color: "#64748b",
                marginTop: "4px",
              },
            }}
          />

          <CardContent sx={{ p: 6 }}>
            {/* Patient Info Section */}
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3
                className="text-slate-700 mb-3"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Patient Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Name:</span>
                  <span className="text-slate-900 font-medium text-sm">
                    {booking.userName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Email:</span>
                  <span className="text-slate-900 text-sm">
                    {booking.userEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Appointment Info */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3
                className="text-slate-700 mb-3"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Current Appointment
              </h3>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-slate-900 text-sm">
                  {new Date(booking.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <Clock size={18} className="text-slate-400 ml-4" />
                <span className="text-slate-900 text-sm">
                  {new Date(booking.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-6 mb-8">
              <FormControl fullWidth>
                <label
                  htmlFor="datetime"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  New Date & Time
                </label>
                <TextField
                  id="datetime"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ date: e.target.value })}
                  fullWidth
                  variant="outlined"
                  inputProps={{
                    min: new Date().toISOString().slice(0, 16),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                    },
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Select a future date and time for the appointment
                </p>
              </FormControl>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <MuiButton
                variant="outlined"
                onClick={() => router.push("/dentist-appointments")}
                disabled={saving}
                sx={{
                  borderRadius: "10px",
                  borderColor: "#e2e8f0",
                  color: "#374151",
                  textTransform: "none",
                  fontWeight: 500,
                  flex: 1,
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
                  textTransform: "none",
                  fontWeight: 500,
                  flex: 1,
                  "&:hover": {
                    bgcolor: "#1d4ed8",
                  },
                }}
              >
                {saving ? <CircularProgress size={20} /> : "Save Changes"}
              </MuiButton>
            </div>
          </CardContent>
        </Card>

        {/* Information Box */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h4 className="text-sm font-medium text-amber-900 mb-2">
            Important Notes
          </h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>
              • Changes to appointment time should be notified to the patient
            </li>
            <li>• Ensure the new time slot is available</li>
            <li>• Cancellations must be done through the Delete option</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
