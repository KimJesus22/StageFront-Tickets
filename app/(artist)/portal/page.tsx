import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/actions/auth";
import { getArtistDashboardData } from "@/lib/actions/portal";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "Portal Artista — StageFront",
  description: "Dashboard premium para artistas y managers.",
};

export default async function ArtistPortalPage() {
  const sessionData = await getSession();
  
  // Protección de ruta a nivel página
  if (!sessionData?.user) {
    redirect("/login?redirect=/portal");
  }

  const role = sessionData.user.user_metadata?.role;
  const email = sessionData.user.email;
  // Si no es artista o manager, redirigimos al inicio
  if (role !== "artista" && role !== "manager" && email !== "jesus@top.com.mx") {
    redirect("/"); 
  }

  // Obtenemos el ID del artista desde los metadatos del usuario.
  // Si no está asignado, usamos el de Blackpink como fallback para fines de demostración.
  const artistId = sessionData.user.user_metadata?.artist_id || "1dbaaf0f-4b21-43c2-8dec-03d89356e04e";

  const data = await getArtistDashboardData(artistId);

  // Formateador de moneda
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Formateador de números (para boletos)
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Formateador de fecha
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex">
      {/* SideNavBar Component */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-30 bg-zinc-950/30 backdrop-blur-md border-b border-white/5">
          <div className="md:hidden">
            <h1 className="text-lg font-black text-white font-headline-md">
              Portal Artista
            </h1>
          </div>
          <div className="flex-1 hidden md:block">
            <h2 className="font-headline-md text-headline-md text-white">
              Bienvenido, {sessionData.user.user_metadata?.name || sessionData.user.email}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-zinc-500 hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined" data-icon="notifications">
                notifications
              </span>
            </button>
            <button className="text-zinc-500 hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined" data-icon="help">
                help
              </span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                alt="Artist Avatar"
                className="w-10 h-10 rounded-full object-cover border border-white/20"
                width={40}
                height={40}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0k3b6-dIhOg45cB91vzmTT98qiapENU_ZwhVsbI9gf95eXX92aSof4p6xwB7_0Sib8A8NZ2r7ld3liy3ssx2dqbKV68C2z-WuHVyo2jvUuVAjDQYtumPlsPaK0IRYkmroBOgwuzEnZlgOqOTJDFtRRsgwADc7fM8J6RMfQdrv2IYuHeELRyCg6EVa_eWYub_7BcFtt7TdnNd5RTUd2KKMy_luHGSn-gHVxJDLljE6wZcdzZlbCWCPd5fPb5yVfmnF4JqRxBGBjEM"
                unoptimized
              />
              <span className="font-label-caps text-label-caps text-white hidden sm:block">
                Perfil
              </span>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main className="p-margin-mobile md:p-margin-desktop flex-1 flex flex-col gap-stack-lg max-w-container-max mx-auto w-full">
          <div className="md:hidden">
            <h2 className="font-headline-md text-headline-md text-white">
              Bienvenido, {sessionData.user.user_metadata?.name || sessionData.user.email}
            </h2>
          </div>

          {/* KPI Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* KPI 1 */}
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-surface-tint">
                  Ingresos Totales
                </span>
                <span className="material-symbols-outlined text-surface-tint" data-icon="account_balance_wallet">
                  account_balance_wallet
                </span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-white tracking-tight">
                  {formatCurrency(data.totalIncome)}
                </div>
                <div className="flex items-center gap-1 mt-2 text-green-400 font-label-caps text-label-caps">
                  <span className="material-symbols-outlined text-[16px]" data-icon="trending_up">
                    trending_up
                  </span>
                  +12.5% vs mes anterior
                </div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-surface-tint">
                  Boletos Vendidos
                </span>
                <span className="material-symbols-outlined text-surface-tint" data-icon="confirmation_number">
                  confirmation_number
                </span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-white tracking-tight">
                  {formatNumber(data.soldTickets)}
                </div>
                <div className="flex items-center gap-1 mt-2 text-surface-tint font-label-caps text-label-caps">
                  {data.events.length} Eventos Activos
                </div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-surface-tint">
                  Status Global de Venta
                </span>
                <span className="material-symbols-outlined text-surface-tint" data-icon="local_fire_department">
                  local_fire_department
                </span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-white tracking-tight">
                  {data.soldPercentage}%
                </div>
                <div className="flex items-center gap-1 mt-2 text-surface-tint font-label-caps text-label-caps">
                  {data.availableTickets} boletos restantes
                </div>
              </div>
              {/* Progress Bar Mini */}
              <div className="w-full bg-surface-container-highest rounded-full h-1 mt-auto">
                <div
                  className="bg-orange-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${data.soldPercentage}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* Active Events Table Area */}
          <section className="flex flex-col gap-stack-sm">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-headline-md text-headline-md text-white">
                Eventos Activos
              </h3>
              <button className="font-label-caps text-label-caps text-surface-tint hover:text-white transition-colors">
                Ver Todos
              </button>
            </div>
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-6 font-label-caps text-label-caps text-surface-tint font-medium">
                        Fecha
                      </th>
                      <th className="py-4 px-6 font-label-caps text-label-caps text-surface-tint font-medium">
                        Recinto
                      </th>
                      <th className="py-4 px-6 font-label-caps text-label-caps text-surface-tint font-medium">
                        Estado de Ventas
                      </th>
                      <th className="py-4 px-6 font-label-caps text-label-caps text-surface-tint font-medium text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.events.map((event: any) => (
                      <tr key={event.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-body-md text-body-md text-white capitalize">
                            {formatDate(event.date)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-body-md text-body-md text-white">
                            {event.venue}
                          </div>
                          <div className="font-label-caps text-label-caps text-surface-tint mt-1">
                            {event.city}
                          </div>
                        </td>
                        <td className="py-4 px-6 w-1/3">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${event.soldPercentage}%` }}
                              ></div>
                            </div>
                            <span className="font-label-caps text-label-caps text-white w-12 text-right">
                              {event.soldPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="font-label-caps text-label-caps px-4 py-2 rounded border border-white/20 text-white hover:bg-white hover:text-black transition-all">
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}

                    {data.events.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500 font-body-md">
                          No tienes eventos activos en este momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
