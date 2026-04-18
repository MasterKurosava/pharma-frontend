import { PageContainer } from "@/shared/ui/page-container";
import { DictionaryCrudSection } from "@/widgets/dictionaries/dictionary-crud-section";

export function StoragePlacesPage() {
  return (
    <PageContainer>
      <DictionaryCrudSection resource="storage-places" />
    </PageContainer>
  );
}
