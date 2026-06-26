import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Initialize Supabase Client
  const supabaseUrl = process.env.SUPABASE_URL || "https://hujzpbtxrjagdqteqpmr.supabase.co";
  const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_wRGreoC2ku-7MPCg1OlFrw_quIWUVOR"; // Uses provided key by default
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // API Route to submit exam data
  app.post("/api/exams/submit", async (req, res) => {
    try {
      const { candidateInfo, result } = req.body;
      
      const { data, error } = await supabase
        .from("exam_results")
        .insert([
          {
            candidate_id: candidateInfo.id,
            candidate_name: candidateInfo.name,
            exam_title: candidateInfo.examTitle,
            subject: candidateInfo.subject,
            score: result.score,
            total_points: result.totalPoints,
            percentage: result.percentage,
            time_spent_seconds: result.timeSpent,
            correct_count: result.correctCount,
            incorrect_count: result.incorrectCount,
            unanswered_count: result.unansweredCount,
            mcq_breakdown: result.mcqBreakdown
          }
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
       console.error("Server error:", error);
       res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
