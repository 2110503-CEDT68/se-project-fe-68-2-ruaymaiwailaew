import { redirect } from "next/navigation";

// /profile → redirect to /profile/edit by default
export default function ProfilePage() {
  redirect("/profile/edit");
}