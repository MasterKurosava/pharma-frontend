import { PageContainer } from "@/shared/ui/page-container";
import { DictionaryCrudSection } from "@/widgets/dictionaries/dictionary-crud-section";

export function CountriesPage() {
  return (
    <PageContainer>
      <DictionaryCrudSection resource="countries" />
    </PageContainer>
  );
}

