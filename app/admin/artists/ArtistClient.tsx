"use client";

import { useState, useOptimistic, useTransition } from "react";
import type { Artist } from "@/lib/types/database";
import { toggleArtistStatus, createArtist, updateArtist } from "@/lib/actions/artists";

export default function ArtistClient({ initialArtists }: { initialArtists: Artist[] }) {
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

  // Optimistic UI para el estado del artista
  const [optimisticArtists, toggleOptimisticArtist] = useOptimistic(
    initialArtists,
    (state, artistId: string) =>
      state.map((artist) =>
        artist.id === artistId ? { ...artist, is_active: !artist.is_active } : artist
      )
  );

  const handleToggle = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      // 1. Mutar la UI instantáneamente
      toggleOptimisticArtist(id);
      
      // 2. Esperar al backend
      const res = await toggleArtistStatus(id, currentStatus);
      if (!res.success) {
        setToastMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleFormAction = async (formData: FormData) => {
    const isEdit = !!editingArtist;
    
    // Server action
    const res = isEdit 
      ? await updateArtist(editingArtist.id, formData)
      : await createArtist(formData);

    if (res.success) {
      setToastMessage({ type: "success", text: res.message });
      setIsSlideOpen(false);
      setEditingArtist(null);
    } else {
      setToastMessage({ type: "error", text: res.message });
    }
  };

  const openNewArtistForm = () => {
    setEditingArtist(null);
    setIsSlideOpen(true);
  };

  const openEditArtistForm = (artist: Artist) => {
    setEditingArtist(artist);
    setIsSlideOpen(true);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
        <div>
          <h2 className="font-headline-lg text-[32px] font-bold text-white mb-2">Gestión de Artistas</h2>
          <p className="font-body-md text-zinc-400">Manage your exclusive artist roster, update profiles, and control active status.</p>
        </div>
        <button 
          onClick={openNewArtistForm}
          className="bg-white text-black font-headline-md text-sm font-bold px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          Agregar Artista
        </button>
      </div>

      {toastMessage && (
        <div className={`mb-6 p-4 rounded-lg font-body-md text-sm ${toastMessage.type === "error" ? "bg-error/10 text-error border border-error/20" : "bg-green-500/10 text-neon-green border border-green-500/20"}`}>
          {toastMessage.text}
        </div>
      )}

      {/* Artist Table (Glassmorphism List) */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-label-caps text-xs uppercase tracking-wider">
                <th className="p-6 font-medium">Artist</th>
                <th className="p-6 font-medium hidden sm:table-cell">Description</th>
                <th className="p-6 font-medium">Status</th>
                <th className="p-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {optimisticArtists.map((artist) => (
                <tr key={artist.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-surface-container-high flex-shrink-0">
                        {artist.image_url ? (
                          <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <span className="material-symbols-outlined text-zinc-500">person</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-headline-md text-base font-bold text-white group-hover:text-primary transition-colors">{artist.name}</div>
                        <div className="font-body-md text-sm text-zinc-500">Artist ID: {artist.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 hidden sm:table-cell w-1/3">
                    <p className="font-body-md text-sm text-zinc-400 line-clamp-2">{artist.description || "Sin descripción disponible."}</p>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => handleToggle(artist.id, artist.is_active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-caps text-xs border transition-colors ${
                        artist.is_active 
                          ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_12px_rgba(74,222,128,0.4)]" 
                          : "bg-zinc-800/50 text-zinc-400 border-white/5"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${artist.is_active ? "bg-green-400 animate-pulse" : "bg-zinc-500"}`}></span>
                      {artist.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditArtistForm(artist)} className="text-zinc-400 hover:text-white transition-colors p-1" title="Edit">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button className="text-zinc-400 hover:text-red-400 transition-colors p-1" title="Delete">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {optimisticArtists.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 font-body-md">
                    No hay artistas registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Panel */}
      {isSlideOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="bg-[#141313]/95 backdrop-blur-[40px] border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="font-headline-md text-[24px] font-bold text-white">
                {editingArtist ? "Editar Artista" : "Agregar Artista"}
              </h3>
              <button onClick={() => setIsSlideOpen(false)} className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form action={handleFormAction} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-2">
                  <label className="block font-label-caps text-xs text-zinc-400 uppercase tracking-widest">Nombre del Artista</label>
                  <input 
                    name="name" 
                    defaultValue={editingArtist?.name || ""} 
                    required
                    className="w-full bg-white/5 border-b border-white/10 focus:border-white focus:outline-none text-white font-headline-md text-lg px-2 py-3 transition-colors placeholder:text-zinc-600 rounded-none h-12" 
                    placeholder="e.g., Anyma" 
                    type="text" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-label-caps text-xs text-zinc-400 uppercase tracking-widest">URL de la Imagen</label>
                  <div className="flex gap-4 items-end">
                    <div className="w-16 h-16 rounded-lg border border-white/10 bg-[#1c1b1b] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <span className="material-symbols-outlined text-zinc-600 text-2xl">image</span>
                    </div>
                    <input 
                      name="image_url" 
                      defaultValue={editingArtist?.image_url || ""} 
                      required
                      className="flex-1 bg-white/5 border-b border-white/10 focus:border-white focus:outline-none text-white font-body-md px-2 py-3 transition-colors placeholder:text-zinc-600 rounded-none h-12" 
                      placeholder="https://" 
                      type="url" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label-caps text-xs text-zinc-400 uppercase tracking-widest">Biografía / Descripción</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingArtist?.description || ""} 
                    className="w-full bg-white/5 border border-white/10 focus:border-white focus:outline-none text-zinc-300 font-body-md p-4 transition-colors placeholder:text-zinc-600 rounded-lg resize-none" 
                    placeholder="Enter artist biography..." 
                    rows={4}
                  ></textarea>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-headline-md text-sm font-bold text-white">Estado del Artista</label>
                      <p className="font-body-md text-xs text-zinc-500 mt-1">Activating makes the artist visible on the frontend.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="is_active" 
                        value="true" 
                        defaultChecked={editingArtist ? editingArtist.is_active : true}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-[#353434] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500/20 border border-white/10 peer-checked:border-green-500/30"></div>
                      <span className="ml-3 font-label-caps text-xs text-green-400 tracking-widest uppercase">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-[#141313] flex justify-end gap-4">
                <button type="button" onClick={() => setIsSlideOpen(false)} className="px-6 py-2.5 rounded-lg font-headline-md text-sm font-medium text-white border border-white/10 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg font-headline-md text-sm font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50">
                  {isPending ? "Guardando..." : "Guardar Artista"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
