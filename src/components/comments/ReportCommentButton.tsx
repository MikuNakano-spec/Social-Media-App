import { useState } from "react";
import { Flag } from "lucide-react";
import ReportCommentDialog from "./ReportCommentDialog";

export default function ReportCommentButton({ commentId }: { commentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} title="Report Comment">
        <Flag className="w-4 h-4 text-muted-foreground hover:text-red-500" />
      </button>
      <ReportCommentDialog commentId={commentId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
