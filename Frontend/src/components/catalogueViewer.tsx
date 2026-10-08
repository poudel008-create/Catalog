import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

type CataloguePage = {
  id: number;
  title: string;
  imageUrl?: string;
  blank?: boolean;
  isCover?: boolean;
};

type CatalogueViewerProps = {
  pages: CataloguePage[];
  zoom?: number;
  soundOn?: boolean;
  showGrid?: boolean;
};

const BASE_W = 350;
const BASE_H = 500;
const SHIFT_MS = 650;

const CatalogueViewer = ({
  pages,
  zoom = 100,
  soundOn = true,
  showGrid = false,
}: CatalogueViewerProps) => {
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pageSoundRef = useRef<HTMLAudioElement | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [lightboxPage, setLightboxPage] = useState<CataloguePage | null>(null);
  const [stageWidth, setStageWidth] = useState(1000);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bookPages = useMemo<CataloguePage[]>(() => {
    if (pages.length > 2 && pages.length % 2 === 1) {
      const copy = [...pages];
      copy.splice(copy.length - 1, 0, {
        id: -1,
        title: "",
        blank: true,
      });
      return copy;
    }
    return pages;
  }, [pages]);

  const total = bookPages.length;

  useEffect(() => {
    const audio = new Audio("/sounds/page-flip.mp3");
    audio.volume = 0.6;
    pageSoundRef.current = audio;
  }, []);

  const playSound = useCallback(() => {
    if (!soundOn) return;
    const audio = pageSoundRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      /* ignore autoplay restrictions */
    });
  }, [soundOn]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      setStageWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setStageWidth(el.clientWidth);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const isPortrait = stageWidth < 720;
  const scale = zoom / 100;

  // fit the book inside the available width
  const reservedSides = isPortrait ? 120 : 150;
  const maxPageW = isPortrait
    ? stageWidth - reservedSides
    : (stageWidth - reservedSides) / 2;

  const w = Math.max(
    140,
    Math.round(Math.min(BASE_W * scale, maxPageW))
  );
  const h = Math.round((w * BASE_H) / BASE_W);

  const getPageFlip = () => bookRef.current?.pageFlip?.();

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= total - 1;

  const nextPage = () => {
    if (isLastPage) return;
    // optimistic update so the book slides at the same time as the flip
    setCurrentPage((p) => Math.min(p === 0 ? 1 : p + 2, total - 1));
    getPageFlip()?.flipNext();
  };

  const previousPage = () => {
    if (isFirstPage) return;
    setCurrentPage((p) => Math.max(p <= 1 ? 0 : p - 2, 0));
    getPageFlip()?.flipPrev();
  };

  const goToFirstPage = () => getPageFlip()?.flip(0);
  const goToLastPage = () => getPageFlip()?.flip(total - 1);
  const goToPage = (index: number) => getPageFlip()?.flip(index);

  const handleFlip = (event: { data: number }) => {
    setCurrentPage(event.data);
    playSound(); // click, drag, swipe, buttons, keyboard – everything
  };

  // Keyboard
  useEffect(() => {
    if (showGrid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      else if (e.key === "ArrowLeft") previousPage();
      else if (e.key === "Home") goToFirstPage();
      else if (e.key === "End") goToLastPage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // --------------------------------
  // Empty state
  // --------------------------------
  if (!pages.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">No catalogue pages available.</p>
      </div>
    );
  }

  // --------------------------------
  // GRID VIEW
  // --------------------------------
  if (showGrid) {
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
                  <span className="text-xs text-muted-foreground">
                    {page.title}
                  </span>
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
  }

  // --------------------------------
  // FLIPBOOK VIEW
  // --------------------------------

  let shiftX = 0;
  if (!isPortrait) {
    if (isFirstPage) shiftX = -w / 2;
    else if (isLastPage) shiftX = w / 2;
  }

  const isOpenSpread = !isFirstPage && !isLastPage;

  const label = isFirstPage
    ? "Front cover"
    : isLastPage
    ? "Back cover"
    : isPortrait
    ? `Page ${currentPage + 1}`
    : `Pages ${currentPage + 1} – ${currentPage + 2}`;

  return (
    <div
      ref={stageRef}
      className={`flex w-full flex-col items-center gap-4 ${
        isFullscreen ? "justify-center bg-neutral-900 p-6" : ""
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-background/80 px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
          {label} · {currentPage + 1} / {total}
        </div>
        <button
          onClick={toggleFullscreen}
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

      {/* Book + side buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={previousPage}
          disabled={isFirstPage}
          aria-label="Previous page"
          title="Previous page"
          className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Stage: fixed size of an open book so layout never jumps */}
        <div
          className="relative"
          style={{
            width: isPortrait ? w : w * 2,
            height: h + 24,
          }}
        >
          {/* Sliding wrapper – this is what centres the covers */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: isPortrait ? w : w * 2,
              height: h,
              transform: `translateX(${shiftX}px)`,
              transition: `transform ${SHIFT_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1)`,
            }}
          >
            {/* Book shadow on the table */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 rounded-[50%] bg-black/30 blur-xl transition-all"
              style={{
                bottom: -18,
                height: 28,
                width: isOpenSpread || isPortrait ? "92%" : "50%",
                transform: "translateX(-50%)",
                transitionDuration: `${SHIFT_MS}ms`,
              }}
            />

            <div className="relative h-full w-full drop-shadow-2xl">
              <HTMLFlipBook
                // remount when the size/orientation changes, keep current page
                key={`${w}-${h}-${isPortrait}-${total}`}
                ref={(instance: any) => {
                  bookRef.current = instance;
                }}
                className="catalogue-book"
                style={{}}
                width={w}
                height={h}
                size="fixed"
                startPage={currentPage}
                minWidth={w}
                maxWidth={w}
                minHeight={h}
                maxHeight={h}
                usePortrait={isPortrait}
                startZIndex={0}
                autoSize={false}
                maxShadowOpacity={0.45}
                showCover={true}
                drawShadow={true}
                flippingTime={750}
                useMouseEvents={true}
                mobileScrollSupport={true}
                swipeDistance={30}
                clickEventForward={false}
                renderOnlyPageLengthChange={false}
                disableFlipByClick={false}
                onFlip={handleFlip}
              >
                {bookPages.map((page, index) => {
                  const isCover = page.isCover ?? (index === 0 || index === total - 1);
                  // with showCover: even index = right page, odd = left page
                  const isLeftPage = index % 2 === 1;

                  return (
                    <div
                      key={`${page.id}-${index}`}
                      // hard covers flip like real cardboard
                      data-density={isCover ? "hard" : "soft"}
                      className="relative h-full w-full overflow-hidden bg-white"
                    >
                      {page.blank ? (
                        <div className="h-full w-full bg-gradient-to-br from-white to-neutral-100" />
                      ) : page.imageUrl ? (
                        <img
                          src={page.imageUrl}
                          alt={page.title}
                          className="h-full w-full object-cover"
                          draggable={false}
                          loading={Math.abs(index - currentPage) < 6 ? "eager" : "lazy"}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200 bg-white">
                          <p className="text-xl font-semibold text-gray-500">
                            {page.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-300">
                            Page {page.id}
                          </p>
                        </div>
                      )}

                      {/* Paper curve near the spine (inner pages only) */}
                      {!isCover && (
                        <div
                          aria-hidden
                          className={`pointer-events-none absolute inset-y-0 w-12 ${
                            isLeftPage
                              ? "right-0 bg-gradient-to-l"
                              : "left-0 bg-gradient-to-r"
                          } from-black/25 via-black/5 to-transparent`}
                        />
                      )}

                      {/* Hard cover: spine hinge + soft gloss */}
                      {isCover && (
                        <>
                          <div
                            aria-hidden
                            className={`pointer-events-none absolute inset-y-0 w-3 ${
                              index === 0
                                ? "left-0 bg-gradient-to-r"
                                : "right-0 bg-gradient-to-l"
                            } from-black/35 to-transparent`}
                          />
                          <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </HTMLFlipBook>

              {/* Centre spine crease – only while the book is open */}
              {!isPortrait && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent transition-opacity"
                  style={{
                    opacity: isOpenSpread ? 1 : 0,
                    transitionDuration: `${SHIFT_MS}ms`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={nextPage}
          disabled={isLastPage}
          aria-label="Next page"
          title="Next page"
          className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom navigation */}
      <div className="flex w-full max-w-md items-center gap-2 px-4">
        <button
          onClick={goToFirstPage}
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
          onChange={(e) => goToPage(Number(e.target.value))}
          aria-label="Jump to page"
          className="h-1 w-full cursor-pointer accent-primary"
        />

        <button
          onClick={goToLastPage}
          disabled={isLastPage}
          aria-label="Go to last page"
          title="Last page"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {bookPages.some((p) => p.imageUrl) && (
        <div className="flex w-full max-w-3xl gap-2 overflow-x-auto px-4 pb-2">
          {bookPages.map((page, index) => {
            const active =
              index === currentPage ||
              (!isPortrait && !isFirstPage && index === currentPage + 1);
            return (
              <button
                key={`thumb-${page.id}-${index}`}
                onClick={() => goToPage(index)}
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
    </div>
  );
};

export default CatalogueViewer;
