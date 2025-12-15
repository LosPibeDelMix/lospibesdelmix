const { google } = require('googleapis');
const SpotifyWebApi = require('spotify-web-api-node');

class APIManager {
  constructor() {
    this.youtube = null;
    this.spotify = null;
    this.initializeAPIs();
  }

  initializeAPIs() {
    // YouTube API
    if (process.env.YOUTUBE_API_KEY) {
      this.youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
      });
    }

    // Spotify API
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      this.spotify = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
      });
      
      this.initializeSpotify();
    }
  }

  async initializeSpotify() {
    try {
      const data = await this.spotify.clientCredentialsGrant();
      this.spotify.setAccessToken(data.body['access_token']);
      console.log('✅ Spotify API inicializada');
      
      // Renovar token cada 50 minutos
      setInterval(async () => {
        try {
          const newData = await this.spotify.clientCredentialsGrant();
          this.spotify.setAccessToken(newData.body['access_token']);
          console.log('🔄 Token de Spotify renovado');
        } catch (error) {
          console.log('⚠️ Error renovando token de Spotify:', error.message);
        }
      }, 50 * 60 * 1000);
      
    } catch (error) {
      console.log('❌ Error inicializando Spotify:', error.message);
      this.spotify = null;
    }
  }

  async searchYouTube(query, maxResults = 10) {
    if (!this.youtube) {
      throw new Error('YouTube API no configurada');
    }

    try {
      const response = await this.youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults,
        videoCategoryId: '10' // Música
      });

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description
      }));
    } catch (error) {
      throw new Error(`Error buscando en YouTube: ${error.message}`);
    }
  }

  async searchSpotify(query, type = 'track', limit = 10) {
    if (!this.spotify) {
      throw new Error('Spotify API no configurada');
    }
    
    // Verificar si tenemos token
    if (!this.spotify.getAccessToken()) {
      await this.initializeSpotify();
      if (!this.spotify || !this.spotify.getAccessToken()) {
        throw new Error('No se pudo obtener token de Spotify');
      }
    }

    try {
      const response = await this.spotify.search(query, [type], { limit });
      
      if (type === 'track') {
        return response.body.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          duration: track.duration_ms,
          preview_url: track.preview_url,
          external_url: track.external_urls.spotify,
          image: track.album.images[0]?.url
        }));
      }
      
      return response.body;
    } catch (error) {
      throw new Error(`Error buscando en Spotify: ${error.message}`);
    }
  }

  async getSpotifyPlaylist(playlistId) {
    if (!this.spotify) {
      throw new Error('Spotify API no configurada');
    }

    try {
      const playlist = await this.spotify.getPlaylist(playlistId);
      const tracks = await this.spotify.getPlaylistTracks(playlistId);
      
      return {
        name: playlist.body.name,
        description: playlist.body.description,
        tracks: tracks.body.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists.map(a => a.name).join(', '),
          duration: item.track.duration_ms,
          preview_url: item.track.preview_url
        }))
      };
    } catch (error) {
      throw new Error(`Error obteniendo playlist de Spotify: ${error.message}`);
    }
  }

  isYouTubeAvailable() {
    return !!this.youtube;
  }

  isSpotifyAvailable() {
    return !!this.spotify;
  }
}

module.exports = new APIManager();