import { redirect } from "next/navigation";

interface WorkspaceProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceProjectPage({ params }: WorkspaceProjectPageProps) {
  const { id } = await params;
  redirect(`/projects/${id}`);
}

