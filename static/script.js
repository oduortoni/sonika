/**
 * Music Player Class
 * Handles all functionality related to playing music and managing playlists
 */
class MusicPlayer {
    constructor() {
      // DOM Elements
      this.audio = document.getElementById('audio');
      this.playBtn = document.getElementById('play-btn');
      this.playIcon = document.getElementById('play-icon');
      this.pauseIcon = document.getElementById('pause-icon');
      this.loopBtn = document.getElementById('loop-btn');
      this.progressBar = document.getElementById('progress');
      this.currentTimeDisplay = document.getElementById('current-time');
      this.durationDisplay = document.getElementById('duration');
      this.prevBtn = document.getElementById('prev-btn');
      this.nextBtn = document.getElementById('next-btn');
      this.volumeBtn = document.getElementById('volume-btn');
      this.playlistEl = document.getElementById('playlist');
      this.visualizerBars = document.querySelectorAll('.visualizer .bar');
      
      // Player state
      this.isPlaying = false;
      this.isLooping = false;
      this.currentTrackIndex = 0;
      this.tracks = [];
      
      // Bind methods to maintain 'this' context
      this.loadTrack = this.loadTrack.bind(this);
      this.playTrack = this.playTrack.bind(this);
      this.togglePlay = this.togglePlay.bind(this);
      this.toggleLoop = this.toggleLoop.bind(this);
      this.updateProgress = this.updateProgress.bind(this);
      this.setProgress = this.setProgress.bind(this);
      this.playNext = this.playNext.bind(this);
      this.playPrev = this.playPrev.bind(this);
      this.handleTrackEnded = this.handleTrackEnded.bind(this);
      
      // Check if DOM elements exist
      this.validateDomElements();
      
      // Initialize the player
      this.initialize();
    }
    
    // Verify all required DOM elements exist
    validateDomElements() {
      const requiredElements = [
        { el: this.audio, name: 'audio' },
        { el: this.playBtn, name: 'play-btn' },
        { el: this.playIcon, name: 'play-icon' },
        { el: this.pauseIcon, name: 'pause-icon' },
        { el: this.progressBar, name: 'progress' },
        { el: this.currentTimeDisplay, name: 'current-time' },
        { el: this.durationDisplay, name: 'duration' },
        { el: this.prevBtn, name: 'prev-btn' },
        { el: this.nextBtn, name: 'next-btn' },
        { el: this.playlistEl, name: 'playlist' }
      ];
      
      let allValid = true;
      
      requiredElements.forEach(item => {
        if (!item.el) {
          console.error(`Missing required element: #${item.name}`);
          allValid = false;
        }
      });
      
      if (!allValid) {
        throw new Error('Required DOM elements are missing. Check HTML structure.');
      }
    }
    
    // Initialize the player
    async initialize() {
      try {
        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial state
        this.pauseIcon.style.display = 'none';
        this.visualizerBars.forEach(bar => bar.style.animationPlayState = 'paused');
        
        // Load tracks and build playlist
        await this.loadTracks();
        
        // Only proceed if we actually got tracks
        if (this.tracks && this.tracks.songs && this.tracks.songs.length > 0) {
          this.buildPlaylist();
          
          // Load the first track
          this.loadTrack(0);
        } else {
          console.warn('No tracks available to play');
        }
      } catch (error) {
        console.error('Failed to initialize music player:', error);
      }
    }
    
    // Set up all event listeners
    setupEventListeners() {
      // Player controls
      this.playBtn.addEventListener('click', this.togglePlay);
      this.loopBtn.addEventListener('click', this.toggleLoop);
      this.prevBtn.addEventListener('click', this.playPrev);
      this.nextBtn.addEventListener('click', this.playNext);
      this.progressBar.addEventListener('input', this.setProgress);
      
      // Audio element events
      this.audio.addEventListener('timeupdate', this.updateProgress);
      this.audio.addEventListener('ended', this.handleTrackEnded);
      this.audio.addEventListener('loadedmetadata', () => {
        this.durationDisplay.textContent = this.formatTime(this.audio.duration);
      });
    }
    
    // Load tracks from server
    async loadTracks() {
      try {
        console.log('Fetching tracks from server...');
        const response = await fetch('/tunes');
        
        if (!response.ok) {
          throw new Error(`Server returned error: ${response.status}`);
        }
        
        const tracksData = await response.json();
        console.log('Tracks loaded:', tracksData);
        
        // Store the tracks in the class property
        this.tracks = tracksData;
        return tracksData;
      } catch (error) {
        console.error('Failed to load tracks:', error);
        return [];
      }
    }
    
    // Build the playlist UI
    buildPlaylist() {
      // Clear existing playlist
      this.playlistEl.innerHTML = '';
            
      if (!this.tracks.songs || this.tracks.songs.length === 0) {
        console.warn('Cannot build playlist: No tracks available');
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'No tracks available';
        emptyMessage.className = 'playlist-item empty';
        this.playlistEl.appendChild(emptyMessage);
        return;
      }
      
      // Create and add track elements
      this.tracks.songs.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track;
        li.className = 'playlist-item';
        
        if (index === this.currentTrackIndex) {
          li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
          this.currentTrackIndex = index;
          this.loadTrack(index);
          this.playTrack();
        });
        
        this.playlistEl.appendChild(li);
      });      
    }
    
    // Load a specific track
    loadTrack(index) {
      if (!this.tracks.songs || !this.tracks.songs[index]) {
        console.error('Cannot load track: Invalid track index or no tracks available:', index);
        return;
      }
      
      const track = this.tracks.songs[index];
      const audioPath = encodeURIComponent(track);
      console.log(`Loading track: ${track} (${audioPath})`);
      
      this.audio.src = `/tunes/${audioPath}`;
      this.audio.load();
      
      // Update UI state
      this.playIcon.style.display = 'inline';
      this.pauseIcon.style.display = 'none';
      this.isPlaying = false;
      this.highlightActiveTrack(index);
      
      // Reset progress
      this.progressBar.value = 0;
      this.currentTimeDisplay.textContent = '0:00';
    }
    
    // Play the current track
    playTrack() {
      console.log('Playing track...');
      
      this.audio.play()
        .then(() => {
          this.isPlaying = true;
          this.playIcon.style.display = 'none';
          this.pauseIcon.style.display = 'inline';
          this.visualizerBars.forEach(bar => bar.style.animationPlayState = 'running');
        })
        .catch(err => {
          console.error('Playback error:', err);
        });
    }
    
    // Toggle play/pause
    togglePlay() {
      if (this.audio.paused) {
        this.playTrack();
      } else {
        this.audio.pause();
        this.isPlaying = false;
        this.playIcon.style.display = 'inline';
        this.pauseIcon.style.display = 'none';
        this.visualizerBars.forEach(bar => bar.style.animationPlayState = 'paused');
      }
    }
    
    // Toggle loop mode
    toggleLoop() {
      this.isLooping = !this.isLooping;
      this.audio.loop = this.isLooping;
      this.loopBtn.classList.toggle('active', this.isLooping);
    }
    
    // Update progress bar during playback
    updateProgress() {
      if (this.audio.duration) {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.value = percent;
        this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
      }
    }
    
    // Set progress when user interacts with progress bar
    setProgress() {
      const newTime = (this.progressBar.value / 100) * this.audio.duration;
      this.audio.currentTime = newTime;
    }
    
    // Play next track
    playNext() {
      if (!this.tracks.songs || this.tracks.songs.length === 0) return;
      
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.songs.length;
      this.loadTrack(this.currentTrackIndex);
      this.playTrack();
    }
    
    // Play previous track
    playPrev() {
      if (!this.tracks.songs || this.tracks.songs.length === 0) return;
      
      this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.songs.length) % this.tracks.songs.length;
      this.loadTrack(this.currentTrackIndex);
      this.playTrack();
    }
    
    // Handle track ended event
    handleTrackEnded() {
      if (this.isLooping) return; // Loop is handled by audio.loop
      
      this.playIcon.style.display = 'inline';
      this.pauseIcon.style.display = 'none';
      this.isPlaying = false;
      this.visualizerBars.forEach(bar => bar.style.animationPlayState = 'paused');
      
      // Auto-play next track
      this.playNext();
    }
    
    // Highlight active track in playlist
    highlightActiveTrack(index) {
      const items = this.playlistEl.querySelectorAll('li');
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
    
    // Format time from seconds to mm:ss
    formatTime(time) {
      if (isNaN(time)) return '0:00';
      
      const min = Math.floor(time / 60);
      const sec = Math.floor(time % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
    }
  }
  
  // Load the player when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Create player instance
      window.player = new MusicPlayer();
    } catch (error) {
      console.error('Failed to initialize music player:', error);
      
      // Display a user-friendly error
      const container = document.querySelector('body');
      const errorMsg = document.createElement('div');
      errorMsg.style.color = 'red';
      errorMsg.style.padding = '20px';
      errorMsg.style.textAlign = 'center';
      errorMsg.innerHTML = `
        <h3>Error Loading Music Player</h3>
        <p>There was a problem initializing the music player. Please check the console for details.</p>
      `;
      container.prepend(errorMsg);
    }
  });
