import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { reportComment } from "./action";

export function useReportCommentMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: reportComment,
    onSuccess: () => {
      toast({ description: "Comment reported successfully." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description:
          error instanceof Error
            ? error.message
            : "Failed to report comment. Please try again.",
      });
    },
  });
}
