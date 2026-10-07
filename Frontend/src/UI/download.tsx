import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  fileUrl: string;
}

const DownloadButton = ({ fileUrl }: DownloadButtonProps) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "catalogue.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDownload}
      title="Download"
    >
      <Download className="h-5 w-5" />
    </Button>
  );
};

export default DownloadButton;