import { useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CataloguePage = {
  id: number;
  title: string;
};

type CatalogueViewerProps = {
  pages: CataloguePage[];
};

const CatalogueViewer = ({ pages }: CatalogueViewerProps) => {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSound = useRef<HTMLAudioElement | null>(null);

if (!pageSound.current) {
  pageSound.current = new Audio("/sounds/page-flip.mp3");
}

  const getPageFlip = () => bookRef.current?.pageFlip?.();

  const nextPage = () => {
  pageSound.current!.currentTime = 0;
  pageSound.current!.play();
  getPageFlip()?.flipNext();
};

  const previousPage = () => {
  pageSound.current!.currentTime = 0;
  pageSound.current!.play();
  getPageFlip()?.flipPrev();
};

  const handleFlip = (event: { data: number }) => {
  setCurrentPage(event.data);
};
  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center">
      {/* BOOK AREA */}
      {/* PAGE NUMBER */}
      <div className="mt-6 text-gray-600 font-medium">
        {currentPage + 1}
        {currentPage + 2 <= pages.length && `–${currentPage + 2}`} of{" "}
        {pages.length}
      </div>
      <div className="flex items-center gap-6">
        {/* LEFT BUTTON */}
        <button
          onClick={previousPage}
          disabled={currentPage === 0}
          className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft size={30} />
        </button>

        {/* BOOK */}
        <HTMLFlipBook
          ref={(instance) => {
            bookRef.current = instance;
          }}
          className="catalogue-book"
          style={{}}
          width={350}
          height={500}
          size="fixed"
          startPage={0}
          minWidth={350}
          maxWidth={350}
          minHeight={500}
          maxHeight={500}
          usePortrait={false}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showCover={false}
          drawShadow={true}
          flippingTime={800}
          useMouseEvents={true}
          mobileScrollSupport={true}
          swipeDistance={30}
          clickEventForward={false}
          renderOnlyPageLengthChange={false}
          disableFlipByClick={false}
          onFlip={handleFlip}
          onChangeState={(e) => {
            if (e.data === "user_fold") {
              pageSound.currentTime = 0;
              pageSound.play();
            }
          }}
        >
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white h-full w-full flex items-center justify-center border border-gray-300"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-700">
                  {page.title}
                </h2>

                <p className="mt-2 text-gray-400">Catalogue Page {page.id}</p>
              </div>
            </div>
          ))}
        </HTMLFlipBook>

        {/* RIGHT BUTTON */}
        <button
          onClick={nextPage}
          disabled={currentPage >= pages.length - 1}
          className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight size={30} />
        </button>
      </div>

      
    </div>
  );
};

export default CatalogueViewer;
