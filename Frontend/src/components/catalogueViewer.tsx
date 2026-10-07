import { useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type CataloguePage = {
  id: number;
  title: string;
  imageUrl?: string;
};

type CatalogueViewerProps = {
  pages: CataloguePage[];
  zoom?: number;
  soundOn?: boolean;
  showGrid?: boolean;
};

const CatalogueViewer = ({
  pages,
  zoom = 100,
  soundOn = true,
  showGrid = false,
}: CatalogueViewerProps) => {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [lightboxPage, setLightboxPage] = useState<CataloguePage | null>(null);
  const pageSoundRef = useRef<HTMLAudioElement | null>(null);

  if (!pageSoundRef.current) {
    pageSoundRef.current = new Audio("/sounds/page-flip.mp3");
  }

  const playSound = () => {
    if (!soundOn) return;
    const audio = pageSoundRef.current!;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const getPageFlip = () => bookRef.current?.pageFlip?.();

  const nextPage = () => { playSound(); getPageFlip()?.flipNext(); };
  const previousPage = () => { playSound(); getPageFlip()?.flipPrev(); };

  const handleFlip = (event: { data: number }) => setCurrentPage(event.data);

  const scale = zoom / 100;
  const baseW = 350;
  const baseH = 500;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);

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

        {/* Lightbox */}
        {lightboxPage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxPage(null)}
          >
            <button
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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Page counter */}
      <div className="rounded-full bg-background/80 px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
        {currentPage + 1}
        {currentPage + 2 <= pages.length && `–${currentPage + 2}`} / {pages.length}
      </div>

      <div className="flex items-center gap-4">
        {/* Prev */}
        <button
          onClick={previousPage}
          disabled={currentPage === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Book */}
        <div style={{ width: w * 2, height: h }} className="drop-shadow-2xl">
          <HTMLFlipBook
            ref={(instance) => { bookRef.current = instance; }}
            className="catalogue-book"
            style={{}}
            width={w}
            height={h}
            size="fixed"
            startPage={0}
            minWidth={w}
            maxWidth={w}
            minHeight={h}
            maxHeight={h}
            usePortrait={false}
            startZIndex={0}
            autoSize={false}
            maxShadowOpacity={0.4}
            showCover={false}
            drawShadow={true}
            flippingTime={700}
            useMouseEvents={true}
            mobileScrollSupport={true}
            swipeDistance={30}
            clickEventForward={false}
            renderOnlyPageLengthChange={false}
            disableFlipByClick={false}
            onFlip={handleFlip}
            onChangeState={(e: any) => {
              if (e.data === "user_fold") playSound();
            }}
          >
            {pages.map((page) => (
              <div
                key={page.id}
                className="h-full w-full overflow-hidden bg-white"
              >
                {page.imageUrl ? (
                  <img
                    src={page.imageUrl}
                    alt={page.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200 bg-white">
                    <p className="text-xl font-semibold text-gray-500">{page.title}</p>
                    <p className="mt-1 text-sm text-gray-300">Page {page.id}</p>
                  </div>
                )}
              </div>
            ))}
          </HTMLFlipBook>
        </div>

        {/* Next */}
        <button
          onClick={nextPage}
          disabled={currentPage >= pages.length - 2}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default CatalogueViewer;
