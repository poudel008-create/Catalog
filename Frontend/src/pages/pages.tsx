import CatalogueViewer from "../components/catalogueViewer";
import CatalogueToolbar from "./catalogToolbar";

const Pages = () => {
  const pages = [
    { id: 1, title: "Page 1" },
    { id: 2, title: "Page 2" },
    { id: 3, title: "Page 3" },
    { id: 4, title: "Page 4" },
    { id: 5, title: "Page 5" },
    { id: 6, title: "Page 6" },
    { id: 7, title: "Page 7" },
    { id: 8, title: "Page 8" },
    { id: 9, title: "Page 9" },
    { id: 10, title: "Page 10" },
    { id: 11, title: "Page 11" },
    { id: 12, title: "Page 12" },
    { id: 13, title: "Page 13" },
    { id: 14, title: "Page 14" },
    { id: 15, title: "Page 15" },
    { id: 16, title: "Page 16" },
    { id: 17, title: "Page 17" },
    { id: 18, title: "Page 18" },
    { id: 19, title: "Page 19" },
    { id: 20, title: "Page 20" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Catalogue */}
      <div className="flex-1 flex items-center justify-center">
        <CatalogueViewer pages={pages} />
      </div>

      {/* Bottom Toolbar */}
      <div className="flex justify-center pb-6">
        <CatalogueToolbar
          zoom={100}
          setZoom={() => {}}
          soundOn={true}
          setSoundOn={() => {}}
          isFullscreen={false}
          onFullscreen={() => {}}
          onGrid={() => {}}
          fileUrl="/catalogue.pdf"
        />
      </div>

    </div>
  );
};

export default Pages;