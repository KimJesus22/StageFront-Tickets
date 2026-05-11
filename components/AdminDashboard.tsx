"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { createNewEvent } from "@/lib/actions/admin";
import SalesEfficiencyPanel from "@/components/SalesEfficiencyPanel";

export default function AdminDashboard({ stats }: { stats: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await createNewEvent(formData);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast("Evento creado exitosamente", "success");
        form.reset();
        setIsModalOpen(false);
      }
    });
  };

  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  // Format numbers
  const formatNumber = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-zinc-950 text-on-background font-body-md text-body-md min-h-screen flex overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-lg font-body-md shadow-lg transition-all animate-fade-in-up ${
            toast.type === "success" ? "bg-green-600/90 text-white" : "bg-red-600/90 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* SideNavBar */}
      <nav className="h-screen w-64 fixed left-0 top-0 z-50 bg-zinc-950 border-r border-white/10 shadow-2xl shadow-black/50 flex flex-col py-6 gap-2">
        <div className="px-6 mb-8">
          <h1 className="text-white font-black tracking-widest font-headline-md text-headline-md">Nexus Ticketing</h1>
          <p className="text-zinc-400 font-label-caps text-label-caps mt-1">Enterprise Portal</p>
        </div>
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          <a className="bg-white text-zinc-950 rounded-lg flex items-center gap-3 px-4 py-3 mx-2 font-['Space_Grotesk'] text-sm font-medium border-l-4 border-zinc-950" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            Dashboard
          </a>
          <a className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 hover:translate-x-1 font-['Space_Grotesk'] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">confirmation_number</span>
            Events
          </a>
          <a className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 hover:translate-x-1 font-['Space_Grotesk'] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">receipt_long</span>
            Tickets
          </a>
          <a className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 hover:translate-x-1 font-['Space_Grotesk'] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">group</span>
            Customers
          </a>
          <a className="text-zinc-400 flex items-center gap-3 px-4 py-3 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 hover:translate-x-1 font-['Space_Grotesk'] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">monitoring</span>
            Analytics
          </a>
        </div>
        <div className="mt-auto px-4 pb-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary-fixed transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Event
          </button>
        </div>
        <div className="border-t border-white/10 pt-4 mt-2">
          <a className="text-zinc-400 flex items-center gap-3 px-4 py-2 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium" href="#">
            <span className="material-symbols-outlined text-[20px]">shield</span>
            Security
          </a>
          <a className="text-zinc-400 flex items-center gap-3 px-4 py-2 mx-2 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-['Space_Grotesk'] text-sm font-medium" href="#">
            <span className="material-symbols-outlined text-[20px]">contact_support</span>
            Support
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen relative">
        {/* TopAppBar */}
        <header className="docked full-width top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center w-full px-6 h-16 shadow-none sticky">
          <div className="flex-1 flex items-center">
            <div className="relative w-96 hidden md:block group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors text-[20px]">search</span>
              <input className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-body-md text-body-md" placeholder="Search events, users, or tickets..." type="text"/>
            </div>
            <div className="md:hidden">
              <span className="text-xl font-bold tracking-tighter text-white font-['Space_Grotesk'] text-sm tracking-tight">Nexus Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:bg-white/5 transition-colors p-2 rounded-full active:opacity-80 scale-[0.98] relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </button>
            <button className="text-zinc-400 hover:bg-white/5 transition-colors p-2 rounded-full active:opacity-80 scale-[0.98]">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="text-zinc-400 hover:bg-white/5 transition-colors p-2 rounded-full active:opacity-80 scale-[0.98]">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity pl-2">
              <div className="w-8 h-8 rounded-full border border-white/20 bg-zinc-800 flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
            </button>
          </div>
        </header>

        <div className="p-8 md:p-12 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-white mb-2">Dashboard Overview</h2>
              <p className="text-zinc-400 font-body-md text-body-md">Live ecosystem metrics and recent activity.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-label-caps text-label-caps backdrop-blur-[20px] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                This Week
              </button>
              <button className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed font-label-caps text-label-caps transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Report
              </button>
            </div>
          </div>

          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Revenue Card */}
            <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-emerald-400 font-label-caps text-label-caps flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> +12.5%
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-zinc-400 font-label-caps text-label-caps mb-1">Total Revenue</p>
                <p className="font-headline-lg text-headline-lg text-white tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>

            {/* Tickets Card */}
            <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <span className="material-symbols-outlined">local_activity</span>
                </div>
                <span className="text-emerald-400 font-label-caps text-label-caps flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> +8.2%
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-zinc-400 font-label-caps text-label-caps mb-1">Tickets Sold</p>
                <p className="font-headline-lg text-headline-lg text-white tracking-tight">{formatNumber(stats.totalTicketsSold)}</p>
              </div>
            </div>

            {/* Active Events Card */}
            <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <span className="text-zinc-400 font-label-caps text-label-caps flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                  Active Now
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-zinc-400 font-label-caps text-label-caps mb-1">Active Events</p>
                <p className="font-headline-lg text-headline-lg text-white tracking-tight">{formatNumber(stats.activeEventsCount)}</p>
              </div>
            </div>

            {/* Users Card */}
            <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <span className="text-emerald-400 font-label-caps text-label-caps flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> +2.1%
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-zinc-400 font-label-caps text-label-caps mb-1">Registered Users</p>
                <p className="font-headline-lg text-headline-lg text-white tracking-tight">{formatNumber(stats.usersCount)}</p>
              </div>
            </div>
          </div>

          {/* Sales Efficiency Section */}
          <div className="mb-12">
            <SalesEfficiencyPanel />
          </div>

          {/* Recent Events Table Section */}
          <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950/50">
              <h3 className="font-headline-md text-headline-md text-white">All Events</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-label-caps text-label-caps transition-all flex items-center gap-2"
              >
                New Event
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 font-label-caps text-label-caps text-zinc-400">Event Name</th>
                    <th className="p-4 font-label-caps text-label-caps text-zinc-400">Artist</th>
                    <th className="p-4 font-label-caps text-label-caps text-zinc-400">Date</th>
                    <th className="p-4 font-label-caps text-label-caps text-zinc-400">Venue</th>
                    <th className="p-4 font-label-caps text-label-caps text-zinc-400">Status</th>
                    <th className="p-4 font-label-caps text-label-caps text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-body-md">
                  {stats.events.map((event: any) => (
                    <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-white font-medium">{event.title}</td>
                      <td className="p-4 text-zinc-300">{event.artists?.name || "Unknown"}</td>
                      <td className="p-4 text-zinc-400">{dateFormatter.format(new Date(event.date))}</td>
                      <td className="p-4 text-zinc-400">{event.venue}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          event.status === 'Published' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : event.status === 'Sold Out'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {event.status === 'Published' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                          {event.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-zinc-500 hover:text-white transition-colors p-1">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stats.events.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        No events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-fade-in-up">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10">
              <h3 className="font-headline-md text-headline-md text-white">Create New Event</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent}>
              <div className="p-6 relative z-10 space-y-5">
                <div>
                  <label className="block font-label-caps text-label-caps text-zinc-400 mb-2">Event Title</label>
                  <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-body-md" placeholder="Enter event name" type="text"/>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block font-label-caps text-label-caps text-zinc-400 mb-2">Artist</label>
                    <input name="artist" required className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-body-md" placeholder="Primary act" type="text"/>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-zinc-400 mb-2">Venue</label>
                    <input name="venue" required className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-body-md" placeholder="Arena, City" type="text"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block font-label-caps text-label-caps text-zinc-400 mb-2">Date &amp; Time</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">calendar_today</span>
                      <input name="date" required className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-body-md" type="datetime-local"/>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-zinc-400 mb-2">Base Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-body-md">$</span>
                      <input name="basePrice" required min="0" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-8 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-body-md" placeholder="0.00" type="number"/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3 relative z-10 bg-zinc-950/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 text-white font-label-caps text-label-caps transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed font-label-caps text-label-caps transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
