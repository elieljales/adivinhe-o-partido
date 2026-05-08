import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, RefreshCw } from "lucide-react";

type Deputado = {
  id: number;
  nome: string;
  siglaPartido: string;
  urlFoto: string;
};

const IDEOLOGIA: Record<string, "esquerda" | "centro" | "direita"> = {
  PT: "esquerda", PSOL: "esquerda", PCdoB: "esquerda", PDT: "esquerda",
  PSB: "esquerda", PV: "esquerda", REDE: "esquerda",
  MDB: "centro", PSD: "centro", PSDB: "centro", CIDADANIA: "centro",
  SOLIDARIEDADE: "centro", AVANTE: "centro",
  PL: "direita", NOVO: "direita", PP: "direita", REPUBLICANOS: "direita",
  UNIÃO: "direita", PODE: "direita", PRD: "direita",
};

const PARTIDOS_POR_IDEOLOGIA = {
  esquerda: ["PT", "PSOL", "PCdoB", "PDT", "PSB", "PV", "REDE"],
  centro: ["MDB", "PSD", "PSDB", "CIDADANIA", "SOLIDARIEDADE", "AVANTE"],
  direita: ["PL", "NOVO", "PP", "REPUBLICANOS", "UNIÃO", "PODE", "PRD"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gerarOpcoes(correto: string): string[] {
  const ideologia = IDEOLOGIA[correto];
  let distratores: string[] = [];

  if (ideologia) {
    const mesmaIdeologia = PARTIDOS_POR_IDEOLOGIA[ideologia].filter((p) => p !== correto);
    const centroOuOutro =
      ideologia === "centro"
        ? [...PARTIDOS_POR_IDEOLOGIA.esquerda, ...PARTIDOS_POR_IDEOLOGIA.direita]
        : PARTIDOS_POR_IDEOLOGIA.centro;
    distratores = [...shuffle(mesmaIdeologia).slice(0, 2), ...shuffle(centroOuOutro).slice(0, 1)];
  } else {
    const todos = [
      ...PARTIDOS_POR_IDEOLOGIA.esquerda,
      ...PARTIDOS_POR_IDEOLOGIA.centro,
      ...PARTIDOS_POR_IDEOLOGIA.direita,
    ].filter((p) => p !== correto);
    distratores = shuffle(todos).slice(0, 3);
  }

  return shuffle([correto, ...distratores]);
}

export function QuizGame() {
  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [atual, setAtual] = useState<Deputado | null>(null);
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [recorde, setRecorde] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const sortear = useCallback((lista: Deputado[]) => {
    const elegiveis = lista.filter((d) => d.urlFoto && d.siglaPartido);
    if (elegiveis.length === 0) return;
    const dep = elegiveis[Math.floor(Math.random() * elegiveis.length)];
    setAtual(dep);
    setOpcoes(gerarOpcoes(dep.siglaPartido));
    setEscolha(null);
  }, []);

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true);
        // Buscar 3 páginas para ter ~300 deputados, depois sortear
        const paginas = await Promise.all(
          [1, 2, 3].map((p) =>
            fetch(
              `https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=100&pagina=${p}`,
            ).then((r) => r.json()),
          ),
        );
        const todos: Deputado[] = paginas.flatMap((d) => d.dados ?? []);
        const amostra = shuffle(todos).slice(0, 80);
        setDeputados(amostra);
        sortear(amostra);
      } catch (e) {
        setErro("Não foi possível carregar os deputados. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [sortear]);

  const responder = (partido: string) => {
    if (escolha) return;
    setEscolha(partido);
    setTotal((t) => t + 1);
    if (partido === atual?.siglaPartido) {
      setAcertos((a) => a + 1);
      setStreak((s) => {
        const novo = s + 1;
        setRecorde((r) => Math.max(r, novo));
        return novo;
      });
    } else {
      setStreak(0);
    }
  };

  const proximo = () => sortear(deputados);

  const corBotao = (partido: string) => {
    if (!escolha) return "outline" as const;
    if (partido === atual?.siglaPartido) return "success" as const;
    if (partido === escolha) return "danger" as const;
    return "outline" as const;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Quem é o Partido?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adivinhe o partido do deputado federal
          </p>
        </header>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatCard icon={<Flame className="h-4 w-4" />} label="Streak" value={streak} />
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Recorde" value={recorde} />
          <StatCard label="Acertos" value={`${acertos}/${total}`} />
        </div>

        <Card className="overflow-hidden p-0">
          {carregando ? (
            <div className="p-6">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="mt-4 h-6 w-3/4" />
            </div>
          ) : erro ? (
            <div className="p-6 text-center text-destructive">{erro}</div>
          ) : atual ? (
            <>
              <div className="bg-muted">
                <img
                  src={atual.urlFoto}
                  alt={`Foto do(a) deputado(a) ${atual.nome}`}
                  className="mx-auto aspect-[3/4] w-full max-w-xs object-cover"
                  loading="eager"
                />
              </div>
              <div className="p-5">
                <h2 className="text-center text-xl font-semibold">{atual.nome}</h2>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {opcoes.map((p) => {
                    const variant = corBotao(p);
                    return (
                      <Button
                        key={p}
                        onClick={() => responder(p)}
                        disabled={!!escolha}
                        variant="outline"
                        className={
                          "h-12 text-base font-semibold transition " +
                          (variant === "success"
                            ? "border-transparent bg-[var(--success)] text-[var(--success-foreground)] hover:bg-[var(--success)]"
                            : variant === "danger"
                            ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive"
                            : "")
                        }
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>

                {escolha && (
                  <div className="mt-5 text-center">
                    {escolha === atual.siglaPartido ? (
                      <p className="font-semibold text-[var(--success)]">Acertou! 🎉</p>
                    ) : (
                      <p className="font-semibold text-destructive">
                        Errou! Era <span className="underline">{atual.siglaPartido}</span>
                      </p>
                    )}
                    <Button onClick={proximo} className="mt-3 w-full" size="lg">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Próximo deputado
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </Card>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Dados: API da Câmara dos Deputados
        </footer>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-1 p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </Card>
  );
}