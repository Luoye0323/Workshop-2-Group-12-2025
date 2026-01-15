import Image from "next/image";
import Dashboard from "./dashboard/page";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <Dashboard/>
    </div>
  );
}
