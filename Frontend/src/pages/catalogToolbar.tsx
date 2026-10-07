import { Separator } from "../components/ui/separator";
import GridButton from "../UI/grid";
import DownloadButton from "../UI/download";
import Zoom from "../UI/sound";
import SoundButton from "../UI/sound";
import FullscreenButton from "../UI/fullScreen";

interface CatalogueToolbarProps {
  zoom: number;
  setZoom: (zoom: number) => void;

  soundOn: boolean;
  setSoundOn: (value: boolean) => void;

  isFullscreen: boolean;
  onFullscreen: () => void;

  onGrid: () => void;

  fileUrl: string;
}

const CatalogueToolbar = ({
  zoom,
  setZoom,
  soundOn,
  setSoundOn,
  isFullscreen,
  onFullscreen,
  onGrid,
  fileUrl,
}: CatalogueToolbarProps) => {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">

      <GridButton onClick={onGrid} />

      <DownloadButton fileUrl={fileUrl} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Zoom
        zoom={zoom}
        setZoom={setZoom}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <SoundButton
        soundOn={soundOn}
        setSoundOn={setSoundOn}
      />

      <FullscreenButton
        isFullscreen={isFullscreen}
        onClick={onFullscreen}
      />

    </div>
  );
};

export default CatalogueToolbar;