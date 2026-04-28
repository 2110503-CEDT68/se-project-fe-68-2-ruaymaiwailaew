"use client";

import { useAuthUser } from "@/lib/useAuth";
import MuiButton from "@mui/material/Button";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Shield,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const steps = [
  {
    number: "01",
    title: "Create an Account",
    description:
      "Sign up in seconds with your name, email, and phone number. No complicated forms.",
    icon: Users,
  },
  {
    number: "02",
    title: "Choose a Dentist",
    description:
      "Browse our expert dentists with their specialties and years of experience.",
    icon: Calendar,
  },
  {
    number: "03",
    title: "Book Your Slot",
    description:
      "Pick your preferred date and confirm your appointment with one click.",
    icon: CheckCircle,
  },
];

const features = [
  {
    icon: Users,
    title: "Expert Dentists",
    description:
      "Choose from 6+ experienced dental professionals across various specialties.",
  },
  {
    icon: Calendar,
    title: "Easy Booking",
    description:
      "Simple and intuitive booking system. Schedule your appointment in minutes.",
  },
  {
    icon: Clock,
    title: "Flexible Management",
    description: "Edit or cancel your bookings anytime with just a few clicks.",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Your personal information is always protected with care.",
  },
];


export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, status } = useAuthUser();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, status, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Navbar for Home Page */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 2 5 5 5 9c0 2.5 1.2 5.5 2.5 8.5C8.5 20.5 9.5 22 12 22s3.5-1.5 4.5-4.5C17.8 14.5 19 11.5 19 9c0-4-3-7-7-7z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
            </div>
            <span
              className="text-slate-800 text-lg"
              style={{ fontWeight: 600 }}
            >
              Dentist<span className="text-blue-600">Booking</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MuiButton
              variant="text"
              size="small"
              onClick={() => router.push("/login")}
              sx={{ color: "#475569", fontWeight: 500 }}
            >
              Login
            </MuiButton>
            <MuiButton
              variant="contained"
              size="small"
              onClick={() => router.push("/register")}
              sx={{ borderRadius: "8px", fontWeight: 600 }}
            >
              Sign Up
            </MuiButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('/img/homepage_bg.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-950/70 to-blue-900/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Online Appointment Booking
            </div>
            <h1
              className="text-white mb-6"
              style={{ fontSize: "3.5rem", fontWeight: 700, lineHeight: 1.15 }}
            >
              Your Smile Deserves
              <span className="text-blue-400 block">Expert Care</span>
            </h1>
            <p
              className="text-blue-100/80 mb-8 max-w-xl"
              style={{ fontSize: "1.125rem", lineHeight: 1.7 }}
            >
              Book your dental appointment with ease. Connect with experienced
              dentists and manage your oral health care — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <MuiButton
                variant="contained"
                size="large"
                onClick={() => router.push("/register")}
                endIcon={<ArrowRight size={16} />}
                sx={{
                  bgcolor: "#3b82f6",
                  "&:hover": { bgcolor: "#2563eb" },
                  px: 3.5,
                  borderRadius: "10px",
                  fontWeight: 700,
                  boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
                }}
              >
                Book an Appointment
              </MuiButton>
              <MuiButton
                variant="outlined"
                size="large"
                onClick={() => router.push("/login")}
                sx={{
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                  px: 3.5,
                  borderRadius: "10px",
                }}
              >
                Sign In
              </MuiButton>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 mt-12">
              {[
                { value: "6+", label: "Expert Dentists" },
                { value: "500+", label: "Happy Patients" },
                { value: "10+", label: "Years of Service" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    className="text-white"
                    style={{ fontSize: "1.75rem", fontWeight: 700 }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-blue-200/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div
              className="inline-block text-blue-600 text-sm mb-3 px-3 py-1 bg-blue-50 rounded-full border border-blue-100"
              style={{ fontWeight: 600 }}
            >
              Why Choose Us
            </div>
            <h2
              className="text-slate-900 mb-4"
              style={{ fontSize: "2rem", fontWeight: 700 }}
            >
              Everything You Need, All in One Place
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We make dental care accessible, simple, and stress-free for every
              patient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3
                    className="text-slate-800 mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div
              className="inline-block text-blue-600 text-sm mb-3 px-3 py-1 bg-blue-50 rounded-full border border-blue-100"
              style={{ fontWeight: 600 }}
            >
              How It Works
            </div>
            <h2
              className="text-slate-900 mb-4"
              style={{ fontSize: "2rem", fontWeight: 700 }}
            >
              Book Your Appointment in 3 Easy Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-dashed border-t-2 border-dashed border-blue-100 z-0 -translate-x-1/2" />
                  )}
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-5 relative">
                      <Icon className="w-8 h-8 text-white" />
                      <span
                        className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs"
                        style={{ fontWeight: 700 }}
                      >
                        {step.number.slice(1)}
                      </span>
                    </div>
                    <h3
                      className="text-slate-800 mb-2"
                      style={{ fontWeight: 600 }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-white mb-4"
            style={{ fontSize: "2rem", fontWeight: 700 }}
          >
            Ready to Book Your Appointment?
          </h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Join hundreds of satisfied patients. Create your account today and
            experience seamless dental care booking.
          </p>
          <MuiButton
            variant="contained"
            size="large"
            onClick={() => router.push("/register")}
            sx={{
              bgcolor: "white",
              color: "#2563eb",
              "&:hover": { bgcolor: "#eff6ff" },
              px: 4,
              borderRadius: "10px",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            Register Now — It's Free
          </MuiButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8 2 5 5 5 9c0 2.5 1.2 5.5 2.5 8.5C8.5 20.5 9.5 22 12 22s3.5-1.5 4.5-4.5C17.8 14.5 19 11.5 19 9c0-4-3-7-7-7z"
                    fill="white"
                    opacity="0.9"
                  />
                </svg>
              </div>
              <span className="text-white text-sm" style={{ fontWeight: 600 }}>
                DentistBooking
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> +66 02-xxx-xxxx
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Bangkok, Thailand
              </span>
            </div>
            <div className="text-xs text-slate-500">
              © 2026 DentistBooking. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
