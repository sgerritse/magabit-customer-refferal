import React from 'react';
import DOMPurify from 'dompurify';

interface ChallengeContentProps {
  content: string;
  className?: string;
}

const ChallengeContent: React.FC<ChallengeContentProps> = ({ content, className }) => {
  // Sanitize and render HTML content
  const renderContent = (text: string) => {
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]+>/g.test(text);
    
    if (hasHtmlTags) {
      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(text, {
        ALLOWED_TAGS: ['iframe', 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'b', 'i'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'href', 'target', 'class', 'style'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
      
      return (
        <div 
          className="prose prose-sm max-w-none text-gray-900 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:mb-4 [&_iframe]:max-w-2xl [&_iframe]:mx-auto [&_p]:text-gray-900 [&_span]:text-gray-900"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    }
    
    // If no HTML tags, check for plain YouTube URLs and convert them
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;
    const parts = text.split(youtubeRegex);
    
    if (parts.length > 1) {
      return (
        <>
          {parts.map((part, index) => {
            // If this part is a video ID (every odd index after split)
            if (index % 2 === 1) {
              return (
                <div key={index} className="mb-4 aspect-video max-w-2xl mx-auto">
                  <iframe
                    src={`https://www.youtube.com/embed/${part}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  />
                </div>
              );
            }
            // Render regular text in dark gray
            return part && part.trim() && <span key={index} className="whitespace-pre-wrap text-gray-900">{part}</span>;
          })}
        </>
      );
    }

    // No special content found, return as regular text in dark gray
    return <span className="whitespace-pre-wrap text-gray-900">{text}</span>;
  };

  return (
    <div className={className}>
      {renderContent(content)}
    </div>
  );
};

export default ChallengeContent;