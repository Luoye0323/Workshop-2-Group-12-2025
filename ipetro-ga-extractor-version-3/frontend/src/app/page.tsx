import Image from "next/image";
import Dashboard from "./(main)/dashboard/page";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div className="flex w-full min-h-screen bg-zinc-50 font-sans dark:bg-background">
      {redirect("/login")}
    </div>
  );
}
