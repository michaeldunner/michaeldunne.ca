export interface SpotifyNowPlaying {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  url: string;
  isPlaying: true;
}

export interface SpotifyNotPlaying {
  isPlaying: false;
}

export type SpotifyResponse = SpotifyNowPlaying | SpotifyNotPlaying;

export interface LetterboxdItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
}

export interface LetterboxdResponse {
  status: string;
  feed: {
    url: string;
    title: string;
    link: string;
    author: string;
    description: string;
    image: string;
  };
  items: LetterboxdItem[];
}
