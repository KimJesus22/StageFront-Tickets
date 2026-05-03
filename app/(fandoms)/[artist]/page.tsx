import type { Metadata } from "next";

type Params = Promise<{ artist: string }>;

const ARTISTS: Record<string, { name: string; description: string }> = {
  bts: {
    name: "BTS",
    description: "Bangtan Sonyeondan - La boyband más grande del mundo",
  },
  txt: {
    name: "TXT",
    description: "Tomorrow X Together - La nueva generación de K-Pop",
  },
  blackpink: {
    name: "BLACKPINK",
    description: "Las reinas del K-Pop con alcance global",
  },
  "twenty-one-pilots": {
    name: "Twenty One Pilots",
    description: "Dúo de rock alternativo con una base de fans apasionada",
  },
};

export async function generateStaticParams() {
  return Object.keys(ARTISTS).map((artist) => ({ artist }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { artist } = await params;
  const info = ARTISTS[artist];
  return {
    title: info
      ? `${info.name} | BiasPass Ticketing`
      : "Artista | BiasPass Ticketing",
    description: info?.description ?? "Página del artista",
  };
}

export default async function ArtistPage({ params }: { params: Params }) {
  const { artist } = await params;
  const info = ARTISTS[artist];

  if (!info) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-semibold">Artista no encontrado</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{info.name}</h1>
        <p className="mt-4 text-lg text-gray-600">{info.description}</p>
      </div>
    </main>
  );
}
