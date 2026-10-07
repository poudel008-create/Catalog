import { Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";

interface ZoomProps {
  zoom: number;
  setZoom: (zoom: number) => void;
}

const Zoom = ({ zoom, setZoom }: ZoomProps) => {
  const zoomOut = () => {
    setZoom(Math.max(50, zoom - 10));
  };

  const zoomIn = () => {
    setZoom(Math.min(200, zoom + 10));
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={zoomOut}
        title="Zoom Out"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span className="w-12 text-center text-sm font-medium">
        {zoom}%
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={zoomIn}
        title="Zoom In"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Zoom;