import { PageContainer } from "@/shared/ui/page-container";
import { DictionaryCrudSection } from "@/widgets/dictionaries/dictionary-crud-section";

export function ActiveSubstancesPage() {
  return (
    <PageContainer>
      <DictionaryCrudSection resource="active-substances" />
    </PageContainer>
  );
}

