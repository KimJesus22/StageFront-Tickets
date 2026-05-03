import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 w-full py-12 border-t border-white/5 mt-auto font-headline-md text-sm uppercase tracking-widest text-zinc-400">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 w-full gap-8 max-w-container-max mx-auto">
        <div className="text-lg font-black text-white">
          StageFront Tickets
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <Link
            href="/privacy"
            className="text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Política de Privacidad
          </Link>
          <Link
            href="/terms"
            className="text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Términos de Servicio
          </Link>
          <Link
            href="#"
            className="text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Portal de Artistas
          </Link>
          <Link
            href="#"
            className="text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Soporte
          </Link>
        </div>
        <div className="text-zinc-500 text-xs tracking-normal text-center md:text-right">
          © 2026 StageFront Tickets. <br className="md:hidden" />
          Desarrollada por el CEO KimJesus 21. <br className="md:hidden" />
          Sede en Celaya, Guanajuato, México.
        </div>
      </div>
    </footer>
  );
}
