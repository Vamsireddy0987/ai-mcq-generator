import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs";
import { chunkText } from "./chunking.ts";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.mjs";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  let documentId: string | null = null;
  const startTime = performance.now();

  try {
    const { document_id, user_id, storage_path } = await req.json();
    documentId = document_id;

    if (!documentId || !storage_path || !user_id) {
      throw new Error("Missing required parameters.");
    }

    console.log(`[Processing] Started extraction for document: ${documentId}`);

    // Update status to 'extracting'
    await supabase.from('documents').update({ status: 'extracting' }).eq('id', documentId);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdfs')
      .download(storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Backend Validation 1: Max file size 20MB
    if (fileData.size > 20 * 1024 * 1024) {
      throw new Error("File exceeds 20MB limit.");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    // Backend Validation 2: Max 300 pages
    if (numPages > 300) {
      throw new Error("Document exceeds 300 page limit.");
    }

    console.log(`[Processing] PDF loaded. Total pages: ${numPages}`);

    // Refactor: Extract page-by-page into an array instead of string concatenation
    const pageTexts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      pageTexts.push(pageText);
    }

    // Join everything at the very end to save memory
    const rawText = pageTexts.join("\n");

    const cleanText = rawText
      .replace(/\u0000/g, '') 
      .replace(/\s+/g, ' ')   
      .trim();

    // Backend Validation 3: Minimum text threshold
    if (cleanText.length < 1000) {
      throw new Error("Insufficient text (less than 1000 characters). Ensure this is not an image-only PDF.");
    }

    console.log(`[Success] Extracted ${cleanText.length} characters.`);

    // --- STEP 2: CHUNKING SERVICE ---
    // Chunk the text into 2000-token chunks with 200-token overlaps
    const chunks = chunkText(cleanText, 2000, 200);
    console.log(`[Chunking] Created ${chunks.length} chunks.`);

    const processingTimeMs = Math.round(performance.now() - startTime);

    // Save extracted text and metadata, and move status to 'generating'
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'generating',
        extracted_text: cleanText,
        page_count: numPages,
        char_count: cleanText.length,
        processing_time_ms: processingTimeMs
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to save extracted text metadata: ${updateError.message}`);
    }

    // --- STEP 3: GEMINI AI GENERATION ---
    // Hardcoded parameters until UI is built to pass these
    const requestedDifficulty = 'medium';
    const requestedCount = 10;
    
    // Process chunks concurrently with max 3
    const { processAllChunks } = await import("./gemini.ts");
    const generatedQuestions = await processAllChunks(chunks, requestedCount, requestedDifficulty);

    // Partial Failure threshold: Must get at least 50% of what was requested
    if (generatedQuestions.length < Math.floor(requestedCount / 2)) {
      throw new Error(`Failed to generate enough valid questions. Only got ${generatedQuestions.length}/${requestedCount}.`);
    }

    // --- STEP 4: DATABASE INSERTS ---
    console.log(`[Database] Inserting Quiz record...`);
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user_id,
        document_id: documentId,
        title: `${fileData.name.replace('.pdf', '')} Quiz`,
        difficulty: requestedDifficulty
      })
      .select('id')
      .single();

    if (quizError || !quizData) throw new Error(`Quiz creation failed: ${quizError?.message}`);

    console.log(`[Database] Bulk inserting ${generatedQuestions.length} questions...`);
    const questionsToInsert = generatedQuestions.map(q => ({
      quiz_id: quizData.id,
      question_text: q.question,
      options: q.options,
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw new Error(`Questions insertion failed: ${questionsError.message}`);

    // Update final document status
    await supabase.from('documents').update({ status: 'completed' }).eq('id', documentId);
    console.log(`[Success] Process completed for document ${documentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      questions_generated: generatedQuestions.length,
      processing_time_ms: processingTimeMs
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[Error] Processing failed: ${error.message}`);
    
    if (documentId) {
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
