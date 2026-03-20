import type { DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";
import { PageContainer } from "@/shared/ui/page-container";
import { DictionaryCrudSection } from "@/widgets/dictionaries/dictionary-crud-section";

type DictionaryResourcePageProps = {
  resource: DictionaryResourceName;
};

export function DictionaryResourcePage({ resource }: DictionaryResourcePageProps) {
  return (
    <PageContainer>
      <DictionaryCrudSection resource={resource} />
    </PageContainer>
  );
}

