import ProfileSidebar from "./ProfileSidebar";
import Navbar from "@/components/Navbar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      <div className="md:hidden">
        <Navbar />
      </div>
      <ProfileSidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-12 mt-16 md:mt-0 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
