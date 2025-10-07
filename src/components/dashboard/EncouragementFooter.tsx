import { Heart } from "lucide-react";

export const EncouragementFooter = () => {
  return (
    <footer className="text-center py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-base sm:text-lg font-medium text-muted-foreground px-4">
        <Heart className="w-5 h-5 text-accent" />
        <span className="text-primary-foreground">Every day counts. Keep showing up.</span>
        <Heart className="w-5 h-5 text-accent" />
      </div>
    </footer>
  );
};