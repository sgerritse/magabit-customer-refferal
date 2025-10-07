import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, Circle, Plus, Minus, ArrowRight, Play } from "lucide-react";
import * as Icons from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingSteps } from "@/hooks/useOnboardingSteps";
interface OnboardingItemProps {
  completed: boolean;
  title: string;
  description: string;
  icon: string;
  stepNumber: number;
  enableVideoUrl?: boolean;
  videoUrl?: string;
  onActionClick: () => void;
}
const OnboardingItem = ({
  completed,
  title,
  description,
  icon,
  stepNumber,
  enableVideoUrl,
  onActionClick
}: OnboardingItemProps) => {
  const IconComponent = (Icons as any)[icon] || Icons.CheckCircle;
  const showButton = enableVideoUrl;
  return <div className="group relative flex items-start gap-4 p-4 rounded-xl transition-all border border-border bg-zinc-50">
      {/* Step Number & Status */}
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${completed ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/20' : 'bg-primary border-2 border-primary'}`}>
          {completed ? <CheckCircle2 className="w-6 h-6 text-white" /> : <span className="text-lg font-bold text-white">{stepNumber}</span>}
        </div>
        {/* Connection line to next item */}
        <div className="absolute top-12 left-6 w-0.5 h-8 bg-border" />
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg transition-all bg-muted/15">
            <IconComponent className="w-5 h-5 text-primary" />
          </div>
          <h3 className={`text-lg font-semibold transition-all ${completed ? 'text-card-foreground' : 'text-card-foreground'}`}>
            {title}
          </h3>
        </div>
        <p className="text-sm ml-14 text-card-foreground">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {showButton && !completed && <div className="flex items-center">
          <Button onClick={onActionClick} className="bg-accent hover:bg-accent/90 text-white" size="sm">
            {enableVideoUrl ? <>
                <Play className="h-4 w-4 mr-2" />
                Watch Video
              </> : "Learn More"}
          </Button>
        </div>}

      {/* Completed Badge */}
      {completed && <div className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
          Completed
        </div>}
    </div>;
};
const VideoDialog = ({
  videoUrl,
  ctaButtons = [],
  stepId,
  open,
  onOpenChange,
  onMarkComplete
}: {
  videoUrl: string;
  ctaButtons?: Array<{
    text: string;
    url: string;
    url_type: "internal" | "external" | "mark_complete";
    open_in_new_window?: boolean;
    color?: string;
  }>;
  stepId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkComplete: () => void;
}) => {
  const navigate = useNavigate();

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const videoId = getYouTubeId(videoUrl);
  const handleButtonClick = (button: {
    text: string;
    url: string;
    url_type: "internal" | "external" | "mark_complete";
    open_in_new_window?: boolean;
    color?: string;
  }) => {
    if (button.url_type === "mark_complete") {
      onMarkComplete();
      onOpenChange(false);
    } else if (button.url_type === "external") {
      if (button.open_in_new_window) {
        window.open(button.url, "_blank");
      } else {
        window.location.href = button.url;
      }
    } else {
      if (button.open_in_new_window) {
        window.open(button.url, "_blank");
      } else {
        navigate(button.url);
        onOpenChange(false);
      }
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Tutorial Video</DialogTitle>
        </DialogHeader>
        {videoId ? <div className="space-y-4">
            <div className="aspect-video">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="Tutorial Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg" />
            </div>
            {ctaButtons && ctaButtons.length > 0 && <div className="flex flex-wrap gap-4 justify-center pt-4">
                {ctaButtons.map((button, index) => <Button key={index} onClick={() => handleButtonClick(button)} size="lg" className="text-white font-semibold shadow-lg hover:shadow-xl transition-all" style={{
            backgroundColor: button.color || '#4ca153',
            borderColor: button.color || '#4ca153'
          }}>
                    {button.text}
                  </Button>)}
              </div>}
          </div> : <p className="text-muted-foreground">Invalid video URL</p>}
      </DialogContent>
    </Dialog>;
};
export const OnboardingSection = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentCtaButtons, setCurrentCtaButtons] = useState<Array<{
    text: string;
    url: string;
    url_type: "internal" | "external" | "mark_complete";
    open_in_new_window?: boolean;
    color?: string;
  }>>([]);
  const [currentStepId, setCurrentStepId] = useState<string>("");
  const {
    steps,
    isLoading,
    isStepCompleted,
    markStepComplete
  } = useOnboardingSteps();
  const navigate = useNavigate();
  const handleStepAction = (step: any) => {
    if (step.enable_video_url && step.video_url) {
      setCurrentVideoUrl(step.video_url);
      setCurrentCtaButtons(step.cta_buttons || []);
      setCurrentStepId(step.id);
      setVideoDialogOpen(true);
    }
  };

  // Calculate actual completion based on database
  const completedSteps = steps.filter(s => isStepCompleted(s.id)).length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? Math.round(completedSteps / totalSteps * 100) : 0;
  if (isLoading) {
    return <section>
        <Card className="card-gradient border-card-border">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading onboarding steps...</p>
          </CardContent>
        </Card>
      </section>;
  }
  return <section>
      {currentVideoUrl && <VideoDialog videoUrl={currentVideoUrl} ctaButtons={currentCtaButtons} stepId={currentStepId} open={videoDialogOpen} onOpenChange={setVideoDialogOpen} onMarkComplete={() => {
      if (currentStepId) {
        markStepComplete.mutate(currentStepId);
      }
    }} />}
      <Card className="overflow-hidden border-card-border shadow-lg bg-card">
        <Collapsible open={!isCollapsed} onOpenChange={open => setIsCollapsed(!open)}>
          <CardContent className="relative p-0">
            {/* Collapsed State - Minimal Header */}
            {isCollapsed && <div className="p-5 flex items-center justify-between bg-muted/30">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-xl font-bold text-primary">{progressPercentage}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground">Getting Started</h3>
                    <p className="text-sm text-muted-foreground">{completedSteps} of {totalSteps} steps completed</p>
                  </div>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted text-card-foreground" aria-label="Expand onboarding">
                    <Plus className="h-5 w-5" />
                  </Button>
                </CollapsibleTrigger>
              </div>}

            {/* Expanded State - Full Content */}
            <CollapsibleContent>
              <div className="p-6 bg-gradient-to-br from-card via-muted/5 to-card">
                <div className="mb-8">
                  {/* Progress Bar */}
                  <div className="bg-muted rounded-full h-3 overflow-hidden border border-border">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 rounded-full" style={{
                    width: `${progressPercentage}%`
                  }} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-primary">{completedSteps} of {totalSteps} completed</span>
                    <span className="text-sm font-semibold text-primary">{progressPercentage}%</span>
                  </div>
                </div>

                {/* Onboarding Steps */}
                <div className="space-y-2">
                  {steps.map((step, index) => <OnboardingItem key={step.id} completed={isStepCompleted(step.id)} title={step.title} description={step.description} icon={step.icon} stepNumber={index + 1} enableVideoUrl={step.enable_video_url} videoUrl={step.video_url} onActionClick={() => handleStepAction(step)} />)}
                </div>

                {/* Motivation Footer */}
                {progressPercentage < 100 && <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-center text-card-foreground font-medium">
                      💪 You're {progressPercentage === 0 ? 'just getting started' : `${progressPercentage}% of the way there`}! Keep going!
                    </p>
                  </div>}
                
                {progressPercentage === 100 && <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-center text-green-800 font-medium">
                      🎊 Congratulations! You've completed all onboarding steps!
                    </p>
                  </div>}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    </section>;
};