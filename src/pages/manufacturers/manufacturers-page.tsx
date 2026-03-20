import { PageContainer } from "@/shared/ui/page-container";
import { DictionaryCrudSection } from "@/widgets/dictionaries/dictionary-crud-section";

export function ManufacturersPage() {
  return (
    <PageContainer>
      <DictionaryCrudSection resource="manufacturers" />
    </PageContainer>
  );
}

