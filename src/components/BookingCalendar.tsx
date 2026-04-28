"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useAppSelector } from "@/store";
import { selectAllBookings } from "@/store/slices/bookingSlice";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

const DENTIST_COLORS = [
  "#34d399",
  "#3b82f6",
  "#ef4444",
  "#0ea5e9",
  "#8b5cf6",
  "#a855f7",
  "#f59e0b",
];

export default function BookingCalendar() {
  const bookings = useAppSelector(selectAllBookings);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<"month" | "work_week" | "day">("work_week");

  // แปลง bookings จาก Redux → CalendarEvent
  const events: CalendarEvent[] = React.useMemo(() => {
    if (bookings.length === 0) return [];

    const colorMap = new Map<string, string>();
    let colorIndex = 0;

    return bookings.map((booking) => {
      const startDate = new Date(booking.date);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      if (!colorMap.has(booking.dentistId)) {
        colorMap.set(
          booking.dentistId,
          DENTIST_COLORS[colorIndex++ % DENTIST_COLORS.length],
        );
      }

      return {
        id: booking.id,
        title: booking.dentistName,
        start: startDate,
        end: endDate,
        color: colorMap.get(booking.dentistId),
      };
    });
  }, [bookings]);

  // กระโดดไปวันของ booking แรกเมื่อโหลดครั้งแรก
  useEffect(() => {
    if (bookings.length > 0) {
      setCurrentDate(new Date(bookings[0].date));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color ?? "#2563eb",
      borderRadius: "4px",
      color: "white",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      padding: "4px 8px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    },
  });

  // ถ้าไม่มี booking เลย → ไม่แสดงอะไร
  if (bookings.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Weekly Schedule</h2>
      </div>

      <div style={{ height: "800px" }} className="calendar-container  [&_.rbc-current-time-indicator]:hidden">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
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
    </div>
  );
}