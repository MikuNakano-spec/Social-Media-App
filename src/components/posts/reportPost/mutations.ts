import { useMutation } from "@tanstack/react-query";
import { reportPost } from "./actions";
import { useToast } from "@/components/ui/use-toast";

export function useReportPostMutation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: reportPost,
    onSuccess: () => {
      toast({
        description: "Post reported successfully",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: error.message || "Failed to report post. Please try again.",
      });
    },
  });

  return mutation;
}
