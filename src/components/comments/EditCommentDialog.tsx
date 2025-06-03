import { useState } from "react";
import { CommentData } from "@/lib/types";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { useEditCommentMutation } from "./mutations";

interface EditCommentDialogProps {
  comment: CommentData;
  open: boolean;
  onClose: () => void;
}

export default function EditCommentDialog({
  comment,
  open,
  onClose,
}: EditCommentDialogProps) {
  const [content, setContent] = useState(comment.content);
  const mutation = useEditCommentMutation();

  function handleOpenChange(open: boolean) {
    if (!open || !mutation.isPending) {
      onClose();
    }
  }

  function handleSave() {
    mutation.mutate({ id: comment.id, content }, { onSuccess: onClose });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit comment</DialogTitle>
          <DialogDescription>Make your changes below</DialogDescription>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={mutation.isPending}
        />
        <DialogFooter>
          <LoadingButton onClick={handleSave} loading={mutation.isPending}>
            Save
          </LoadingButton>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
