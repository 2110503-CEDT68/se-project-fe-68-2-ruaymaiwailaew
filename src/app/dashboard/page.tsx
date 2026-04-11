"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MuiButton from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import InputAdornment from "@mui/material/InputAdornment";
import {
  Calendar,
  Award,
  Search,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectAllReviews, loadReviews } from "@/store/slices/reviewSlice";
import { fetchDentists, type Dentist } from "@/data/dentists";

const expertiseColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "Orthodontics & Cosmetic Dentistry": {
    bg: "#f5f3ff",
    text: "#7c3aed",
    border: "#ddd6fe",
  },
  "Oral Surgery & Implants": {
    bg: "#fff1f2",
    text: "#be123c",
    border: "#fecdd3",
  },
  "Pediatric Dentistry": { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Periodontics & Endodontics": {
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
  },
  "General Dentistry & Teeth Whitening": {
    bg: "#f0f9ff",
    text: "#0369a1",
    border: "#bae6fd",
  },
  "Prosthodontics & Dental Restoration": {
    bg: "#eef2ff",
    text: "#4338ca",
    border: "#c7d2fe",
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("All");

  const allReviews = useAppSelector(selectAllReviews);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(true);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadDentists = async () => {
      try {
        const data = await fetchDentists();
        setDentistsList(data);

        if (session?.accessToken) {
          await Promise.all(
            data.map((d) =>
              dispatch(
                loadReviews({ dentistId: d._id, token: session.accessToken! }),
              ),
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load dentists:", error);
      } finally {
        setLoadingDentists(false);
      }
    };
    loadDentists();
  }, [session?.accessToken, dispatch]);

  const getAvgRating = (dentistId: string) => {
    const r = allReviews.filter((rv) => rv.dentistId === dentistId);
    return r.length === 0
      ? 0
      : r.reduce((s, rv) => s + rv.rating, 0) / r.length;
  };
  const getReviewCount = (dentistId: string) =>
    allReviews.filter((rv) => rv.dentistId === dentistId).length;

  const safeDentists = Array.isArray(dentistsList) ? dentistsList : [];

  const expertiseFilters = [
    "All",
    ...Array.from(
      new Set(safeDentists.map((d) => d.areaOfExpertise.split(" & ")[0])),
    ),
  ];

  const filteredDentists = safeDentists.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      d.areaOfExpertise.toLowerCase().includes(q);
    const matchFilter =
      selectedExpertise === "All" ||
      d.areaOfExpertise.includes(selectedExpertise);
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-1">Good day,</p>
              <h1
                className="text-white mb-2"
                style={{ fontSize: "1.75rem", fontWeight: 700 }}
              >
                {user?.name} 👋
              </h1>
              <p className="text-blue-100 text-sm">
                Browse our expert dentists and book your appointment today.
              </p>
            </div>
            <MuiButton
              variant="contained"
              onClick={() => router.push("/create-booking")}
              startIcon={<Calendar size={16} />}
              sx={{
                bgcolor: "white",
                color: "#2563eb",
                "&:hover": { bgcolor: "#eff6ff" },
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                fontWeight: 700,
                alignSelf: { xs: "flex-start", md: "center" },
              }}
            >
              Book Appointment
            </MuiButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2
              className="text-slate-800"
              style={{ fontSize: "1.25rem", fontWeight: 600 }}
            >
              Our Dentists
            </h2>
            <p className="text-slate-400 text-sm">
              {filteredDentists.length} specialist
              {filteredDentists.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <TextField
            placeholder="Search dentists or specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {expertiseFilters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onClick={() => setSelectedExpertise(filter)}
              variant={selectedExpertise === filter ? "filled" : "outlined"}
              color={selectedExpertise === filter ? "primary" : "default"}
              sx={{
                fontWeight: selectedExpertise === filter ? 600 : 400,
                borderColor: "#e2e8f0",
                "&:hover": { borderColor: "#93c5fd" },
              }}
            />
          ))}
        </div>

        {/* Dentist Grid */}
        {filteredDentists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDentists.map((dentist) => {
              const colors = expertiseColors[dentist.areaOfExpertise] ?? {
                bg: "#eff6ff",
                text: "#2563eb",
                border: "#bfdbfe",
              };
              const avg = getAvgRating(dentist._id);
              const count = getReviewCount(dentist._id);

              return (
                <div
                  key={dentist._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                >
                  {/* Info */}
                  <div className="p-5">
                    <h3
                      className="text-slate-800 mb-1"
                      style={{ fontWeight: 600 }}
                    >
                      {dentist.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {dentist.yearsOfExperience} yrs exp
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Rating
                          value={avg}
                          precision={0.5}
                          readOnly
                          size="small"
                          sx={{ fontSize: "0.95rem" }}
                        />
                        <span className="text-xs text-slate-400">
                          ({count})
                        </span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <MuiButton
                        variant="outlined"
                        size="small"
                        startIcon={<MessageSquare size={14} />}
                        onClick={() => router.push(`/dentist/${dentist._id}`)}
                        sx={{
                          flex: 1,
                          borderColor: "#e2e8f0",
                          color: "#475569",
                          borderRadius: "8px",
                          "&:hover": {
                            borderColor: "#93c5fd",
                            color: "#2563eb",
                            bgcolor: "#eff6ff",
                          },
                        }}
                      >
                        Reviews
                      </MuiButton>
                      <MuiButton
                        variant="contained"
                        size="small"
                        endIcon={<ChevronRight size={14} />}
                        onClick={() => router.push("/create-booking")}
                        sx={{ flex: 1, borderRadius: "8px", fontWeight: 600 }}
                      >
                        Book
                      </MuiButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-slate-700 mb-1" style={{ fontWeight: 600 }}>
              No dentists found
            </h3>
            <p className="text-slate-400 text-sm">
              Try adjusting your search or filter
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedExpertise("All");
              }}
              className="mt-4 text-blue-600 text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
