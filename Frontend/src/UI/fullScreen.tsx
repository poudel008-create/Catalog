import { Maximize, Minimize } from "lucide-react";
import { Button } from "../components/ui/button"

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onClick: () => void;
}

const FullscreenButton = ({
  isFullscreen,
  onClick,
}: FullscreenButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
    >
      {isFullscreen ? (
        <Minimize className="h-5 w-5" />
      ) : (
        <Maximize className="h-5 w-5" />
      )}
    </Button>
  );
};

export default FullscreenButton;