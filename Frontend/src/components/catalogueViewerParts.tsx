import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

export type CataloguePage = {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  blank?: boolean;
  intro?: boolean;
  isCover?: boolean;
};

const PageImage = ({
  src,
  alt,
  eager,
}: {
  src: string;
  alt: string;
  eager: boolean;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const revealDecodedImage = (image: HTMLImageElement) => {
    image.decode().then(
      () => setLoaded(true),
      () => {
        if (image.naturalWidth > 0) setLoaded(true);
      }
    );
  };

  useEffect(() => {
    const image = imgRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      revealDecodedImage(image);
    }
  }, [src]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#fdf9f5] p-4 text-center text-sm text-gray-400">
        {alt}
      </div>
    );
  }

  return (
    <div className={`page-image-wrapper ${loaded ? "image-loaded" : ""}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        onLoad={(event) => revealDecodedImage(event.currentTarget)}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export const CataloguePageContent = ({
  page,
  cover,
  left,
  hingeBack,
  eager,
}: {
  page: CataloguePage;
  cover: boolean;
  left: boolean;
  hingeBack: boolean;
  eager: boolean;
}) => (
  <>
    {page.intro ? (
      <div className="cb-intro">
        <h2 className="cb-intro-title">{page.title}</h2>
        {page.description && (
          <p className="cb-intro-desc">{page.description}</p>
        )}
      </div>
    ) : page.blank ? (
      <div className="h-full w-full" />
    ) : page.imageUrl ? (
      <PageImage key={page.imageUrl} src={page.imageUrl} alt={page.title} eager={eager} />
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200">
        <p className="text-xl font-semibold text-gray-500">{page.title}</p>
        <p className="mt-1 text-sm text-gray-300">Page {page.id}</p>
      </div>
    )}

    {!cover && (
      <>
        <div
          aria-hidden
          className={`cb-gutter ${left ? "cb-gutter--left" : "cb-gutter--right"}`}
        />
        <div
          aria-hidden
          className={`cb-edge ${left ? "cb-edge--left" : "cb-edge--right"}`}
        />
      </>
    )}

    {cover && (
      <>
        <div
          aria-hidden
          className={`cb-hinge ${hingeBack ? "cb-hinge--back" : "cb-hinge--front"}`}
        />
        <div aria-hidden className="cb-gloss" />
      </>
    )}
  </>
);

export const CatalogueGrid = ({ pages }: { pages: CataloguePage[] }) => {
  const [lightboxPage, setLightboxPage] = useState<CataloguePage | null>(null);

  return (
    <div className="w-full max-w-6xl px-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setLightboxPage(page)}
            className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
          >
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={page.title}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">{page.title}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">
              Page {page.id}
            </div>
          </button>
        ))}
      </div>

      {lightboxPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPage(null)}
        >
          <button
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxPage(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxPage.imageUrl && (
            <img
              src={lightboxPage.imageUrl}
              alt={lightboxPage.title}
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export const CatalogueControls = ({
  label,
  currentPage,
  total,
  isFirstPage,
  isLastPage,
  isPortrait,
  isFullscreen,
  bookPages,
  onToggleFullscreen,
  onFirstPage,
  onLastPage,
  onSelectPage,
  children,
}: {
  label: string;
  currentPage: number;
  total: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  isPortrait: boolean;
  isFullscreen: boolean;
  bookPages: CataloguePage[];
  onToggleFullscreen: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onSelectPage: (index: number) => void;
  children: ReactNode;
}) => (
  <>
    <div className="flex items-center gap-2">
      <div className="rounded-full bg-background/80 px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
        {label} · {currentPage + 1} / {total}
      </div>
      <button
        onClick={onToggleFullscreen}
        aria-label="Toggle fullscreen"
        title="Fullscreen"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm transition hover:bg-muted"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
    </div>

    {children}

    <div className="flex w-full max-w-md items-center gap-2 px-4">
      <button
        onClick={onFirstPage}
        disabled={isFirstPage}
        aria-label="Go to first page"
        title="First page"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <input
        type="range"
        min={0}
        max={total - 1}
        value={currentPage}
        onChange={(e) => onSelectPage(Number(e.target.value))}
        aria-label="Jump to page"
        className="h-1 w-full cursor-pointer accent-primary"
      />
      <button
        onClick={onLastPage}
        disabled={isLastPage}
        aria-label="Go to last page"
        title="Last page"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>

    {bookPages.some((page) => page.imageUrl) && (
      <div className="flex w-full max-w-3xl gap-2 overflow-x-auto px-4 pb-2">
        {bookPages.map((page, index) => {
          const active =
            index === currentPage ||
            (!isPortrait && !isFirstPage && index === currentPage + 1);
          return (
            <button
              key={`thumb-${page.id}-${index}`}
              onClick={() => onSelectPage(index)}
              aria-label={`Go to page ${index + 1}`}
              className={`relative h-16 w-12 shrink-0 overflow-hidden rounded border bg-white transition ${
                active
                  ? "ring-2 ring-primary ring-offset-1"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {page.imageUrl && !page.blank ? (
                <img
                  src={page.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </button>
          );
        })}
      </div>
    )}
  </>
);
