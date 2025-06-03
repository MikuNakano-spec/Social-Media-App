import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "../ui/button";
import ReportPostDialog from "./ReportPostDialog";
import { PostData } from "@/lib/types";

interface ReportPostButtonProps {
  post: PostData;
  className?: string;
}

export default function ReportPostButton({
  post,
  className,
}: ReportPostButtonProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className={`group-hover/post:text-red-500 ${className}`}
        onClick={() => setShowReportDialog(true)}
      >
        <Flag className="size-5 text-muted-foreground transition-colors group-hover/post:text-red-500" />
      </Button>

      <ReportPostDialog
        post={post}
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
      />
    </>
  );
}
