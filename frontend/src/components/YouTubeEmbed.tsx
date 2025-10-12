"use client";

import React from "react";
import ReactYoutube from "react-youtube";

type YouTubeEmbedProps = {
  videoId: string;
  width?: string | number;
  height?: string | number;
  autoplay?: boolean;
};

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  width = "100%",
  height = "100%",
  autoplay = true,
}) => {
  return (
    <ReactYoutube
      videoId={videoId}
      opts={{
        width: String(width),
        height: String(height),
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          playsinline: 1,
          controls: 1,
          rel: 0,
        },
      }}
      className="size-full"
    />
  );
};

export default YouTubeEmbed;
