"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const ModelEditor = dynamic(
  () => import("@/components/graphs/model-editor").then((module) => module.ModelEditor),
  {
    ssr: false,
    loading: () => <p className="px-6 py-10 text-sm text-ink-muted">Loading graph editor…</p>,
  },
);

export default function ModelEditorPage() {
  const params = useParams<{ modelId: string }>();
  return <ModelEditor modelId={params.modelId} />;
}
