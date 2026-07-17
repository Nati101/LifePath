import { notFound } from "next/navigation";
import SectionFlow from "@/components/SectionFlow";
import { isValidSection, sectionOrder } from "@/data/instructions";
import type { SectionKey } from "@/lib/types";

export function generateStaticParams() {
  return sectionOrder.map((section) => ({ section }));
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!isValidSection(section)) {
    notFound();
  }

  return <SectionFlow section={section as SectionKey} />;
}
