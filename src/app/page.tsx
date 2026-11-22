import { redirect } from "next/navigation";
import { DEFAULT_CAFE_ID } from "@/lib/seed-data";

export default function HomePage() {
  redirect(`/c/${DEFAULT_CAFE_ID}`);
}
