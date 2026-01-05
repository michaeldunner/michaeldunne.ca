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