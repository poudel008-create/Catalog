import { BookOpen } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <BookOpen className="h-12 w-12 text-muted-foreground" />

      <p className="text-6xl font-bold text-red-700">
        404
      </p>

      <p className="text-lg text-muted-foreground">
        Page not found
      </p>
    </div>
  );
};

export default NotFound;