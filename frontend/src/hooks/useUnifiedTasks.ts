import { useQuery } from "@tanstack/react-query";
import { unifiedTasksApi, type UnifiedTasksParams } from "@/services/unified-tasks-api";
import { queryKeys } from "@/lib/query-keys";

export const useUnifiedTasks = (params: UnifiedTasksParams) =>
  useQuery({
    queryKey: queryKeys.unifiedTasks(params),
    queryFn: () => unifiedTasksApi.list(params),
    retry: 1,
    placeholderData: (prev) => prev,
  });
