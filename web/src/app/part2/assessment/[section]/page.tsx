import Part2AssessmentPageClient from "@/components/Part2AssessmentPageClient";

export function generateStaticParams() {
  return [
    { section: "school_setup" },
    { section: "training_style" },
    { section: "life_factors" },
    { section: "exploration" },
  ];
}

export default function Part2AssessmentSectionPage() {
  return <Part2AssessmentPageClient />;
}
