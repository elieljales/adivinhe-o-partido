import { createFileRoute } from "@tanstack/react-router";
import { QuizGame } from "@/components/QuizGame";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Quem é o Partido? - Quiz de Deputados Brasileiros" },
      { name: "description", content: "Adivinhe o partido político de deputados federais brasileiros neste quiz desafiador." },
    ],
  }),
});

function Index() {
  return <QuizGame />;
}
