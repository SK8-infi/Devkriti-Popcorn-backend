import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMGJmYmM4NTEzODNiNTQyYjYxNzVmNzlhM2NlMmYwNyIsIm5iZiI6MTc1MTY1NTcxMy42ODksInN1YiI6IjY4NjgyNTIxODlkYzhmYTMwZTUxZDJkMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.IuNr0dvB_dTbn0BVjgH1faUfVgNWd_IlwOARkjPwDo8';
const MOVIES_JSON_PATH = path.join(process.cwd(), 'movies_latest.json');
const IMAGES_DIR = path.join(process.cwd(), 'images');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

console.log('📁 Images directory:', IMAGES_DIR);
let MOVIE_DATA = [];

async function downloadImageIfNeeded(imagePath) {
  if (!imagePath) return null;
  const filename = imagePath.replace(/^\//, '');
  const localPath = path.join(IMAGES_DIR, filename);
  if (await fs.pathExists(localPath)) return filename;
  const url = `${TMDB_IMAGE_BASE}${imagePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download image');
  const buffer = await res.arrayBuffer();
  await fs.outputFile(localPath, Buffer.from(buffer));
  return filename;
}

async function downloadBackdropIfNeeded(backdropPath) {
  if (!backdropPath) return null;
  const filename = 'backdrop_' + backdropPath.replace(/^\//, '');
  const localPath = path.join(IMAGES_DIR, filename);
  const exists = await fs.pathExists(localPath);
  if (!exists) {
    console.log(`📥 Downloading backdrop: ${filename}`);
    const url = `https://image.tmdb.org/t/p/w1280${backdropPath}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download backdrop image');
    const buffer = await res.arrayBuffer();
    await fs.outputFile(localPath, Buffer.from(buffer));
    // Wait for file system to flush (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
    // Double-check file exists
    let tries = 0;
    while (!(await fs.pathExists(localPath)) && tries < 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      tries++;
    }
    console.log(`✅ Downloaded backdrop: ${filename}`);
  } else {
    console.log(`📁 Backdrop already exists: ${filename}`);
  }
  return filename;
}

export async function fetchLatestMovies() {
  console.log('📡 Fetching latest movies from TMDB...');
  const url = 'https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1';
  const headers = {
    'Authorization': `Bearer ${TMDB_BEARER_TOKEN}`,
    'accept': 'application/json',
  };
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch TMDB');
    const json = await response.json();
    const movies = json.results ? json.results.slice(0, 10) : [];
    MOVIE_DATA = await Promise.all(movies.map(async movie => {
      let localFilename = null;
      let localBackdropFilename = null;
      if (movie.poster_path) {
        try {
          localFilename = await downloadImageIfNeeded(movie.poster_path);
        } catch (e) {
          console.error('❌ Error downloading image:', e);
        }
      }
      if (movie.backdrop_path) {
        try {
          localBackdropFilename = await downloadBackdropIfNeeded(movie.backdrop_path);
        } catch (e) {
          console.error('❌ Error downloading backdrop:', e);
        }
      }
      // Fetch movie details for runtime and genres
      let runtime = null;
      let genres = [];
      try {
        const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?language=en-US`, { headers });
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          runtime = details.runtime;
          genres = details.genres || [];
        } else {
          console.error(`❌ Failed to fetch details for movie ${movie.id}`);
        }
      } catch (e) {
        console.error(`❌ Error fetching details for movie ${movie.id}:`, e);
      }
      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        poster_url: localFilename ? `/api/images/${localFilename}` : null,
        backdrop_url: localBackdropFilename ? `/api/images/${localBackdropFilename}` : null,
        runtime,
        genres,
      };
    }));
    console.log('✅ Updated movie cache.');
  } catch (e) {
    console.error('❌ Error fetching TMDB data:', e);
  }
}

export async function fetchAndCacheLatestMovies() {
  try {
    // Fetch both page 1 and page 2 to get 40 movie IDs
    const url1 = `${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=1`;
    const url2 = `${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=2`;
    const [res1, res2] = await Promise.all([
      fetch(url1, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } }),
      fetch(url2, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } })
    ]);
    if (!res1.ok || !res2.ok) throw new Error('Failed to fetch TMDB');
    const json1 = await res1.json();
    const json2 = await res2.json();
    const moviesBasic = [
      ...(json1.results || []),
      ...(json2.results || [])
    ].slice(0, 40);

    // Fetch full details for each movie
    const processed = await Promise.all(moviesBasic.map(async movie => {
      // Fetch full details
      const detailsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?language=en-US`, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } });
      let details = {};
      if (detailsRes.ok) {
        details = await detailsRes.json();
      }
      // Fetch credits (cast)
      let casts = [];
      try {
        const creditsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/credits?language=en-US`, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } });
        if (creditsRes.ok) {
          const credits = await creditsRes.json();
          casts = credits.cast || [];
        }
      } catch (e) {
        // Ignore errors, leave casts empty
      }

      // Fetch videos/trailers - only the official trailer
      let trailers = [];
      try {
        const videosRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/videos?language=en-US`, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } });
        if (videosRes.ok) {
          const videos = await videosRes.json();
          // Filter for official YouTube trailers only and take only the first one
          const officialTrailers = (videos.results || [])
            .filter(video => 
              video.site === 'YouTube' && 
              video.type === 'Trailer' &&
              video.official === true &&
              video.key
            )
            .sort((a, b) => {
              // Sort by published date (newest first) to get the latest official trailer
              return new Date(b.published_at) - new Date(a.published_at);
            });
          
          // Take only the first (latest) official trailer
          if (officialTrailers.length > 0) {
            const trailer = officialTrailers[0];
            trailers = [{
              id: trailer.id,
              key: trailer.key,
              name: trailer.name,
              type: trailer.type,
              site: trailer.site,
              size: trailer.size,
              official: trailer.official,
              published_at: trailer.published_at,
              youtube_url: `https://www.youtube.com/watch?v=${trailer.key}`,
              youtube_embed_url: `https://www.youtube.com/embed/${trailer.key}`,
              thumbnail_url: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`
            }];
          }
        }
      } catch (e) {
        console.error(`❌ Error fetching videos for movie ${movie.id}:`, e);
      }

      // Fetch movie logos
      let logos = [];
      try {
        const imagesRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/images`, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } });
        if (imagesRes.ok) {
          const images = await imagesRes.json();
          // Filter for English logos, prioritize by vote average and size
          logos = (images.logos || [])
            .filter(logo => 
              logo.iso_639_1 === 'en' || logo.iso_639_1 === null // English or no language
            )
            .map(logo => ({
              file_path: logo.file_path,
              width: logo.width,
              height: logo.height,
              vote_average: logo.vote_average || 0,
              vote_count: logo.vote_count || 0,
              url: `${TMDB_IMAGE_BASE}${logo.file_path}`
            }))
            .sort((a, b) => {
              // Sort by vote average first, then by size (larger is better)
              if (b.vote_average !== a.vote_average) {
                return b.vote_average - a.vote_average;
              }
              return (b.width * b.height) - (a.width * a.height);
            })
            .slice(0, 1); // Take only the best logo
        }
      } catch (e) {
        console.error(`❌ Error fetching logos for movie ${movie.id}:`, e);
      }

      let posterFilename = null;
      let backdropFilename = null;
      if (movie.poster_path) posterFilename = await downloadImageIfNeeded(movie.poster_path);
      if (movie.backdrop_path) backdropFilename = await downloadImageIfNeeded(movie.backdrop_path);
      // Save all TMDB fields from details, add casts, trailers, and logos, override poster/backdrop paths with local URLs
      return {
        ...details,
        casts,
        trailers,
        logos,
        poster_url: posterFilename ? `/api/images/${posterFilename}` : null,
        backdrop_url: backdropFilename ? `/api/images/${backdropFilename}` : null,
      };
    }));
    // Remove duplicate movies by ID
    const uniqueProcessed = [];
    const seenIds = new Set();
    for (const movie of processed) {
      if (!seenIds.has(movie.id)) {
        uniqueProcessed.push(movie);
        seenIds.add(movie.id);
      }
    }
    await fs.writeJson(MOVIES_JSON_PATH, { movies: uniqueProcessed }, { spaces: 2 });
    console.log('✅ Cached latest movies to movies_latest.json');
  } catch (e) {
    console.error('❌ Error caching latest movies:', e);
  }
}

export async function getMovieById(req, res) {
  try {
    const { id } = req.params;
    const data = await fs.readJson(MOVIES_JSON_PATH);
    console.log('Looking for movie ID:', id);
    console.log('All IDs:', data.movies.map(m => m.id));
    const movie = data.movies.find(m => String(m.id) === String(id));
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json({ movie });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read movies cache' });
  }
}

export function startMovieFetcher() {
  fetchLatestMovies();
  setInterval(fetchLatestMovies, 24 * 60 * 60 * 1000);
}

export function getLatestMovies(req, res) {
  fs.readJson(MOVIES_JSON_PATH)
    .then(data => res.json(data))
    .catch(err => {
      res.status(500).json({ error: 'Failed to read movies cache' });
    });
}

export function getAllMovies(req, res) {
  fs.readJson(MOVIES_JSON_PATH)
    .then(data => res.json({ success: true, movies: data.movies || [] }))
    .catch(err => {
      console.error('❌ Error reading movies cache:', err);
      res.status(500).json({ success: false, error: 'Failed to read movies cache' });
    });
} 