import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Calendar, Clock } from "lucide-react";
import { useState } from "react";

const videoUrl = "https://youtu.be/NpEaa2P7qZI?si=Hst1JTov7e-zd4m_";
const embedUrl = "https://www.youtube.com/embed/NpEaa2P7qZI?si=Hst1JTov7e-zd4m_";
const thumbnailUrl = "https://img.youtube.com/vi/NpEaa2P7qZI/maxresdefault.jpg";

const youtubeVideos = [
  {
    id: "NpEaa2P7qZI",
    title: "The Ultimate Dad Survival Guide - Episode 1",
    thumbnail: thumbnailUrl,
    duration: "15:32",
    publishedDate: "2 days ago",
    description: "Essential tips every new dad needs to know for the first year."
  },
  {
    id: "2",
    title: "Building Confidence as a Father - DadderUp Podcast",
    thumbnail: thumbnailUrl,
    duration: "23:45",
    publishedDate: "1 week ago",
    description: "How to overcome imposter syndrome and trust your parenting instincts."
  },
  {
    id: "3",
    title: "Work-Life Balance for Busy Dads",
    thumbnail: thumbnailUrl,
    duration: "18:20",
    publishedDate: "2 weeks ago",
    description: "Strategies to be present for your family while managing career demands."
  },
  {
    id: "4",
    title: "Teaching Kids About Money - Financial Literacy",
    thumbnail: thumbnailUrl,
    duration: "20:15",
    publishedDate: "3 weeks ago",
    description: "Age-appropriate ways to teach your children about financial responsibility."
  },
  {
    id: "5",
    title: "Dad's Guide to Emotional Intelligence",
    thumbnail: thumbnailUrl,
    duration: "25:10",
    publishedDate: "1 month ago",
    description: "Understanding and managing emotions - yours and your children's."
  },
  {
    id: "6",
    title: "Creating Family Traditions That Last",
    thumbnail: thumbnailUrl,
    duration: "16:45",
    publishedDate: "1 month ago",
    description: "How to establish meaningful traditions that bring your family together."
  },
  {
    id: "7",
    title: "Discipline vs. Punishment - What Every Dad Should Know",
    thumbnail: thumbnailUrl,
    duration: "22:30",
    publishedDate: "1 month ago",
    description: "Effective discipline strategies that build character and respect."
  },
  {
    id: "8",
    title: "Supporting Your Partner in Parenthood",
    thumbnail: thumbnailUrl,
    duration: "19:55",
    publishedDate: "2 months ago",
    description: "How to be a supportive co-parent and strengthen your relationship."
  },
  {
    id: "9",
    title: "Dad's Mental Health Matters Too",
    thumbnail: thumbnailUrl,
    duration: "28:40",
    publishedDate: "2 months ago",
    description: "Taking care of your mental health while caring for your family."
  },
  {
    id: "10",
    title: "Building Strong Father-Child Bonds",
    thumbnail: thumbnailUrl,
    duration: "21:25",
    publishedDate: "3 months ago",
    description: "Activities and approaches to deepen your connection with your kids."
  }
];

export const YouTubeTab = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const openVideo = () => {
    setIsVideoOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">DadderUp Podcast</h3>
        <p className="text-muted-foreground mb-4">
          Listen to our latest podcast episodes on fatherhood, parenting tips, and dad life
        </p>
        <Button 
          variant="outline" 
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          onClick={() => window.open('https://www.youtube.com/@DadderUp', '_blank')}
        >
          Subscribe to our YouTube Channel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {youtubeVideos.map((video) => (
          <Card key={video.id} className="border-card-border hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="relative" onClick={openVideo}>
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  // Fallback to a placeholder if thumbnail fails to load
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/480x360/8B5CF6/FFFFFF?text=DadderUp`;
                }}
              />
              <div className="absolute inset-0 bg-black/20 rounded-t-lg group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {video.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {video.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{video.publishedDate}</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                  onClick={openVideo}
                >
                  Watch Video
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button 
          variant="outline" 
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          onClick={() => window.open('https://www.youtube.com/@DadderUp', '_blank')}
        >
          Subscribe to our YouTube Channel
        </Button>
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>DadderUp Video</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title="DadderUp Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};