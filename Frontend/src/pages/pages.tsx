import { useEffect, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import CatalogueViewer from "../components/catalogueViewer";
import CatalogueToolbar from "./catalogToolbar";
import { fetchCatalogs, fetchCatalogPages, type Catalog, type CatalogPage } from "../services/catalogService";

const Pages = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Catalog | null>(null);
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [soundOn, setSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    fetchCatalogs()
      .then((data) => {
        setCatalogs(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .finally(() => setLoadingCatalogs(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingPages(true);
    fetchCatalogPages(selected._id)
      .then(setPages)
      .finally(() => setLoadingPages(false));
  }, [selected]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Map API pages to viewer format
  const viewerPages = pages
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((p) => ({ id: p.pageNumber, imageUrl: p.imageUrl, title: `Page ${p.pageNumber}` }));

  if (loadingCatalogs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BookOpen className="h-10 w-10 animate-pulse" />
          <p className="text-sm">Loading catalogues…</p>
        </div>
      </div>
    );
  }

  if (catalogs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12" />
          <p className="font-medium">No catalogues available</p>
          <p className="text-sm">Check back later or contact the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-bold">Catalogue Viewer</span>
          </div>

          {/* Catalogue selector */}
          {catalogs.length > 1 && (
            <div className="relative">
              <select
                className="h-8 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={selected?._id ?? ""}
                onChange={(e) => {
                  const cat = catalogs.find((c) => c._id === e.target.value);
                  if (cat) setSelected(cat);
                }}
              >
                {catalogs.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
        </div>
      </header>

      {/* Catalogue title */}
      {selected && (
        <div className="border-b bg-background/60 py-3 text-center">
          <h1 className="text-lg font-semibold">{selected.title}</h1>
          {selected.description && (
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          )}
        </div>
      )}

      {/* Viewer */}
      <div className="flex flex-1 items-center justify-center py-6">
        {loadingPages ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <BookOpen className="h-10 w-10 animate-pulse" />
            <p className="text-sm">Loading pages…</p>
          </div>
        ) : viewerPages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <BookOpen className="h-12 w-12" />
            <p className="font-medium">No pages in this catalogue</p>
          </div>
        ) : (
          <CatalogueViewer pages={viewerPages} zoom={zoom} soundOn={soundOn} showGrid={showGrid} />
        )}
      </div>

      {/* Toolbar */}
      {viewerPages.length > 0 && (
        <div className="flex justify-center pb-6">
          <CatalogueToolbar
            zoom={zoom}
            setZoom={setZoom}
            soundOn={soundOn}
            setSoundOn={setSoundOn}
            isFullscreen={isFullscreen}
            onFullscreen={handleFullscreen}
            onGrid={() => setShowGrid((v) => !v)}
            fileUrl={selected?.coverImage ?? ""}
          />
        </div>
      )}
    </div>
  );
};

export default Pages;
