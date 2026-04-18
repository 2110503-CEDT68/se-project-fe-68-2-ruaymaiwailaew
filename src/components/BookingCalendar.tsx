"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useSession } from "next-auth/react";

// TODO: แก้ไข Path ให้ตรงกับไฟล์ที่คุณประกาศ getBookings และ BookingPayload เอาไว้
import { getBookings,type BookingPayload } from "@/lib/bookingApi"; 

import "react-big-calendar/lib/css/react-big-calendar.css";

// ตั้งค่า Localizer สำหรับปฏิทิน
const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// รูปแบบข้อมูล Event
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

// ชุดสีสำหรับสุ่มให้คุณหมอ
const DENTIST_COLORS = [
  "#34d399", // เขียวอ่อน
  "#3b82f6", // น้ำเงิน
  "#ef4444", // แดง
  "#0ea5e9", // ฟ้า
  "#8b5cf6", // ม่วง
  "#a855f7", // ม่วงชมพู
  "#f59e0b", // เหลืองส้ม
];

export default function BookingCalendar() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // เปลี่ยนจาก initialDate → currentDate แบบ controlled
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<"month" | "work_week" | "day">("work_week");

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.accessToken) return;

      try {
        setLoading(true);
        const bookings: BookingPayload[] = await getBookings(session.accessToken);

        if (bookings.length > 0) {
          // ✅ set currentDate แทน initialDate — จะ re-render ปฏิทินให้กระโดดไปวันนั้นได้
          setCurrentDate(new Date(bookings[0].date));
        }

        const colorMap = new Map<string, string>();
        let colorIndex = 0;

        const apiEvents: CalendarEvent[] = bookings.map((booking) => {
          const startDate = new Date(booking.date);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

          if (!colorMap.has(booking.dentistId)) {
            colorMap.set(booking.dentistId, DENTIST_COLORS[colorIndex % DENTIST_COLORS.length]);
            colorIndex++;
          }

          return {
            id: booking.id,
            title: booking.dentistName,
            start: startDate,
            end: endDate,
            color: colorMap.get(booking.dentistId),
          };
        });

        setEvents(apiEvents);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [session?.accessToken]);

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || "#2563eb",
      borderRadius: "4px",
      color: "white",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      padding: "4px 8px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    },
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">กำลังโหลดตารางเวลา...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Weekly Schedule</h2>
      </div>

      <div style={{ height: "800px" }} className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          // ✅ controlled mode — date + onNavigate + view + onView
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          view={currentView}
          onView={(newView) => setCurrentView(newView as typeof currentView)}
          views={["month", "work_week", "day"]}
          eventPropGetter={eventStyleGetter}
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 7, 0, 0)}
          max={new Date(2024, 0, 1, 19, 0, 0)}
          onSelectEvent={(event) => alert(`You clicked on: ${event.title}`)}
        />
      </div>

      {/* CSS เหมือนเดิม */}
    </div>
  );
}