import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import LoadingButton from "../LoadingButton";
import { useReportCommentMutation } from "./reportComments/mutations";

export default function ReportCommentDialog({
  commentId,
  open,
  onClose,
}: {
  commentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useReportCommentMutation();

  function handleOpenChange(open: boolean) {
    if (!open || !mutation.isPending) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Comment?</DialogTitle>
          <DialogDescription>
            Are you sure you want to report this comment? Our moderators will review it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <LoadingButton
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => mutation.mutate(commentId, { onSuccess: onClose })}
          >
            Report
          </LoadingButton>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
