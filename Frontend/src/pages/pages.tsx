import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, BookMarked, ChevronRight, FolderOpen } from "lucide-react";
import CatalogueViewer from "../components/catalogueViewer";
import CatalogueToolbar from "./catalogToolbar";
import { fetchPublishedCatalogs, fetchCatalogPages, type Catalog, type CatalogPage } from "../services/catalogService";
import { fetchCategories, type Category } from "../services/categoryService";
import { fetchSubCategories, type SubCategory } from "../services/subCategoryService";

// ─── Viewer page type ─────────────────────────────────────────────────────────

type ViewerPage = {
  id: number;
  title: string;
  imageUrl?: string;
  isCover?: boolean;
};

// ─── Book Card ────────────────────────────────────────────────────────────────

const BookCard = ({
  catalog,
  categoryName,
  subCategoryName,
  onClick,
}: {
  catalog: Catalog;
  categoryName: string;
  subCategoryName: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col gap-3 text-left focus:outline-none w-full"
  >
    {/* Book spine + cover */}
    <div className="relative w-full">
      <div className="absolute bottom-0 left-0 top-0 w-3 rounded-l-sm bg-black/20" />
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Open
          </span>
        </div>
      </div>
    </div>

    {/* Meta */}
    <div className="w-full space-y-1 px-1">
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
        {catalog.title}
      </p>
      {catalog.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {catalog.description}
        </p>
      )}
      {/* Category / subcategory badges */}
      <div className="flex flex-wrap gap-1 pt-0.5">
        {categoryName && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {categoryName}
          </span>
        )}
        {subCategoryName && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {subCategoryName}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ─── Library View ─────────────────────────────────────────────────────────────

const LibraryView = ({
  catalogs,
  categories,
  subCategories,
  onSelect,
}: {
  catalogs: Catalog[];
  categories: Category[];
  subCategories: SubCategory[];
  onSelect: (c: Catalog) => void;
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);

  // Build lookup maps: id → name
  const catMap = new Map(categories.map((c) => [c._id, c.name]));
  const subMap = new Map(subCategories.map((s) => [s._id, s.name]));

  // Subcategories that belong to the selected category
  const visibleSubs = activeCategoryId
    ? subCategories.filter((s) => s.category._id === activeCategoryId)
    : [];

  // Reset subcategory when category changes
  const handleCategoryClick = (id: string) => {
    if (activeCategoryId === id) {
      setActiveCategoryId(null);
      setActiveSubCategoryId(null);
    } else {
      setActiveCategoryId(id);
      setActiveSubCategoryId(null);
    }
  };

  const handleSubCategoryClick = (id: string) => {
    setActiveSubCategoryId(activeSubCategoryId === id ? null : id);
  };

  // Filter catalogues
  const filtered = catalogs.filter((cat) => {
    if (activeCategoryId && cat.category !== activeCategoryId) return false;
    if (activeSubCategoryId && cat.subCategory !== activeSubCategoryId) return false;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">

      {/* ── Page header ── */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-none">Catalogue Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filtered.length} catalogue{filtered.length !== 1 ? "s" : ""}
            {(activeCategoryId || activeSubCategoryId) ? " found" : " available"}
          </p>
        </div>
      </div>

      {/* ── Category filter ── */}
      {categories.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Categories
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = activeCategoryId === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryClick(cat._id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {cat.name}
                  {cat.subCategoryCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {cat.subCategoryCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Subcategory filter (only when a category is selected) ── */}
      {activeCategoryId && visibleSubs.length > 0 && (
        <section className="mb-8">
          {/* Breadcrumb divider */}
          <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold uppercase tracking-wide">
              Sub-Categories
            </span>
            <span className="text-xs">
              — {catMap.get(activeCategoryId)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleSubs.map((sub) => {
              const active = activeSubCategoryId === sub._id;
              return (
                <button
                  key={sub._id}
                  onClick={() => handleSubCategoryClick(sub._id)}
                  className={`inline-flex items-center rounded-full border px-3.5 py-1 text-sm transition-colors ${
                    active
                      ? "border-foreground/30 bg-foreground text-background shadow-sm"
                      : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Divider ── */}
      <div className="mb-6 border-t" />

      {/* ── Book grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12" />
          <p className="font-medium">No catalogues found</p>
          <p className="text-sm">Try selecting a different category or sub-category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((cat) => (
            <BookCard
              key={cat._id}
              catalog={cat}
              categoryName={cat.category ? (catMap.get(cat.category) ?? "") : ""}
              subCategoryName={cat.subCategory ? (subMap.get(cat.subCategory) ?? "") : ""}
              onClick={() => onSelect(cat)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Flipbook View (unchanged) ────────────────────────────────────────────────

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
              <p className="truncate text-sm font-semibold leading-none">{catalog.title}</p>
              {catalog.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{catalog.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full min-w-0 flex-1 flex-col items-stretch justify-start overflow-auto py-6">
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
            title={catalog.title}
            description={catalog.description}
            zoom={zoom}
            soundOn={soundOn}
            showGrid={showGrid}
          />
        )}
      </div>

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selected, setSelected] = useState<Catalog | null>(null);
  const [viewerPages, setViewerPages] = useState<ViewerPage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);

  // Fetch all data in parallel on mount
  useEffect(() => {
    Promise.all([
      fetchPublishedCatalogs(),
      fetchCategories(),
      fetchSubCategories(),
    ])
      .then(([cats, catList, subList]) => {
        setCatalogs(cats);
        setCategories(catList);
        setSubCategories(subList);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handleSelect = async (cat: Catalog) => {
    setSelected(cat);
    setLoadingPages(true);
    setViewerPages([]);
    try {
      const raw: CatalogPage[] = await fetchCatalogPages(cat._id);
      const sorted = [...raw].sort((a, b) => a.pageNumber - b.pageNumber);
      const built: ViewerPage[] = [];
      built.push({ id: 0, title: cat.title, imageUrl: cat.coverImage, isCover: true });
      sorted.forEach((p, i) => {
        built.push({ id: i + 1, title: `Page ${p.pageNumber}`, imageUrl: p.imageUrl });
      });
      built.push({ id: built.length, title: `${cat.title} — Back`, imageUrl: cat.coverImage, isCover: true });
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

  if (loadingData) {
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
          <p className="text-sm">Check back later.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-muted/30">
      <LibraryView
        catalogs={catalogs}
        categories={categories}
        subCategories={subCategories}
        onSelect={handleSelect}
      />
    </div>
  );
};

export default Pages;
