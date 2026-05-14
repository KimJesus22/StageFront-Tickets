import Link from "next/link";
import React from "react";

export interface ColumnDef {
  key: string;
  label: string;
  isAmount?: boolean;
  isStatus?: boolean;
}

export interface AdminTableProps {
  title: string;
  columns: ColumnDef[];
  data: any[];
  viewAllLink?: string;
}

export default function AdminTable({ title, columns, data, viewAllLink }: AdminTableProps) {
  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active" || s === "completed" || s === "available" || s === "featured") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-['Inter'] uppercase bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-500/20 tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {status}
        </span>
      );
    }
    if (s === "pending" || s === "reserved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-['Inter'] uppercase bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-500/20 tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> {status}
        </span>
      );
    }
    if (s === "cancelled" || s === "used") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-['Inter'] uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-['Inter'] uppercase bg-sky-500/10 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.4)] border border-sky-500/20 tracking-widest font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> {status}
      </span>
    );
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mt-12 shadow-2xl">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="font-['Space_Grotesk'] text-2xl font-medium text-white tracking-tight">{title}</h3>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-['Inter'] text-[12px] uppercase tracking-widest font-semibold">
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5 text-zinc-400 font-['Inter'] text-[12px] uppercase tracking-widest">
              {columns.map((col) => (
                <th key={col.key} className="p-6 font-semibold">{col.label}</th>
              ))}
              <th className="p-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm font-['Inter'] text-zinc-300 divide-y divide-white/5">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                {columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <td 
                      key={col.key} 
                      className={`p-6 ${col.key === 'id' ? "font-['Space_Grotesk'] text-zinc-500" : ""} ${col.isAmount ? "font-['Space_Grotesk'] font-medium" : ""} ${!col.isAmount && col.key !== 'id' && !col.isStatus ? "text-white font-medium" : ""}`}
                    >
                      {col.isStatus ? renderStatus(val) : val}
                    </td>
                  );
                })}
                <td className="p-6 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                  <button className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-zinc-500 font-['Space_Grotesk']">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
