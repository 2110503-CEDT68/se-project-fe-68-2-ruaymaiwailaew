"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // ซ่อน navbar ในหน้า home เพราะ Home page มี custom navbar
  // และซ่อน navbar ในหน้า login และ register เพราะมี custom navbar
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  return <Navbar />;
}
