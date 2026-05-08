import { createFileRoute } from "@tanstack/react-router";
import { QuizGame } from "@/components/QuizGame";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <QuizGame />;
}
