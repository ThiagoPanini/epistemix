// Modelo de domínio do catálogo materializado em TypeScript (ADR-0015 + ADR-0018).
// Na Fase 1 o catálogo é MDX-native: estes tipos são derivados de `content/`
// pelo content source (adapter de filesystem), não de uma API.

export type SectionKind = "direct" | "with_sources";

export interface Section {
  slug: string;
  title: string;
  kind: SectionKind;
  order: number;
  description: string;
}

export type StudyStatus = "ongoing" | "concluded";

export interface Source {
  slug: string;
  sectionSlug: string;
  name: string;
  externalUrl: string;
  author: string;
  description: string;
  cover?: string;
  authorAvatar?: string;
  studyStatus?: StudyStatus;
  startedAt?: string;
  lastActivity?: string;
  detail?: string;
}

export interface NowLearningItem {
  kind: "source";
  sectionSlug: string;
  sourceSlug: string;
  href: string;
  title: string;
  sectionLabel: string;
  detail?: string;
  lastActivity: string;
}

export type TimelineEventType = "publication" | "note" | "lecture" | "start" | "conquest";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  year: string;
  label: string;
  detail: string;
  href: string;
  hot: boolean;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  tagCount: number;
  artifactCount: number;
}

export type KnowledgeGraphNode = KnowledgeGraphTagNode | KnowledgeGraphArtifactNode;

export interface KnowledgeGraphTagNode {
  kind: "tag";
  id: string;
  slug: string;
  label: string;
  x: number;
  y: number;
}

export interface KnowledgeGraphArtifactNode {
  kind: "artifact";
  id: string;
  slug: string;
  sectionSlug: string;
  sourceSlug: string;
  label: string;
  href: string;
  x: number;
  y: number;
  radius: number;
  reads: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface Tag {
  slug: string;
  label: string;
}

export type PostStatus = "draft" | "published";

export interface Post {
  slug: string;
  sectionSlug: string;
  sourceSlug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  status: PostStatus;
  tags: string[];
  summary: string;
  body: string; // prosa MDX crua, renderizada na rota
}

export interface PresentationSlide {
  order: number;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
}

export interface Presentation {
  slug: string;
  sectionSlug: "presentations";
  title: string;
  date: string;
  status: PostStatus;
  tags: string[];
  summary: string;
  slides: PresentationSlide[];
}
