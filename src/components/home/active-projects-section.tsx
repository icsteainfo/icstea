import { ProjectCard } from "@/components/projects/project-card";
import { HomeSection } from "./section";
import type { ProjectSummary } from "@/lib/projects/types";

export function ActiveProjectsSection({ projects }: { projects: ProjectSummary[] }) {
  return (
    <HomeSection
      title="📌 進行中プロジェクト"
      emptyMessage="現在、進行中のプロジェクトはありません"
      count={projects.length}
      tint="pink"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </HomeSection>
  );
}
