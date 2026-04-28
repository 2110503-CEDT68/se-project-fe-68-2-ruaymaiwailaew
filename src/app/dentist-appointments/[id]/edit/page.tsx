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
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

// ── UTC+7 helpers ─────────────────────────────────────────────────────────────

const UTC_OFFSET = 7;

function toBangkokTime(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  return new Date(utcMs + UTC_OFFSET * 3_600_000);
}

/** แปลง ISO string → "28 April 2026" (UTC+7) */
function formatDateBKK(dateStr: string): string {
  if (!dateStr) return "";
  return toBangkokTime(new Date(dateStr)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** แปลง ISO string → "13:52 (UTC+7)" */
function formatTimeBKK(dateStr: string): string {
  if (!dateStr) return "";
  const bkk = toBangkokTime(new Date(dateStr));
  const hh = String(bkk.getHours()).padStart(2, "0");
  const mm = String(bkk.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} (UTC+${UTC_OFFSET})`;
}

/** แปลง ISO string → "YYYY-MM-DDTHH:mm" ใน timezone UTC+7 สำหรับ datetime-local input */
function toDatetimeLocalBKK(dateStr: string): string {
  if (!dateStr) return "";
  const bkk = toBangkokTime(new Date(dateStr));
  const yyyy = bkk.getFullYear();
  const MM = String(bkk.getMonth() + 1).padStart(2, "0");
  const dd = String(bkk.getDate()).padStart(2, "0");
  const hh = String(bkk.getHours()).padStart(2, "0");
  const mm = String(bkk.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

/** แปลง datetime-local value (UTC+7) กลับเป็น ISO UTC สำหรับส่ง API */
function bangkokInputToUTC(localValue: string): string {
  if (!localValue) return "";
  // localValue = "YYYY-MM-DDTHH:mm" ซึ่งเป็นเวลา UTC+7
  const asIfUTC = new Date(localValue + "Z"); // parse เป็น UTC ก่อน
  const utcMs = asIfUTC.getTime() - UTC_OFFSET * 3_600_000; // ลบ offset
  return new Date(utcMs).toISOString();
}

/** "now" ใน UTC+7 format สำหรับ min attribute ของ input */
function nowDatetimeLocalBKK(): string {
  return toDatetimeLocalBKK(new Date().toISOString());
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DentistEditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const allBookings = useAppSelector(selectAllBookings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ date: "" });
  const [error, setError] = useState<string | null>(null);

  const bookingId = params.id as string;
  const booking = allBookings.find((b) => b.id === bookingId);

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
      if (booking.dentistId !== session?.user?.id) {
        setError("You are not authorized to edit this appointment");
        return;
      }
      // แสดงเวลาใน input เป็น UTC+7
      setFormData({ date: toDatetimeLocalBKK(booking.date) });
      setLoading(false);
    }
  }, [booking, session?.user?.id]);

  const isBeforeOriginal = (localValue: string): boolean => {
    const selectedUTC = new Date(bangkokInputToUTC(localValue));
    const original = new Date(booking?.date || "");
    return selectedUTC < original;
  };

  const handleSave = async () => {
    if (!formData.date) {
      toast.error("Please select a date and time");
      return;
    }

    // ตรวจสอบว่าเลือกเวลาในอดีตหรือไม่ (เทียบแบบ UTC)
    if (isBeforeOriginal(formData.date)) {
      toast.error("Cannot select a past date");
      return;
    }

    setSaving(true);
  try {
    const result = await dispatch(
      updateBooking({
        bookingId,
        token: session?.accessToken || "",
        date: bangkokInputToUTC(formData.date), 
        dentistId: booking?.dentistId || "",
      })
    );

    if (updateBooking.fulfilled.match(result)) {
      toast.success("Appointment updated successfully");
      // รีโหลดข้อมูลเพื่อให้ Store อัปเดตล่าสุด
      await dispatch(loadBookings(session?.accessToken || ""));
      
      setTimeout(() => {
        router.push("/dentist-appointments");
      }, 1000);
    } else {
      toast.error((result.payload as string) || "Update failed");
      setSaving(false);
    }
  } catch (err) {
    console.error(err);
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
        <button
          onClick={() => router.push("/dentist-appointments")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Appointments
        </button>

        <Card sx={{ borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "none" }}>
          <CardHeader
            title="Edit Appointment"
            subheader="Update the appointment date and time"
            sx={{
              borderBottom: "1px solid #f1f5f9",
              "& .MuiCardHeader-title": { fontSize: "1.25rem", fontWeight: 600, color: "#0f172a" },
              "& .MuiCardHeader-subheader": { color: "#64748b", marginTop: "4px" },
            }}
          />

          <CardContent sx={{ p: 6 }}>
            {/* Patient Info */}
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-slate-700 mb-3 text-sm font-semibold">Patient Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Name:</span>
                  <span className="text-slate-900 font-medium text-sm">{booking.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Email:</span>
                  <span className="text-slate-900 text-sm">{booking.userEmail}</span>
                </div>
              </div>
            </div>

            {/* Current Appointment — แสดงเป็น UTC+7 */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-slate-700 mb-3 text-sm font-semibold">Current Appointment</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-slate-900 text-sm">{formatDateBKK(booking.date)}</span>
                <Clock size={18} className="text-slate-400 ml-4" />
                <span className="text-slate-900 text-sm">{formatTimeBKK(booking.date)}</span>
              </div>
            </div>

            {/* Form — input แสดง/รับค่าเป็น UTC+7 */}
            <div className="space-y-6 mb-8">
              <FormControl fullWidth>
                <label htmlFor="datetime" className="block text-sm font-medium text-slate-700 mb-2">
                  New Date & Time <span className="text-slate-400 font-normal">(UTC+{UTC_OFFSET})</span>
                </label>
                <TextField
                  id="datetime"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ date: e.target.value })}
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    htmlInput: { min: nowDatetimeLocalBKK() },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Select a future date and time (Bangkok time, UTC+{UTC_OFFSET})
                </p>
              </FormControl>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <MuiButton
                variant="outlined"
                onClick={() => router.push("/dentist-appointments")}
                disabled={saving}
                sx={{ borderRadius: "10px", borderColor: "#e2e8f0", color: "#374151", textTransform: "none", fontWeight: 500, flex: 1 }}
              >
                Cancel
              </MuiButton>
              <MuiButton
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ borderRadius: "10px", bgcolor: "#2563eb", textTransform: "none", fontWeight: 500, flex: 1, "&:hover": { bgcolor: "#1d4ed8" } }}
              >
                {saving ? <CircularProgress size={20} /> : "Save Changes"}
              </MuiButton>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h4 className="text-sm font-medium text-amber-900 mb-2">Important Notes</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Changes to appointment time should be notified to the patient</li>
            <li>• Ensure the new time slot is available</li>
            <li>• Cancellations must be done through the Delete option</li>
          </ul>
        </div>
      </div>

    </div>
  );
}