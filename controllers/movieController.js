import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMGJmYmM4NTEzODNiNTQyYjYxNzVmNzlhM2NlMmYwNyIsIm5iZiI6MTc1MTY1NTcxMy42ODksInN1YiI6IjY4NjgyNTIxODlkYzhmYTMwZTUxZDJkMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.IuNr0dvB_dTbn0BVjgH1faUfVgNWd_IlwOARkjPwDo8';
const IMAGES_DIR = path.join(__dirname, '..', 'images');
console.log('📁 Images directory:', IMAGES_DIR);
let MOVIE_DATA = [];

async function downloadImageIfNeeded(posterPath) {
  if (!posterPath) return null;
  const filename = posterPath.replace(/^\//, '');
  const localPath = path.join(IMAGES_DIR, filename);
  console.log('📁 Checking poster path:', localPath);
  const exists = await fs.pathExists(localPath);
  if (!exists) {
    console.log(`📥 Downloading poster: ${filename}`);
    const url = `https://image.tmdb.org/t/p/original${posterPath}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download image');
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
    console.log(`✅ Downloaded poster: ${filename}`);
  } else {
    console.log(`📁 Poster already exists: ${filename}`);
  }
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
      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        poster_url: localFilename ? `/api/images/${localFilename}` : null,
        backdrop_url: localBackdropFilename ? `/api/images/${localBackdropFilename}` : null,
      };
    }));
    console.log('✅ Updated movie cache.');
  } catch (e) {
    console.error('❌ Error fetching TMDB data:', e);
  }
}

export function startMovieFetcher() {
  fetchLatestMovies();
  setInterval(fetchLatestMovies, 24 * 60 * 60 * 1000);
}

export function getLatestMovies(req, res) {
  // If no movies loaded yet, fetch them first
  if (MOVIE_DATA.length === 0) {
    console.log('🔄 No movies cached, fetching now...');
    fetchLatestMovies().then(() => {
      res.json({ movies: MOVIE_DATA });
    }).catch(err => {
      console.error('❌ Error in getLatestMovies:', err);
      res.status(500).json({ error: 'Failed to fetch movies' });
    });
  } else {
    res.json({ movies: MOVIE_DATA });
  }
} 