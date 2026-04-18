import { PageContainer } from "@/shared/ui/page-container";
import { DictionaryCrudSection } from "@/widgets/dictionaries/dictionary-crud-section";

export function ProductStoragePlacesPage() {
  return (
    <PageContainer>
      <DictionaryCrudSection resource="product-storage-places" />
    </PageContainer>
  );
}
