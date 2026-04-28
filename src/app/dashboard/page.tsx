"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Award,
  Search,
  ChevronRight,
  MessageSquare,
  Star,
  Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectAllReviews, loadReviews } from "@/store/slices/reviewSlice";
import { loadBookings, selectAllBookings } from "@/store/slices/bookingSlice";
import { fetchDentists, type Dentist } from "@/data/dentists";
import BookingCalendar from "@/components/BookingCalendar";

const UTC_OFFSET = 7;

function useCurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function toBangkokTime(date: Date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  return new Date(utcMs + UTC_OFFSET * 3_600_000);
}

function formatTime(date: Date) {
  return toBangkokTime(date).toLocaleTimeString("th-TH", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function formatDate(date: Date) {
  return toBangkokTime(date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const expertiseStyle: Record<string, { badge: string; dot: string }> = {
  "Orthodontics & Cosmetic Dentistry": { badge: "bg-violet-50 text-violet-700 border border-violet-200", dot: "bg-violet-400" },
  "Oral Surgery & Implants": { badge: "bg-rose-50 text-rose-700 border border-rose-200", dot: "bg-rose-400" },
  "Pediatric Dentistry": { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400" },
  "Periodontics & Endodontics": { badge: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  "General Dentistry & Teeth Whitening": { badge: "bg-sky-50 text-sky-700 border border-sky-200", dot: "bg-sky-400" },
  "Prosthodontics & Dental Restoration": { badge: "bg-indigo-50 text-indigo-700 border border-indigo-200", dot: "bg-indigo-400" },
};
const fallbackStyle = { badge: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-400" };

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={13} className={
          value >= i + 1 ? "fill-amber-400 text-amber-400"
          : value >= i + 0.5 ? "fill-amber-200 text-amber-400"
          : "fill-slate-100 text-slate-300"
        } />
      ))}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const now = useCurrentTime();
  const dispatch = useAppDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("All");
  const allReviews = useAppSelector(selectAllReviews);
  const allBookings = useAppSelector(selectAllBookings);
  const [dentistsList, setDentistsList] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;

    // โหลด bookings เข้า Redux store — BookingCalendar จะอ่านจาก store โดยตรง
    dispatch(loadBookings(session.accessToken));

    const loadDentists = async () => {
      try {
        const data = await fetchDentists();
        setDentistsList(data);
        await Promise.all(
          data.map((d) =>
            dispatch(loadReviews({ dentistId: d._id, token: session.accessToken! })),
          ),
        );
      } catch (err) {
        console.error("Failed to load dentists:", err);
      } finally {
        setLoadingDentists(false);
      }
    };
    loadDentists();
  }, [session?.accessToken, dispatch]);

  const getAvgRating = (id: string) => {
    const r = allReviews.filter((rv) => rv.dentistId === id);
    return r.length === 0 ? 0 : r.reduce((s, rv) => s + rv.rating, 0) / r.length;
  };
  const getReviewCount = (id: string) => allReviews.filter((rv) => rv.dentistId === id).length;

  const safeDentists = Array.isArray(dentistsList) ? dentistsList : [];

  const expertiseFilters = [
    "All",
    ...Array.from(new Set(safeDentists.map((d) => {
      const e = typeof d.areaOfExpertise === "string" && d.areaOfExpertise.trim() ? d.areaOfExpertise : "General Dentistry";
      return e.split(" & ")[0];
    }))),
  ];

  const filteredDentists = safeDentists.filter((d) => {
    const q = searchQuery.toLowerCase();
    const name = typeof d.name === "string" ? d.name : "";
    const expertise = typeof d.areaOfExpertise === "string" ? d.areaOfExpertise : "";
    return (
      (name.toLowerCase().includes(q) || expertise.toLowerCase().includes(q)) &&
      (selectedExpertise === "All" || expertise.includes(selectedExpertise))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 mt-16">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-1">Good day,</p>
              <h1 className="text-white text-2xl font-bold mb-2">{user?.name} 👋</h1>
              <p className="text-blue-100 text-sm">Browse our expert dentists and book your appointment today.</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                <Clock size={15} className="text-blue-200" />
                <div className="text-right">
                  <p className="text-white font-mono text-base font-semibold leading-none">{formatTime(now)}</p>
                  <p className="text-blue-200 text-xs mt-0.5">
                    {formatDate(now)}&nbsp;<span className="font-semibold text-white">UTC+{UTC_OFFSET}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/create-booking")}
                className="flex items-center gap-2 bg-white text-blue-600 font-bold text-sm px-4 py-2 rounded-lg shadow-md hover:bg-blue-50 transition-colors"
              >
                <CalendarIcon size={16} />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ซ่อน wrapper ทั้งหมดเมื่อไม่มี booking เหลือ */}
        {allBookings.length > 0 && (
          <div className="mb-12">
            <BookingCalendar />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-slate-800 text-xl font-semibold">Our Dentists</h2>
            <p className="text-slate-400 text-sm">
              {filteredDentists.length} specialist{filteredDentists.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dentists or specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {expertiseFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedExpertise(filter)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                selectedExpertise === filter
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loadingDentists ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                <div className="flex gap-2">
                  <div className="flex-1 h-9 bg-slate-100 rounded-lg" />
                  <div className="flex-1 h-9 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDentists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDentists.map((dentist) => {
              const style = expertiseStyle[dentist.areaOfExpertise] ?? fallbackStyle;
              const avg = getAvgRating(dentist._id);
              const count = getReviewCount(dentist._id);
              return (
                <div key={dentist._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                  <div className="px-5 pt-4 pb-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {dentist.areaOfExpertise || "General Dentistry"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-slate-800 font-semibold mb-1">{dentist.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {dentist.yearsOfExperience} yrs exp
                      </span>
                      <span className="flex items-center gap-1.5">
                        <StarRating value={avg} />
                        <span className="text-xs text-slate-400">({count})</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dentist/${dentist._id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 border border-slate-200 rounded-lg py-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <MessageSquare size={14} /> Reviews
                      </button>
                      <button
                        onClick={() => router.push("/create-booking")}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg py-2 hover:bg-blue-700 transition-colors"
                      >
                        Book <ChevronRight size={14} />
                      </button>
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
            <h3 className="text-slate-700 font-semibold mb-1">No dentists found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedExpertise("All"); }}
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