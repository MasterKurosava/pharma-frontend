import { authQueryKeys as sharedAuthQueryKeys } from "@/shared/api/query-keys";

export const authQueryKeys = {
  currentUser: sharedAuthQueryKeys.me(),
};
