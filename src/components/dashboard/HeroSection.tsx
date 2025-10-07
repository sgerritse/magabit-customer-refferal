import { Award, Star } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAnswerLogs } from "@/hooks/useAnswerLogs";
import { useUserProfile } from "@/hooks/useUserProfile";

export const HeroSection = () => {
  const { badges, totalPoints } = useUserStats();
  const { logs } = useAnswerLogs();
  const { data: userProfile } = useUserProfile();
  
  // Check if user is new (no points, badges, or logs)
  const isNewUser = totalPoints === 0 && badges.length === 0 && logs.length === 0;

  return (
    <section 
      className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center relative overflow-hidden"
      style={{
        backgroundColor: 'hsl(var(--hero-bg))',
        color: 'hsl(var(--hero-text))'
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-4 right-4 opacity-20">
        <Star className="w-12 h-12" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-20">
        <Award className="w-10 h-10" />
      </div>
      
      <div className="relative z-10">
        <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto px-2 mb-3 sm:mb-4">
          {userProfile?.first_name 
            ? `${userProfile.first_name}, your family is lucky to have a dad who shows up every day!`
            : "Your family is lucky to have a dad who shows up every day!"
          }
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
          {isNewUser ? "Welcome! 👋" : "Ready to make today count? 💪"}
        </h1>
      </div>
    </section>
  );
};
