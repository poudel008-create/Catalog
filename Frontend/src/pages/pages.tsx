import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, BookMarked } from "lucide-react";
import CatalogueViewer from "../components/catalogueViewer";
import CatalogueToolbar from "./catalogToolbar";
import {fetchCatalogPages, fetchPublishedCatalogs,
  type Catalog,
  type CatalogPage, 
} from "../services/catalogService";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewerPage = {
  id: number;
  title: string;
  imageUrl?: string;
  isCover?: boolean;
};

// ─── Book Card ────────────────────────────────────────────────────────────────

const BookCard = ({
  catalog,
  onClick,
}: {
  catalog: Catalog;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-3 text-left focus:outline-none"
  >
    {/* Book spine + cover */}
    <div className="relative w-full">
      {/* Spine */}
      <div className="absolute bottom-0 left-0 top-0 w-3 rounded-l-sm bg-black/20" />

      {/* Cover */}
      <div
        className="relative ml-2 overflow-hidden rounded-r-md shadow-md transition-all duration-300
          group-hover:-translate-y-1 group-hover:shadow-xl group-focus-visible:-translate-y-1"
        style={{ aspectRatio: "3/4" }}
      >
        {catalog.coverImage ? (
          <img
            src={catalog.coverImage}
            alt={catalog.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-200 to-neutral-300 p-4">
            <BookMarked className="h-10 w-10 text-neutral-400" />
            <span className="text-center text-xs font-medium text-neutral-500 leading-snug">
              {catalog.title}
            </span>
          </div>
        )}

        {/* Gloss overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />

        {/* Hover: "Open" label */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Open
          </span>
        </div>
      </div>
    </div>

    {/* Title + description */}
    <div className="w-full px-1">
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
        {catalog.title}
      </p>
      {catalog.description && (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {catalog.description}
        </p>
      )}
    </div>
  </button>
);

// ─── Library View ─────────────────────────────────────────────────────────────

const LibraryView = ({
  catalogs,
  onSelect,
}: {
  catalogs: Catalog[];
  onSelect: (c: Catalog) => void;
}) => (
  <div className="mx-auto w-full max-w-6xl px-6 py-10">
    {/* Header */}
    <div className="mb-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-none">Catalogue Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {catalogs.length} catalogue{catalogs.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {catalogs.map((cat) => (
        <BookCard key={cat._id} catalog={cat} onClick={() => onSelect(cat)} />
      ))}
    </div>
  </div>
);

// ─── Flipbook View ────────────────────────────────────────────────────────────

const FlipbookView = ({
  catalog,
  pages,
  loading,
  onBack,
}: {
  catalog: Catalog;
  pages: ViewerPage[];
  loading: boolean;
  onBack: () => void;
}) => {
  const [zoom, setZoom] = useState(100);
  const [soundOn, setSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state with browser
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div ref={stageRef} className="flex min-h-screen flex-col bg-muted/30">
      {/* Top bar */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm transition hover:bg-muted"
            title="Back to library"
            aria-label="Back to library"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none">
                {catalog.title}
              </p>
              {catalog.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {catalog.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Viewer area */}
      <div className="flex flex-1 flex-col items-center justify-start overflow-auto py-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-muted-foreground">
            <BookOpen className="h-10 w-10 animate-pulse" />
            <p className="text-sm">Loading pages…</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-muted-foreground">
            <BookOpen className="h-12 w-12" />
            <p className="font-medium">No pages in this catalogue yet</p>
          </div>
        ) : (
          <CatalogueViewer
            pages={pages}
            zoom={zoom}
            soundOn={soundOn}
            showGrid={showGrid}
          />
        )}
      </div>

      {/* Toolbar */}
      {!loading && pages.length > 0 && (
        <div className="shrink-0 flex justify-center pb-6 pt-2">
          <CatalogueToolbar
            zoom={zoom}
            setZoom={setZoom}
            soundOn={soundOn}
            setSoundOn={setSoundOn}
            isFullscreen={isFullscreen}
            onFullscreen={handleFullscreen}
            onGrid={() => setShowGrid((v) => !v)}
            fileUrl={catalog.coverImage ?? ""}
          />
        </div>
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const Pages = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Catalog | null>(null);
  const [viewerPages, setViewerPages] = useState<ViewerPage[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);

  // Fetch published catalogue list once
  useEffect(() => {
    fetchPublishedCatalogs()
      .then(setCatalogs)
      .catch(() => setCatalogs([]))
      .finally(() => setLoadingCatalogs(false));
  }, []);

  // When a catalogue is selected, fetch its pages and build the viewer array
  const handleSelect = async (cat: Catalog) => {
    setSelected(cat);
    setLoadingPages(true);
    setViewerPages([]);

    try {
      const raw: CatalogPage[] = await fetchCatalogPages(cat._id);
      const sorted = [...raw].sort((a, b) => a.pageNumber - b.pageNumber);

      const built: ViewerPage[] = [];

      // Page 0 — front cover (always present; uses coverImage or placeholder)
      built.push({
        id: 0,
        title: cat.title,
        imageUrl: cat.coverImage,
        isCover: true,
      });

      // Inner pages
      sorted.forEach((p, i) => {
        built.push({
          id: i + 1,
          title: `Page ${p.pageNumber}`,
          imageUrl: p.imageUrl,
        });
      });

      // Last page — back cover (mirrors the front cover image, or plain)
      built.push({
        id: built.length,
        title: `${cat.title} — Back`,
        imageUrl: cat.coverImage,
        isCover: true,
      });

      setViewerPages(built);
    } catch {
      setViewerPages([]);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleBack = () => {
    setSelected(null);
    setViewerPages([]);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Empty state ────────────────────────────────────────────────────────────
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

  // ── Flipbook view ──────────────────────────────────────────────────────────
  if (selected) {
    return (
      <FlipbookView
        catalog={selected}
        pages={viewerPages}
        loading={loadingPages}
        onBack={handleBack}
      />
    );
  }

  // ── Library view ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30">
      <LibraryView catalogs={catalogs} onSelect={handleSelect} />
    </div>
  );
};

export default Pages;
