import { Grid3X3 } from "lucide-react";
import { Button } from "../components/ui/button";

interface GridButtonProps {
  onClick: () => void;
}

const GridButton = ({ onClick }: GridButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title="Grid View"
    >
      <Grid3X3 className="h-5 w-5" />
    </Button>
  );
};

export default GridButton;