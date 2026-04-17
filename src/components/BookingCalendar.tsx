"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
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

export default function BookingCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ---------------------------------------------------------
    // วิธีที่ 1: ดึงข้อมูลจาก API ของคุณ (เอาคอมเมนต์ออกเมื่อพร้อมใช้)
    // ---------------------------------------------------------
    /*
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/bookings/availability");
        const data = await res.json();
        
        const apiEvents: CalendarEvent[] = data.map((booking: any) => ({
          id: booking._id,
          title: booking.title || "Appointment",
          start: new Date(booking.startTime),
          end: new Date(booking.endTime),
          color: booking.color || "#10b981", 
        }));
        
        setEvents(apiEvents);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
    */

    // ---------------------------------------------------------
    // วิธีที่ 2: ใช้ Mock Data เพื่อให้เห็น UI แบบในรูป (ลบออกเมื่อใช้ API จริง)
    // ---------------------------------------------------------
    const generateMockData = () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();
      
      // ฟังก์ชันช่วยสร้าง Date ในสัปดาห์ปัจจุบัน
      const getMockDate = (dayOffset: number, hours: number, minutes: number) => {
        const date = new Date(currentYear, currentMonth, currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1) + dayOffset; // หาวันจันทร์เป็นฐาน
        return new Date(currentYear, currentMonth, diff, hours, minutes);
      };

      const mockEvents: CalendarEvent[] = [
        { id: "1", title: "MAT 112 class", start: getMockDate(1, 8, 0), end: getMockDate(1, 9, 15), color: "#34d399" }, // อังคาร (Offset 1)
        { id: "2", title: "CSC 385 class", start: getMockDate(1, 9, 30), end: getMockDate(1, 10, 45), color: "#34d399" },
        { id: "3", title: "Staff research meeting", start: getMockDate(1, 14, 0), end: getMockDate(1, 15, 0), color: "#3b82f6" },
        
        { id: "4", title: "MAT 112 quiz", start: getMockDate(3, 7, 30), end: getMockDate(3, 8, 0), color: "#ef4444" }, // พฤหัส (Offset 3)
        { id: "5", title: "MAT 112 class", start: getMockDate(3, 8, 0), end: getMockDate(3, 9, 15), color: "#34d399" },
        { id: "6", title: "CSC 385", start: getMockDate(3, 9, 30), end: getMockDate(3, 10, 45), color: "#34d399" },
        { id: "7", title: "CSC 331 class", start: getMockDate(3, 13, 0), end: getMockDate(3, 14, 0), color: "#34d399" },
        { id: "8", title: "Research meeting", start: getMockDate(3, 14, 0), end: getMockDate(3, 15, 0), color: "#0ea5e9" },
        { id: "9", title: "CSC 331 HW 2", start: getMockDate(3, 16, 0), end: getMockDate(3, 17, 0), color: "#8b5cf6" },
        { id: "10", title: "PSY hw & quiz due", start: getMockDate(3, 17, 0), end: getMockDate(3, 18, 0), color: "#a855f7" },

        { id: "11", title: "CSC 331 class", start: getMockDate(4, 8, 0), end: getMockDate(4, 9, 0), color: "#34d399" }, // ศุกร์ (Offset 4)
        { id: "12", title: "ACM Meeting", start: getMockDate(4, 15, 0), end: getMockDate(4, 16, 0), color: "#f59e0b" },
      ];

      setEvents(mockEvents);
      setLoading(false);
    };
    
    generateMockData();
  }, []);

  // ฟังก์ชันตั้งค่าสีให้กับ Event ตามข้อมูล
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || "#2563eb", // สี Default
        borderRadius: "4px",
        color: "white",
        border: "none",
        fontSize: "12px",
        fontWeight: 600,
        padding: "4px 8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      },
    };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">กำลังโหลดตารางเวลา...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Weekly Schedule</h2>
      </div>
      
      {/* Container สำหรับปฏิทิน ต้องกำหนดความสูงเสมอ */}
      <div style={{ height: "800px" }} className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="work_week" // แสดงผลแบบ จันทร์-ศุกร์ (ใช้ 'week' หากต้องการ เสาร์-อาทิตย์ ด้วย)
          views={["month", "work_week", "day"]}
          eventPropGetter={eventStyleGetter}
          step={30}       // ซอยกริดทีละ 30 นาที
          timeslots={2}   // 1 ชั่วโมงมี 2 ช่อง
          min={new Date(2024, 0, 1, 7, 0, 0)}  // เริ่มต้นแสดงผลที่ 07:00
          max={new Date(2024, 0, 1, 19, 0, 0)} // สิ้นสุดแสดงผลที่ 19:00
          onSelectEvent={(event) => alert(`You clicked on: ${event.title}`)} // จัดการเมื่อคลิกที่ Event
        />
      </div>
      
      {/* CSS Override ตกแต่งให้คล้ายกับภาพตัวอย่างของคุณ */}
      <style dangerouslySetInnerHTML={{__html: `
        .calendar-container .rbc-time-view {
          border: none;
          border-top: 1px solid #e2e8f0;
        }
        .calendar-container .rbc-time-header {
          border-bottom: 1px solid #e2e8f0;
        }
        .calendar-container .rbc-header {
          padding: 12px 0;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          font-size: 0.75rem;
          border-bottom: none;
          border-left: none;
        }
        .calendar-container .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #f1f5f9;
        }
        .calendar-container .rbc-time-content {
          border-top: none;
        }
        .calendar-container .rbc-timeslot-group {
          border-bottom: 1px solid #f1f5f9;
          min-height: 60px;
        }
        .calendar-container .rbc-time-slot {
          border-top: 1px dashed #f8fafc;
        }
        .calendar-container .rbc-allday-cell {
          display: none; /* ซ่อนช่อง All day หากไม่ใช้งาน */
        }
        .calendar-container .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: none;
        }
        .calendar-container .rbc-label {
          color: #94a3b8;
          font-size: 0.8rem;
          padding: 0 8px;
        }
        .calendar-container .rbc-today {
          background-color: #f8fafc;
        }
        .calendar-container .rbc-event {
          outline: none;
        }
      `}} />
    </div>
  );
}