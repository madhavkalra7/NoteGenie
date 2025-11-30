'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUpsideDown } from '@/context/UpsideDownContext';
import { supabase } from '@/lib/supabase';

interface GeneratedBook {
  id: string;
  title: string;
  category: string;
  chapter_count: number;
  page_count: number;
  status: string;
  created_at: string;
  pdf_data?: string;
}

const BOOK_CATEGORIES = [
  { id: 'sci-fi', name: 'Science Fiction', icon: '🚀', color: '#00d4ff' },
  { id: 'fantasy', name: 'Fantasy', icon: '🐉', color: '#9b59b6' },
  { id: 'adventure', name: 'Adventure', icon: '⚔️', color: '#e74c3c' },
  { id: 'horror', name: 'Horror', icon: '👻', color: '#ff0000' },
  { id: 'mystery', name: 'Mystery', icon: '🔍', color: '#f39c12' },
  { id: 'romance', name: 'Romance', icon: '💕', color: '#e91e63' },
  { id: 'education', name: 'Educational', icon: '📚', color: '#2ecc71' },
  { id: 'biography', name: 'Biography', icon: '👤', color: '#3498db' },
];

export default function UpsideDownPage() {
  const router = useRouter();
  const { isUpsideDown, enterUpsideDown, exitUpsideDown } = useUpsideDown();
  const [isEntering, setIsEntering] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookPrompt, setBookPrompt] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [chapterCount, setChapterCount] = useState(18); // Default 18 chapters
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [currentChapter, setCurrentChapter] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [myBooks, setMyBooks] = useState<GeneratedBook[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [selectedBook, setSelectedBook] = useState<GeneratedBook | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const themeAudioRef = useRef<HTMLAudioElement>(null);
  const thunderAudioRef = useRef<HTMLAudioElement>(null);
  const hasDownloadedRef = useRef(false); // Use ref to avoid stale closure

  // Warn user before leaving during generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = 'Book generation is in progress. If you leave, your progress will be lost!';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGenerating]);

  // Enter the Upside Down on mount
  useEffect(() => {
    enterUpsideDown();
    
    // Generate floating particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);

    // Portal animation sequence
    setTimeout(() => {
      setIsEntering(false);
    }, 1500);

    setTimeout(() => {
      setShowContent(true);
      // Start thunder ambient sound with 7 second intervals
      const playThunderWithInterval = () => {
        if (thunderAudioRef.current) {
          thunderAudioRef.current.volume = 0.1;
          thunderAudioRef.current.loop = false;
          thunderAudioRef.current.currentTime = 0;
          thunderAudioRef.current.play().catch(() => {});
        }
      };
      
      // Play first thunder
      playThunderWithInterval();
      
      // Set interval for thunder every 7 seconds
      const thunderInterval = setInterval(playThunderWithInterval, 7000);
      
      // Store interval ID for cleanup
      (window as any).thunderInterval = thunderInterval;
    }, 2500);

    // Get user and fetch their books
    const getUser = async () => {
      try {
        console.log('🔍 Checking auth state...');
        
        // First try getSession (recommended approach)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('🔍 getSession result:', {
          hasSession: !!session,
          userId: session?.user?.id || 'none',
          email: session?.user?.email || 'none',
          error: sessionError?.message || 'none'
        });
        
        if (session?.user) {
          setUserId(session.user.id);
          console.log('✅ User ID set from session:', session.user.id);
          fetchMyBooks(session.user.id);
          return;
        }
        
        // Fallback: try getUser
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('🔍 getUser result:', {
          hasUser: !!user,
          userId: user?.id || 'none',
          email: user?.email || 'none', 
          error: error?.message || 'none'
        });
        
        if (user) {
          setUserId(user.id);
          console.log('✅ User ID set from getUser:', user.id);
          fetchMyBooks(user.id);
          return;
        }
        
        console.log('❌ No user logged in - books will not be saved');
        console.log('💡 Please login first at /auth/login');
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    
    // Small delay to ensure auth is initialized
    setTimeout(getUser, 300);
    
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id || 'no user');
      if (session?.user) {
        setUserId(session.user.id);
        fetchMyBooks(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      // Unsubscribe from auth changes
      subscription.unsubscribe();
      // Stop sounds on unmount
      if (thunderAudioRef.current) {
        thunderAudioRef.current.pause();
      }
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
      }
      // Clear thunder interval
      if ((window as any).thunderInterval) {
        clearInterval((window as any).thunderInterval);
      }
    };
  }, []);

  // Fetch user's books
  const fetchMyBooks = async (uid: string) => {
    try {
      const response = await fetch(`/api/generate-book?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setMyBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  // Stop generation music and video when done
  useEffect(() => {
    if (!isGenerating) {
      // Stop music with fade out
      if (themeAudioRef.current && !themeAudioRef.current.paused) {
        const audio = themeAudioRef.current;
        const fadeOut = setInterval(() => {
          if (audio.volume > 0.02) {
            audio.volume = Math.max(0, audio.volume - 0.02);
          } else {
            clearInterval(fadeOut);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0.15;
          }
        }, 50);
      }
      // Stop thunder
      if (thunderAudioRef.current && !thunderAudioRef.current.paused) {
        const thunder = thunderAudioRef.current;
        const fadeOut = setInterval(() => {
          if (thunder.volume > 0.01) {
            thunder.volume = Math.max(0, thunder.volume - 0.01);
          } else {
            clearInterval(fadeOut);
            thunder.pause();
            thunder.currentTime = 0;
            thunder.volume = 0.1;
          }
        }, 50);
      }
      // Stop video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isGenerating]);

  // Lightning canvas effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawLightning = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (Math.random() > 0.97) {
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.random() * 0.4})`;
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.beginPath();
        
        let x = Math.random() * canvas.width;
        let y = 0;
        ctx.moveTo(x, y);
        
        while (y < canvas.height * 0.7) {
          x += (Math.random() - 0.5) * 100;
          y += 20 + Math.random() * 30;
          ctx.lineTo(x, y);
          
          // Branch
          if (Math.random() > 0.7) {
            ctx.moveTo(x, y);
            const branchX = x + (Math.random() - 0.5) * 80;
            const branchY = y + 20 + Math.random() * 40;
            ctx.lineTo(branchX, branchY);
            ctx.moveTo(x, y);
          }
        }
        
        ctx.stroke();
        
        // Flash effect
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const interval = setInterval(drawLightning, 100);
    return () => clearInterval(interval);
  }, []);

  const handleExitUpsideDown = () => {
    setShowContent(false);
    setIsEntering(true);
    setTimeout(() => {
      exitUpsideDown();
      router.push('/dashboard');
    }, 1500);
  };

  const handleGenerateBook = async () => {
    if (!selectedCategory || !bookPrompt.trim() || !bookTitle.trim()) {
      alert('Please select a category, enter a title, and describe your book!');
      return;
    }

    // Check if user is logged in
    if (!userId) {
      alert('Please login to generate and save books!');
      return;
    }

    console.log('Starting book generation with userId:', userId);

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('🌀 Opening the portal to infinite stories...');
    setCurrentChapter(0);
    setTotalChapters(0);
    hasDownloadedRef.current = false; // Reset download flag

    // Start audio/video immediately on user click (required for browser autoplay policy)
    if (themeAudioRef.current) {
      themeAudioRef.current.volume = 0.15;
      themeAudioRef.current.loop = true;
      themeAudioRef.current.currentTime = 0;
      themeAudioRef.current.play().catch(console.error);
    }
    if (thunderAudioRef.current) {
      thunderAudioRef.current.volume = 0.1;
      thunderAudioRef.current.loop = true;
      thunderAudioRef.current.currentTime = 0;
      thunderAudioRef.current.play().catch(console.error);
    }
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }

    try {
      const response = await fetch('/api/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          title: bookTitle,
          prompt: bookPrompt,
          userId: userId,
          chapterCount: chapterCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start book generation');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Update progress based on event type
              if (data.progress !== undefined) {
                setGenerationProgress(data.progress);
              }
              if (data.message) {
                setGenerationStatus(data.message);
              }
              if (data.totalChapters) {
                setTotalChapters(data.totalChapters);
              }
              if (data.currentChapter) {
                setCurrentChapter(data.currentChapter);
              }

              // Handle completion - download PDF (only once!)
              if (data.type === 'complete' && data.pdf) {
                console.log('📥 Received complete event, hasDownloaded:', hasDownloadedRef.current);
                
                if (!hasDownloadedRef.current) {
                  hasDownloadedRef.current = true; // Prevent duplicate downloads
                  console.log('📥 Starting PDF download...');
                  setGenerationProgress(100);
                  
                  try {
                    // Convert base64 to blob and download
                    const binaryString = atob(data.pdf);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = data.filename || `${bookTitle.replace(/\s+/g, '_')}_by_NoteGenie.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    console.log('✅ PDF downloaded successfully!');
                  } catch (downloadError) {
                    console.error('❌ Download error:', downloadError);
                  }

                  // Refresh books list
                  if (userId) {
                    fetchMyBooks(userId);
                  }
                  
                  // Stop generation UI after a short delay
                  setTimeout(() => {
                    setIsGenerating(false);
                    setBookTitle('');
                    setBookPrompt('');
                    setSelectedCategory(null);
                  }, 2000);
                }
              }

              // Handle error
              if (data.type === 'error') {
                throw new Error(data.error || 'Generation failed');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Book generation error:', error);
      setGenerationStatus('❌ The Demogorgon intercepted your book... Try again!');
      // Only reset on error
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setCurrentChapter(0);
        setTotalChapters(0);
      }, 3000);
    }
  };

  // Handle book click to open PDF
  const handleBookClick = async (book: GeneratedBook) => {
    if (book.status !== 'completed') return;
    
    setSelectedBook(book);
    setIsLoadingPdf(true);
    
    try {
      console.log('📖 Fetching PDF for book:', book.id);
      
      // Fetch PDF as binary data directly
      const response = await fetch(`/api/generate-book?bookId=${book.id}&returnAs=binary`);
      console.log('📖 Response status:', response.status, 'Content-Type:', response.headers.get('Content-Type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error('Failed to fetch PDF');
      }
      
      // Get the PDF as a blob directly
      const blob = await response.blob();
      console.log('📖 PDF blob received, size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Empty PDF received');
      }
      
      const url = window.URL.createObjectURL(blob);
      console.log('✅ PDF URL created:', url);
      setPdfUrl(url);
      
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      alert('Could not load PDF. Please try again.');
      setSelectedBook(null);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"?\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/generate-book?bookId=${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setMyBooks(prev => prev.filter(book => book.id !== bookId));
        alert(`"${bookTitle}" has been deleted!`);
      } else {
        throw new Error('Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (themeAudioRef.current) {
      themeAudioRef.current.muted = newMuted;
    }
    if (thunderAudioRef.current) {
      thunderAudioRef.current.muted = newMuted;
    }
  };

  // Close PDF viewer
  const closePdfViewer = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setSelectedBook(null);
  };

  // Download PDF
  const downloadPdf = () => {
    if (!pdfUrl || !selectedBook) return;
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${selectedBook.title.replace(/[^a-zA-Z0-9]/g, '_')}_by_NoteGenie.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="upside-down-portal">
      {/* PDF Viewer Modal */}
      {selectedBook && (
        <div className="pdf-viewer-modal">
          <div className="pdf-viewer-backdrop" onClick={closePdfViewer} />
          <div className="pdf-viewer-container">
            <div className="pdf-viewer-header">
              <h3>{selectedBook.title}</h3>
              <div className="pdf-viewer-actions">
                <button onClick={downloadPdf} className="pdf-download-btn" title="Download PDF">
                  ⬇️ Download
                </button>
                <button onClick={closePdfViewer} className="pdf-close-btn" title="Close">
                  ✕
                </button>
              </div>
            </div>
            <div className="pdf-viewer-content">
              {isLoadingPdf ? (
                <div className="pdf-loading">
                  <div className="pdf-loading-spinner"></div>
                  <p>Loading PDF from the Upside Down...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="pdf-iframe"
                  title={selectedBook.title}
                />
              ) : (
                <div className="pdf-error">
                  <p>Could not load PDF</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Elements */}
      <audio ref={themeAudioRef} src="/sounds/Stranger Things Theme.m4a" preload="auto" />
      <audio ref={thunderAudioRef} src="/sounds/Thunder_Clap_And_Rain_Sound_Effect(128k).m4a" preload="auto" />

      {/* Video Loading Overlay */}
      {isGenerating && (
        <div className="video-loading-overlay">
          {/* Mute Button - Top Left */}
          <button 
            className="mute-toggle-btn"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          <video
            ref={videoRef}
            src="/Book Effect.mp4"
            loop
            muted
            autoPlay
            playsInline
            className="loading-video"
          />
          {/* Bottom-right small progress card */}
          <div className="video-progress-mini">
            <div className="mini-progress-bar">
              <div
                className="mini-progress-fill"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="mini-progress-text">
              <span className="mini-percent">{generationProgress}%</span>
              {totalChapters > 0 && (
                <span className="mini-chapter">Ch {currentChapter}/{totalChapters}</span>
              )}
            </div>
            <div className="mini-status">{generationStatus}</div>
          </div>
        </div>
      )}

      {/* Lightning Canvas */}
      <canvas
        ref={canvasRef}
        className="lightning-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />

      {/* Floating Particles */}
      <div className="upside-down-particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Portal Entry Animation */}
      {isEntering && (
        <div className="portal-entry">
          <div className="portal-ring ring-1" />
          <div className="portal-ring ring-2" />
          <div className="portal-ring ring-3" />
          <div className="portal-text">ENTERING THE UPSIDE DOWN</div>
        </div>
      )}

      {/* Main Content */}
      {showContent && (
        <div className="upside-down-content">
          {/* Exit Button */}
          <button onClick={handleExitUpsideDown} className="exit-portal-btn">
            <span className="exit-icon">🚪</span>
            <span>Return to Reality</span>
          </button>

          {/* Header */}
          <div className="upside-down-header">
            <img 
              src="/NoteGenie Title.png" 
              alt="NoteGenie"
              className="notegenie-title-img"
            />
            <p className="subtitle">Create a 60+ page book from the depths of imagination</p>
          </div>

          {/* Book Generator */}
          <div className="book-generator">
            {/* Category Selection */}
            <div className="category-section">
              <h2 className="section-title">📚 Choose Your Genre</h2>
              <div className="category-grid">
                {BOOK_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      '--category-color': category.color,
                    } as React.CSSProperties}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                    {selectedCategory === category.id && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Book Title */}
            <div className="input-section">
              <h2 className="section-title">📖 Book Title</h2>
              <input
                type="text"
                className="book-title-input"
                placeholder="Enter your book's title..."
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Book Prompt */}
            <div className="input-section">
              <h2 className="section-title">✨ Describe Your Book</h2>
              <textarea
                className="book-prompt-input"
                placeholder="Describe the story you want to create... Include characters, setting, themes, and any specific elements you want in your book. The more detail, the better!"
                value={bookPrompt}
                onChange={(e) => setBookPrompt(e.target.value)}
                rows={6}
              />
              <div className="prompt-hint">
                💡 Tip: Be specific! Mention character names, world details, conflicts, and the tone you want.
              </div>
            </div>

            {/* Chapter Count Selector */}
            <div className="input-section">
              <h2 className="section-title">📑 Number of Chapters</h2>
              <div className="chapter-count-selector">
                {[2, 5, 10, 18].map((count) => (
                  <button
                    key={count}
                    className={`chapter-count-btn ${chapterCount === count ? 'selected' : ''}`}
                    onClick={() => setChapterCount(count)}
                  >
                    {count} {count === 2 ? '(Quick Test)' : count === 18 ? '(Full Book)' : ''}
                  </button>
                ))}
              </div>
              <div className="prompt-hint">
                ⏱️ Estimated time: ~{Math.ceil(chapterCount * 0.8)} minutes
              </div>
            </div>

            {/* Generate Button */}
            <button
              className={`generate-book-btn ${isGenerating ? 'generating' : ''} ${!userId ? 'disabled-no-user' : ''}`}
              onClick={handleGenerateBook}
              disabled={isGenerating || !selectedCategory || !bookPrompt.trim() || !bookTitle.trim()}
            >
              {isGenerating ? (
                <>
                  <div className="generate-spinner" />
                  <span>Forging Your Book...</span>
                </>
              ) : !userId ? (
                <>
                  <span className="btn-icon">🔒</span>
                  <span>Login to Generate Books</span>
                  <span className="btn-icon">🔒</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">📕</span>
                  <span>Generate 60+ Page Book</span>
                  <span className="btn-icon">📕</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="generation-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="progress-status">{generationStatus}</div>
                {totalChapters > 0 && (
                  <div className="chapter-progress">
                    Chapter {currentChapter} of {totalChapters}
                  </div>
                )}
                <div className="progress-percent">{generationProgress}%</div>
              </div>
            )}
          </div>

          {/* My Books Section */}
          {myBooks.length > 0 && (
            <div className="my-books-section">
              <h2 className="section-title">📚 My Books from the Upside Down</h2>
              <div className="books-grid">
                {myBooks.map((book) => (
                  <div 
                    key={book.id} 
                    className={`book-card-new ${book.status === 'completed' ? 'clickable' : ''}`}
                  >
                    <div className="book-cover-image" onClick={() => handleBookClick(book)}>
                      <img 
                        src="/Book Effect.jpg" 
                        alt={book.title}
                        className="cover-img"
                      />
                      <div className="book-title-overlay">
                        <span className="overlay-title">{book.title}</span>
                      </div>
                      {book.status === 'generating' && (
                        <div className="generating-overlay">
                          <div className="generating-spinner" />
                        </div>
                      )}
                    </div>
                    <div className="book-meta">
                      <p className="meta-chapters">{book.chapter_count} Chapters • {book.page_count} Pages</p>
                      <p className="meta-date">
                        {new Date(book.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <button 
                      className="delete-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBook(book.id, book.title);
                      }}
                      title="Delete this book"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demogorgon Easter Egg */}
          <div className="demogorgon-section">
            <div className="demogorgon">
              <div className="demohead">
                <div className="petal"></div>
                <div className="petal"></div>
                <div className="petal"></div>
                <div className="petal"></div>
                <div className="petal"></div>
              </div>
            </div>
            <p className="demo-text">The Demogorgon guards your creativity...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .upside-down-portal {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a1a 100%);
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        /* Video Loading Overlay */
        .video-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9998;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-video {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.7;
        }

        /* Mini progress card - bottom right */
        .video-progress-mini {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 10;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.85);
          border-radius: 12px;
          border: 2px solid rgba(255, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          min-width: 200px;
          box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
        }

        .mini-progress-bar {
          height: 8px;
          background: rgba(50, 50, 50, 0.8);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .mini-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff0000, #ff6600);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .mini-progress-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .mini-percent {
          font-family: var(--font-creepster), cursive;
          font-size: 1.5rem;
          color: #ff0000;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }

        .mini-chapter {
          font-size: 0.85rem;
          color: #ff6600;
          font-weight: bold;
        }

        .mini-status {
          font-size: 0.75rem;
          color: #00d4ff;
          text-shadow: 0 0 5px rgba(0, 212, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .upside-down-particles .particle {
          position: fixed;
          width: 4px;
          height: 4px;
          background: rgba(255, 0, 0, 0.6);
          border-radius: 50%;
          animation: floatParticle 10s infinite ease-in-out;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
        }

        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-100px) translateX(20px); opacity: 1; }
        }

        /* Portal Entry Animation */
        .portal-entry {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          z-index: 9999;
          animation: portalFadeOut 3s forwards;
        }

        @keyframes portalFadeOut {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }

        .portal-ring {
          position: absolute;
          border: 3px solid #ff0000;
          border-radius: 50%;
          animation: portalRing 2s infinite ease-out;
        }

        .ring-1 { width: 100px; height: 100px; animation-delay: 0s; }
        .ring-2 { width: 200px; height: 200px; animation-delay: 0.3s; }
        .ring-3 { width: 300px; height: 300px; animation-delay: 0.6s; }

        @keyframes portalRing {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        .portal-text {
          position: absolute;
          font-family: var(--font-creepster), cursive;
          font-size: 2rem;
          color: #ff0000;
          text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
          animation: portalTextPulse 0.5s infinite alternate;
          letter-spacing: 0.3em;
        }

        @keyframes portalTextPulse {
          0% { opacity: 0.5; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1.02); }
        }

        /* Exit Button */
        .exit-portal-btn {
          position: fixed;
          top: 2rem;
          right: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 0, 0, 0.2);
          border: 2px solid #ff0000;
          color: #ff0000;
          font-family: var(--font-creepster), cursive;
          font-size: 1rem;
          cursor: pointer;
          z-index: 100;
          transition: all 0.3s ease;
          letter-spacing: 0.1em;
        }

        .exit-portal-btn:hover {
          background: rgba(255, 0, 0, 0.4);
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
        }

        .exit-icon {
          font-size: 1.5rem;
        }

        /* Content */
        .upside-down-content {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 4rem;
          animation: contentFadeIn 1s ease-out;
        }

        @keyframes contentFadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .upside-down-header {
          text-align: center;
          margin-bottom: 1rem;
          position: relative;
          height: 120px;
        }

        .notegenie-title-img {
          position: absolute;
          left: 50%;
          top: 30%;
          transform: translate(-50%, -50%);
          max-width: 450px;
          width: 80%;
          height: auto;
          filter: 
            drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))
            drop-shadow(0 0 20px rgba(255, 0, 0, 0.5));
          animation: titleGlow 3s ease-in-out infinite alternate;
          pointer-events: none;
        }

        .subtitle {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 100%;
        }

        @keyframes titleGlow {
          from {
            filter: 
              drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))
              drop-shadow(0 0 20px rgba(255, 0, 0, 0.5));
          }
          to {
            filter: 
              drop-shadow(0 0 15px rgba(255, 0, 0, 1))
              drop-shadow(0 0 35px rgba(255, 0, 0, 0.6));
          }
        }

        .stranger-title {
          font-family: var(--font-creepster), cursive;
          font-size: 4rem;
          color: #ff0000;
          text-shadow: 
            0 0 10px #ff0000,
            0 0 20px #ff0000,
            0 0 40px #ff0000,
            0 0 80px #ff0000;
          letter-spacing: 0.2em;
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
        }

        .stranger-title .letter {
          display: inline-block;
          animation: letterFlicker 3s infinite;
        }

        .stranger-title .letter:nth-child(odd) {
          animation-delay: 0.1s;
        }

        @keyframes letterFlicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.3; }
          94% { opacity: 1; }
          95% { opacity: 0.5; }
          96% { opacity: 1; }
        }

        .subtitle {
          font-size: 1.2rem;
          color: #00d4ff;
          text-shadow: 0 0 10px #00d4ff;
          font-style: italic;
        }

        /* Book Generator */
        .book-generator {
          background: rgba(20, 0, 0, 0.8);
          border: 2px solid rgba(255, 0, 0, 0.3);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 
            0 0 30px rgba(255, 0, 0, 0.2),
            inset 0 0 50px rgba(0, 0, 0, 0.5);
        }

        .section-title {
          font-family: var(--font-creepster), cursive;
          font-size: 1.5rem;
          color: #ff0000;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }

        /* Category Grid */
        .category-section {
          margin-bottom: 2rem;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          background: rgba(30, 0, 0, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .category-card:hover {
          border-color: var(--category-color);
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .category-card.selected {
          border-color: var(--category-color);
          background: rgba(255, 0, 0, 0.2);
          box-shadow: 0 0 20px var(--category-color);
        }

        .category-icon {
          font-size: 2.5rem;
        }

        .category-name {
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .selected-indicator {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          background: var(--category-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #000;
        }

        /* Input Sections */
        .input-section {
          margin-bottom: 2rem;
        }

        .book-title-input {
          width: 100%;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 0, 0, 0.3);
          border-radius: 10px;
          color: #fff;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .book-title-input:focus {
          outline: none;
          border-color: #ff0000;
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
        }

        .book-prompt-input {
          width: 100%;
          padding: 1.5rem;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 0, 0, 0.3);
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          line-height: 1.6;
          resize: vertical;
          min-height: 150px;
          transition: all 0.3s ease;
        }

        .book-prompt-input:focus {
          outline: none;
          border-color: #ff0000;
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
        }

        .book-prompt-input::placeholder,
        .book-title-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .prompt-hint {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: rgba(0, 212, 255, 0.7);
        }

        /* Generate Button */
        .generate-book-btn {
          width: 100%;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
          border: none;
          border-radius: 15px;
          color: #fff;
          font-family: var(--font-creepster), cursive;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          transition: all 0.3s ease;
          letter-spacing: 0.1em;
          box-shadow: 0 5px 30px rgba(255, 0, 0, 0.4);
        }

        .generate-book-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 40px rgba(255, 0, 0, 0.6);
        }

        .generate-book-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .generate-book-btn.generating {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .btn-icon {
          font-size: 1.8rem;
          animation: bookPulse 1s infinite alternate;
        }

        @keyframes bookPulse {
          from { transform: rotate(-5deg); }
          to { transform: rotate(5deg); }
        }

        .generate-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ff0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Progress Bar */
        .generation-progress {
          margin-top: 2rem;
          text-align: center;
        }

        .progress-bar {
          height: 20px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 0, 0, 0.3);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff0000, #ff6600, #ff0000);
          background-size: 200% 100%;
          animation: progressGlow 2s linear infinite;
          transition: width 0.5s ease;
          border-radius: 10px;
        }

        @keyframes progressGlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        .progress-status {
          margin-top: 1rem;
          color: #00d4ff;
          font-size: 1.1rem;
          text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }

        .progress-percent {
          margin-top: 0.5rem;
          font-family: var(--font-creepster), cursive;
          font-size: 2rem;
          color: #ff0000;
          text-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        }

        .chapter-progress {
          margin-top: 0.5rem;
          color: #ff6600;
          font-size: 1rem;
          font-weight: bold;
        }

        /* My Books Section */
        .my-books-section {
          margin-top: 3rem;
          padding: 2rem;
          background: rgba(20, 0, 0, 0.6);
          border: 2px solid rgba(255, 0, 0, 0.2);
          border-radius: 20px;
        }

        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 1.5rem;
        }

        /* New Book Card with Cover Image */
        .book-card-new {
          position: relative;
          border-radius: 15px;
          overflow: hidden;
          transition: all 0.4s ease;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.6);
          background: #0a0a0a;
        }

        .book-card-new.clickable {
          cursor: pointer;
        }

        .book-card-new:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 15px 40px rgba(255, 0, 0, 0.4), 0 0 30px rgba(255, 0, 0, 0.2);
        }

        .book-cover-image {
          position: relative;
          width: 100%;
          padding-bottom: 100%; /* 1:1 aspect ratio */
          overflow: hidden;
        }

        .cover-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .book-card-new:hover .cover-img {
          transform: scale(1.1);
        }

        .book-title-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.5rem 1rem;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.95));
          text-align: center;
        }

        .overlay-title {
          font-family: var(--font-creepster), cursive;
          font-size: 1.2rem;
          color: #fff;
          text-shadow: 0 0 15px rgba(255, 0, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
          display: block;
          line-height: 1.3;
        }

        .generating-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .generating-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 0, 0, 0.3);
          border-top-color: #ff0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .book-meta {
          padding: 1rem;
          background: rgba(20, 0, 0, 0.9);
          text-align: center;
        }

        .meta-chapters {
          font-size: 0.85rem;
          color: #00d4ff;
          margin-bottom: 0.25rem;
        }

        .meta-date {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Keep old styles for backwards compatibility */
        .book-card {
          background: linear-gradient(135deg, rgba(30, 0, 0, 0.8) 0%, rgba(20, 0, 20, 0.8) 100%);
          border: 2px solid var(--book-color);
          border-radius: 15px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        }

        .book-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 10px 30px var(--book-color), 0 0 20px var(--book-color);
        }

        .book-cover {
          height: 100px;
          background: linear-gradient(135deg, var(--book-color), rgba(0, 0, 0, 0.5));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .book-icon {
          font-size: 3rem;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
        }

        .book-info {
          padding: 1.5rem;
        }

        .book-title {
          font-family: var(--font-creepster), cursive;
          font-size: 1.3rem;
          color: #fff;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
        }

        .book-category {
          color: var(--book-color);
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .book-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .book-date {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.5rem;
        }

        .book-status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .book-status.completed {
          background: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
          border: 1px solid #2ecc71;
        }

        .book-status.generating {
          background: rgba(241, 196, 15, 0.2);
          color: #f1c40f;
          border: 1px solid #f1c40f;
          animation: pulse 1s infinite;
        }

        .book-status.failed {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
          border: 1px solid #e74c3c;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Demogorgon */
        .demogorgon-section {
          margin-top: 4rem;
          text-align: center;
        }

        .demogorgon {
          display: inline-block;
          animation: demoFloat 3s infinite ease-in-out;
        }

        @keyframes demoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .demohead {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .petal {
          position: absolute;
          width: 30px;
          height: 60px;
          background: linear-gradient(to top, #3a0000, #ff0000);
          border-radius: 50% 50% 50% 50% / 80% 80% 20% 20%;
          transform-origin: center bottom;
          left: 25px;
          bottom: 10px;
          animation: petalOpen 2s infinite ease-in-out;
        }

        .petal:nth-child(1) { transform: rotate(0deg); animation-delay: 0s; }
        .petal:nth-child(2) { transform: rotate(72deg); animation-delay: 0.1s; }
        .petal:nth-child(3) { transform: rotate(144deg); animation-delay: 0.2s; }
        .petal:nth-child(4) { transform: rotate(216deg); animation-delay: 0.3s; }
        .petal:nth-child(5) { transform: rotate(288deg); animation-delay: 0.4s; }

        @keyframes petalOpen {
          0%, 100% { transform: rotate(var(--base-rotation, 0deg)); }
          50% { transform: rotate(calc(var(--base-rotation, 0deg) + 10deg)); }
        }

        .demo-text {
          margin-top: 1rem;
          color: rgba(255, 0, 0, 0.6);
          font-style: italic;
          font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .stranger-title {
            font-size: 2rem;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .generate-book-btn {
            font-size: 1.2rem;
            padding: 1rem 1.5rem;
          }

          .exit-portal-btn {
            top: 1rem;
            right: 1rem;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
