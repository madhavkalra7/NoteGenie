import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BookChapter {
  title: string;
  content: string;
}

interface BookStructure {
  title: string;
  author: string;
  category: string;
  chapters: BookChapter[];
}

// Generate chapter content with detailed writing
async function generateChapterContent(
  title: string,
  bookTitle: string,
  category: string,
  prompt: string,
  chapterNumber: number,
  totalChapters: number,
  previousChapterSummary: string
): Promise<{ content: string; tokens: { prompt: number; completion: number; total: number } }> {
  console.log(`\n📖 [Chapter ${chapterNumber}/${totalChapters}] Starting: "${title}"`);
  const startTime = Date.now();
  
  const categoryPrompts: Record<string, string> = {
    'sci-fi': 'Write in a vivid science fiction style with detailed world-building, futuristic technology, and thought-provoking themes.',
    'fantasy': 'Write in an epic fantasy style with rich magic systems, mythical creatures, and heroic journeys.',
    'adventure': 'Write in an action-packed adventure style with thrilling sequences, exploration, and brave protagonists.',
    'horror': 'Write in a chilling horror style with atmospheric dread, psychological tension, and terrifying revelations.',
    'mystery': 'Write in a gripping mystery style with clues, red herrings, and building suspense towards revelation.',
    'romance': 'Write in an emotionally engaging romance style with deep character connections and heartfelt moments.',
    'education': 'Write in an informative yet engaging educational style, explaining concepts clearly with examples.',
    'biography': 'Write in a compelling biographical style, bringing the subject to life with vivid details and insights.',
  };

  const styleGuide = categoryPrompts[category] || 'Write in an engaging narrative style.';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a masterful author writing a ${category} book titled "${bookTitle}". 
${styleGuide}

IMPORTANT GUIDELINES:
- Write detailed, immersive prose with rich descriptions
- Create vivid scenes with sensory details
- Develop compelling characters with distinct voices
- Maintain consistent pacing and tension
- Each chapter should be approximately 2000-3000 words
- Use proper paragraph breaks for readability
- Include dialogue where appropriate
- Build on previous chapter context for continuity`
      },
      {
        role: 'user',
        content: `Write Chapter ${chapterNumber} of ${totalChapters}: "${title}"

BOOK PREMISE: ${prompt}

${previousChapterSummary ? `PREVIOUS CHAPTER SUMMARY: ${previousChapterSummary}` : 'This is the opening chapter - establish the world and introduce key elements.'}

Write a complete, detailed chapter of approximately 2500 words. Include vivid descriptions, character development, and advance the plot meaningfully. Do not include the chapter title - just the content.`
      }
    ],
    max_tokens: 4000,
    temperature: 0.8,
  });

  const content = response.choices[0].message.content || '';
  const tokens = {
    prompt: response.usage?.prompt_tokens || 0,
    completion: response.usage?.completion_tokens || 0,
    total: response.usage?.total_tokens || 0,
  };
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const wordCount = content.split(/\s+/).length;
  
  console.log(`✅ [Chapter ${chapterNumber}] Complete in ${elapsed}s`);
  console.log(`   📝 Words: ${wordCount} | Tokens: ${tokens.total} (prompt: ${tokens.prompt}, completion: ${tokens.completion})`);
  
  return { content, tokens };
}

// Generate chapter summary for continuity
async function generateChapterSummary(chapterContent: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Summarize the key plot points, character developments, and important details from this chapter in 2-3 sentences for continuity purposes.'
      },
      {
        role: 'user',
        content: chapterContent
      }
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  return response.choices[0].message.content || '';
}

// Generate book outline
async function generateBookOutline(title: string, category: string, prompt: string, chapterCount: number = 18): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional book planner. Create a detailed chapter outline for a ${category} book. 
The book should have a compelling narrative arc with proper pacing.
Return ONLY a JSON array of chapter titles (exactly ${chapterCount} chapters).
Example: ["Chapter 1: The Beginning", "Chapter 2: Rising Action", ...]`
      },
      {
        role: 'user',
        content: `Create a chapter outline for a book titled "${title}".
Book Description: ${prompt}
Category: ${category}

Return a JSON array of exactly ${chapterCount} chapter titles that tell a complete story with proper structure (introduction, rising action, climax, falling action, resolution).`
      }
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '[]';
  try {
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      const chapters = JSON.parse(match[0]);
      // Ensure we return exactly the requested number of chapters
      return chapters.slice(0, chapterCount);
    }
    return [];
  } catch {
    // Fallback chapters if parsing fails - generate based on count
    const fallbackChapters = [];
    for (let i = 1; i <= chapterCount; i++) {
      fallbackChapters.push(`Chapter ${i}: Part ${i}`);
    }
    return fallbackChapters;
  }
}

// Create PDF from book content
async function createBookPDF(book: BookStructure): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // A4 size in points (595.28 x 841.89, but we'll use standard values)
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 72; // 1 inch margins
  const lineHeight = 14;
  const titleFontSize = 24;
  const chapterTitleSize = 18;
  const bodyFontSize = 11;

  // Page 1: Cover Image (Note Genie First Page.jpg) - No text overlay
  try {
    const coverImagePath = path.join(process.cwd(), 'public', 'Note Genie First Page.jpg');
    const coverImageBytes = fs.readFileSync(coverImagePath);
    const coverImage = await pdfDoc.embedJpg(coverImageBytes);
    
    const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Draw cover image to fill the entire page - NO TEXT
    coverPage.drawImage(coverImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
    
    console.log('✅ Cover page with Note Genie First Page.jpg added');
  } catch (err) {
    console.error('⚠️ Could not load cover image:', err);
  }

  // Page 2: Title Page with book title, category, and author
  const titlePage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Draw elegant title page
  const titleWidth = timesRomanBoldFont.widthOfTextAtSize(book.title, 36);
  titlePage.drawText(book.title, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight / 2 + 100,
    size: 36,
    font: timesRomanBoldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  // Decorative line under title
  titlePage.drawLine({
    start: { x: pageWidth / 4, y: pageHeight / 2 + 70 },
    end: { x: (pageWidth * 3) / 4, y: pageHeight / 2 + 70 },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  // Category text
  const categoryText = `A ${book.category} Novel`;
  const categoryWidth = timesRomanItalicFont.widthOfTextAtSize(categoryText, 18);
  titlePage.drawText(categoryText, {
    x: (pageWidth - categoryWidth) / 2,
    y: pageHeight / 2 + 30,
    size: 18,
    font: timesRomanItalicFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Author text at bottom
  const authorText = `Generated by NoteGenie AI`;
  const authorWidth = timesRomanFont.widthOfTextAtSize(authorText, 14);
  titlePage.drawText(authorText, {
    x: (pageWidth - authorWidth) / 2,
    y: 100,
    size: 14,
    font: timesRomanFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  console.log('✅ Title page added')

  // Table of Contents
  const tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let tocY = pageHeight - margin;
  
  tocPage.drawText('Table of Contents', {
    x: margin,
    y: tocY,
    size: titleFontSize,
    font: timesRomanBoldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  tocY -= 40;

  book.chapters.forEach((chapter, index) => {
    if (tocY < margin) {
      // Would need new TOC page for very long books
      return;
    }
    tocPage.drawText(chapter.title, {
      x: margin,
      y: tocY,
      size: 12,
      font: timesRomanFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    tocY -= 20;
  });

  // Chapter Pages
  for (const chapter of book.chapters) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    const textWidth = pageWidth - 2 * margin;

    // Chapter Title
    currentPage.drawText(chapter.title, {
      x: margin,
      y: yPosition,
      size: chapterTitleSize,
      font: timesRomanBoldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPosition -= 40;

    // Split content into paragraphs
    const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/);
      let line = '';

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = timesRomanFont.widthOfTextAtSize(testLine, bodyFontSize);

        if (testWidth > textWidth) {
          // Draw current line
          if (yPosition < margin + 20) {
            // Add page number
            const pageNum = pdfDoc.getPageCount().toString();
            const pageNumWidth = timesRomanFont.widthOfTextAtSize(pageNum, 10);
            currentPage.drawText(pageNum, {
              x: (pageWidth - pageNumWidth) / 2,
              y: 30,
              size: 10,
              font: timesRomanFont,
              color: rgb(0.5, 0.5, 0.5),
            });

            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }

          currentPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: bodyFontSize,
            font: timesRomanFont,
            color: rgb(0.15, 0.15, 0.15),
          });
          yPosition -= lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      }

      // Draw remaining line
      if (line) {
        if (yPosition < margin + 20) {
          const pageNum = pdfDoc.getPageCount().toString();
          const pageNumWidth = timesRomanFont.widthOfTextAtSize(pageNum, 10);
          currentPage.drawText(pageNum, {
            x: (pageWidth - pageNumWidth) / 2,
            y: 30,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
          });

          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        currentPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: rgb(0.15, 0.15, 0.15),
        });
        yPosition -= lineHeight;
      }

      // Paragraph spacing
      yPosition -= lineHeight * 0.5;
    }

    // Add page number to last page of chapter
    const pageNum = pdfDoc.getPageCount().toString();
    const pageNumWidth = timesRomanFont.widthOfTextAtSize(pageNum, 10);
    currentPage.drawText(pageNum, {
      x: (pageWidth - pageNumWidth) / 2,
      y: 30,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // The End page
  const endPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const endText = 'THE END';
  const endWidth = timesRomanBoldFont.widthOfTextAtSize(endText, 24);
  endPage.drawText(endText, {
    x: (pageWidth - endWidth) / 2,
    y: pageHeight / 2,
    size: 24,
    font: timesRomanBoldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  const thanksText = 'Thank you for reading this AI-generated book by NoteGenie';
  const thanksWidth = timesRomanItalicFont.widthOfTextAtSize(thanksText, 12);
  endPage.drawText(thanksText, {
    x: (pageWidth - thanksWidth) / 2,
    y: pageHeight / 2 - 40,
    size: 12,
    font: timesRomanItalicFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

// Streaming endpoint for real-time progress
export async function POST(request: NextRequest) {
  const { category, title, prompt, userId, chapterCount: requestedChapters } = await request.json();

  if (!category || !title || !prompt) {
    return NextResponse.json(
      { error: 'Category, title, and prompt are required' },
      { status: 400 }
    );
  }

  // Use requested chapter count or default to 18
  const targetChapterCount = requestedChapters || 18;

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE messages
  const sendProgress = async (type: string, data: Record<string, unknown>) => {
    const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Start the generation process in background
  (async () => {
    console.log('\n' + '='.repeat(60));
    console.log(`📚 BOOK GENERATION STARTED`);
    console.log(`   Title: "${title}"`);
    console.log(`   Category: ${category}`);
    console.log(`   Chapters: ${targetChapterCount}`);
    console.log(`   User: ${userId || 'anonymous'}`);
    console.log('='.repeat(60));
    const bookStartTime = Date.now();
    let totalTokensUsed = 0;
    
    try {
      let bookId: string | null = null;

      // Create book record in database if userId provided
      if (userId) {
        console.log(`📁 Creating book record in database for user: ${userId}`);
        const { data: bookRecord, error: insertError } = await supabase
          .from('generated_books')
          .insert({
            user_id: userId,
            title,
            category,
            prompt,
            status: 'generating',
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('❌ Database insert error:', insertError.message);
          console.error('   Code:', insertError.code);
          console.error('   Details:', insertError.details);
          console.error('   Hint:', insertError.hint);
          // Continue without database - book will still generate
        } else if (bookRecord) {
          bookId = bookRecord.id;
          console.log(`✅ Book record created with ID: ${bookId}`);
        }
      }

      await sendProgress('start', { message: '🌀 Opening the portal to infinite stories...', progress: 2 });

      // Generate chapter outline
      await sendProgress('outline', { message: '📋 Crafting the narrative structure...', progress: 5 });
      const chapterTitles = await generateBookOutline(title, category, prompt, targetChapterCount);
      await sendProgress('outline_done', { 
        message: `📖 Outlined ${chapterTitles.length} chapters`, 
        progress: 8,
        totalChapters: chapterTitles.length 
      });

      // Generate each chapter
      const chapters: BookChapter[] = [];
      let previousSummary = '';
      const totalChapters = chapterTitles.length;

      for (let i = 0; i < totalChapters; i++) {
        const chapterProgress = 8 + ((i + 1) / totalChapters) * 80;
        
        await sendProgress('chapter_start', { 
          message: `✍️ Writing Chapter ${i + 1}/${totalChapters}: ${chapterTitles[i]}`,
          progress: Math.round(chapterProgress - 3),
          currentChapter: i + 1,
          chapterTitle: chapterTitles[i]
        });

        const result = await generateChapterContent(
          chapterTitles[i],
          title,
          category,
          prompt,
          i + 1,
          totalChapters,
          previousSummary
        );

        chapters.push({
          title: chapterTitles[i],
          content: result.content,
        });

        const wordCount = result.content.split(/\s+/).length;
        await sendProgress('chapter_done', { 
          message: `✅ Chapter ${i + 1} complete (${wordCount} words, ${result.tokens.total} tokens)`,
          progress: Math.round(chapterProgress),
          currentChapter: i + 1,
          wordCount,
          tokens: result.tokens
        });

        // Generate summary for next chapter
        if (i < totalChapters - 1) {
          previousSummary = await generateChapterSummary(result.content);
        }
      }

      // Create PDF
      await sendProgress('pdf_start', { message: '📄 Generating PDF...', progress: 90 });

      const book: BookStructure = {
        title,
        author: 'NoteGenie AI',
        category,
        chapters,
      };

      const pdfBytes = await createBookPDF(book);
      const pageCount = Math.ceil(pdfBytes.length / 3000);

      await sendProgress('pdf_done', { 
        message: '📚 PDF created successfully!', 
        progress: 95,
        pageCount 
      });

      // Validate PDF bytes before encoding
      console.log(`📄 PDF bytes length: ${pdfBytes.length}, first 4 bytes: ${Array.from(pdfBytes.slice(0, 4)).join(',')}`);
      
      // Check if PDF is valid (should start with %PDF)
      const pdfHeader = String.fromCharCode(...pdfBytes.slice(0, 4));
      if (pdfHeader !== '%PDF') {
        console.error('❌ Invalid PDF generated! Header:', pdfHeader);
      } else {
        console.log('✅ Valid PDF header detected: %PDF');
      }

      // Send the PDF as base64
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      console.log(`📦 PDF base64 size: ${(pdfBase64.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📦 PDF base64 first 50 chars: ${pdfBase64.substring(0, 50)}`);

      // Update database with completed book AND save PDF data
      if (bookId) {
        console.log(`💾 Saving PDF to database for book: ${bookId}`);
        const { error: updateError } = await supabase
          .from('generated_books')
          .update({
            status: 'completed',
            chapter_count: chapters.length,
            page_count: pageCount,
            pdf_data: pdfBase64,
          })
          .eq('id', bookId);
        
        if (updateError) {
          console.error('❌ Error saving PDF to database:', updateError.message);
          console.error('   Error details:', JSON.stringify(updateError));
        } else {
          console.log('✅ PDF saved to database successfully');
        }
      } else {
        console.error('❌ No bookId available to save PDF!');
      }
      
      const totalTime = ((Date.now() - bookStartTime) / 1000 / 60).toFixed(1);
      console.log('\n' + '='.repeat(60));
      console.log(`🎉 BOOK GENERATION COMPLETE!`);
      console.log(`   Title: "${title}"`);
      console.log(`   Chapters: ${chapters.length}`);
      console.log(`   Pages: ${pageCount}`);
      console.log(`   Total Time: ${totalTime} minutes`);
      console.log('='.repeat(60) + '\n');

      await sendProgress('complete', { 
        message: '🎉 Your book has emerged from the Upside Down!', 
        progress: 100,
        pdf: pdfBase64,
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}_by_NoteGenie.pdf`,
        bookId,
        chapterCount: chapters.length,
        pageCount
      });

    } catch (error: unknown) {
      console.error('Book generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await sendProgress('error', { 
        message: '❌ The Demogorgon intercepted your book... Try again!',
        error: errorMessage
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// GET endpoint to fetch user's books or single book PDF
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const bookId = searchParams.get('bookId');

  // If bookId is provided, fetch single book with PDF data
  if (bookId) {
    const returnAs = searchParams.get('returnAs'); // 'binary' or 'json'
    
    console.log(`📖 Fetching PDF for book: ${bookId}, returnAs: ${returnAs || 'json'}`);
    
    const { data: book, error } = await supabase
      .from('generated_books')
      .select('id, title, category, chapter_count, page_count, status, pdf_data, created_at')
      .eq('id', bookId)
      .single();

    if (error || !book) {
      console.error('❌ Error fetching book:', error?.message);
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    console.log(`📖 Book found: ${book.title}, status: ${book.status}, has pdf_data: ${!!book.pdf_data}, pdf_data length: ${book.pdf_data?.length || 0}`);

    if (!book.pdf_data) {
      console.error('❌ PDF data is null for book:', book.title);
      return NextResponse.json({ error: 'PDF not available for this book' }, { status: 404 });
    }

    console.log(`✅ PDF found for book: ${book.title}, size: ${(book.pdf_data.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📄 PDF data first 100 chars: ${book.pdf_data.substring(0, 100)}`);
    
    // Check if data is hex-encoded (starts with \x or looks like hex)
    let pdfBase64 = book.pdf_data;
    
    // If it starts with \x, it's hex-encoded, need to convert
    if (book.pdf_data.startsWith('\\x')) {
      console.log('📄 Detected hex-encoded data, converting to base64...');
      // Remove \x prefix and convert hex to buffer, then to base64
      const hexString = book.pdf_data.slice(2); // Remove \x
      const buffer = Buffer.from(hexString, 'hex');
      pdfBase64 = buffer.toString('utf8'); // This should give us the original base64
      console.log(`📄 Converted base64 first 100 chars: ${pdfBase64.substring(0, 100)}`);
    }
    
    // Validate base64 - check if it starts with PDF header when decoded
    try {
      const testBuffer = Buffer.from(pdfBase64.substring(0, 20), 'base64');
      const header = String.fromCharCode(...testBuffer.slice(0, 4));
      console.log(`📄 Decoded header check: "${header}" (should be %PDF)`);
      if (header !== '%PDF') {
        console.error(`❌ CORRUPT PDF! Header is "${header}" instead of "%PDF"`);
      }
    } catch (e) {
      console.error('❌ Error testing base64:', e);
    }
    
    // Return as binary PDF file
    if (returnAs === 'binary') {
      try {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        console.log(`📄 Returning PDF as binary, buffer size: ${pdfBuffer.length} bytes`);
        
        return new Response(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (err) {
        console.error('❌ Error converting base64 to buffer:', err);
        return NextResponse.json({ error: 'Failed to decode PDF' }, { status: 500 });
      }
    }
    
    // Return as JSON (default)
    return NextResponse.json({ 
      book: {
        id: book.id,
        title: book.title,
        category: book.category,
        chapter_count: book.chapter_count,
        page_count: book.page_count,
        status: book.status,
        created_at: book.created_at,
      },
      pdf: pdfBase64 
    });
  }

  // Otherwise, fetch all books for user (without PDF data for performance)
  // Only return completed books that have PDF data
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  console.log(`📚 Fetching books for user: ${userId}`);

  const { data: books, error } = await supabase
    .from('generated_books')
    .select('id, title, category, chapter_count, page_count, status, created_at, pdf_data')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('pdf_data', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Database error fetching books:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    // Return empty array instead of error to not break UI
    return NextResponse.json({ books: [], error: error.message });
  }

  // Remove pdf_data from response (just check if it exists)
  const booksWithoutPdfData = (books || []).map(book => ({
    id: book.id,
    title: book.title,
    category: book.category,
    chapter_count: book.chapter_count,
    page_count: book.page_count,
    status: book.status,
    created_at: book.created_at,
  }));

  console.log(`✅ Found ${booksWithoutPdfData.length} books with PDF for user`);
  return NextResponse.json({ books: booksWithoutPdfData });
}

// DELETE endpoint to delete a book
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ error: 'Book ID required' }, { status: 400 });
  }

  console.log(`🗑️ Deleting book: ${bookId}`);

  const { error } = await supabase
    .from('generated_books')
    .delete()
    .eq('id', bookId);

  if (error) {
    console.error('❌ Error deleting book:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`✅ Book deleted: ${bookId}`);
  return NextResponse.json({ success: true });
}