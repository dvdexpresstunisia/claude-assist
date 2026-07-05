import React, { useState, useEffect, useRef } from "react";
import { Chapter, UserProgress } from "../types";
import { 
  Play, Sparkles, Terminal, CheckCircle2, XCircle, Info, RefreshCw, ArrowRight,
  Award, Trophy, Zap, Copy, Check, ChevronDown, ChevronUp, Mic, MicOff, Lock, Clock, Timer,
  Volume2, VolumeX
} from "lucide-react";
import PromptHistory, { PromptIteration } from "./PromptHistory";
import PromptProgressionChart from "./PromptProgressionChart";
import ChapterQuiz from "./ChapterQuiz";

interface ExercisePanelProps {
  chapter: Chapter;
  progress: UserProgress | undefined;
  onSaveProgress: (progress: UserProgress) => void;
  onNextChapter: () => void;
}

export default function ExercisePanel({
  chapter,
  progress,
  onSaveProgress,
  onNextChapter,
}: ExercisePanelProps) {
  // Modes: "exercice" or "playground"
  const [mode, setMode] = useState<"exercice" | "playground">("exercice");

  // Timed challenge states
  const [isTimedChallengeActive, setIsTimedChallengeActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timedChallengeStatus, setTimedChallengeStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const timerRef = useRef<any>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset timer state when chapter changes or mode changes
  useEffect(() => {
    setIsTimedChallengeActive(false);
    setTimeLeft(60);
    setTimedChallengeStatus("idle");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [chapter.id, mode]);

  useEffect(() => {
    if (timedChallengeStatus === "running") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimedChallengeStatus("failed");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timedChallengeStatus]);

  const startTimedChallenge = () => {
    // Reset output and results
    setActualOutput("");
    setEvalResult(null);
    
    // Set system instructions and user prompt to initial values so they start fresh
    setSystemPrompt(chapter.initialSystemPrompt);
    setUserPrompt(chapter.initialUserPrompt);
    setPrefill(chapter.initialPrefill);

    setIsTimedChallengeActive(true);
    setTimeLeft(60);
    setTimedChallengeStatus("running");
  };

  const cancelTimedChallenge = () => {
    setIsTimedChallengeActive(false);
    setTimeLeft(60);
    setTimedChallengeStatus("idle");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Input states
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [prefill, setPrefill] = useState("");

  // Loading states
  const [isRunning, setIsRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Output states
  const [actualOutput, setActualOutput] = useState("");
  const [evalResult, setEvalResult] = useState<{
    score: number;
    passed: boolean;
    feedback: string;
    clarityScore?: number;
    concisenessScore?: number;
    optimalVersion?: string;
  } | null>(null);

  // Toggle for showing the optimal suggestion
  const [showOptimal, setShowOptimal] = useState(false);
  const [copiedOptimal, setCopiedOptimal] = useState(false);

  // Dictation states (Voice input for prompts)
  const [activeDictationField, setActiveDictationField] = useState<"system" | "user" | null>(null);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const dictationRecognitionRef = useRef<any>(null);

  // Clean up active dictation on unmount
  useEffect(() => {
    return () => {
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Text-to-Speech (TTS) Google Translate-like states and functions
  const [speakingSource, setSpeakingSource] = useState<"system" | "user" | "prefill" | "output" | null>(null);
  const [ttsSpeed, setTtsSpeed] = useState<1 | 0.75 | 1.25>(1);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingSource(null);
  };

  const toggleTtsSpeed = () => {
    setTtsSpeed((prev) => {
      if (prev === 1) return 0.75;
      if (prev === 0.75) return 1.25;
      return 1;
    });
  };

  const speakText = (text: string, source: "system" | "user" | "prefill" | "output") => {
    if (!text) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // If currently speaking this source, stop
    if (speakingSource === source) {
      stopSpeaking();
      return;
    }

    // Stop any other active speaking first
    window.speechSynthesis.cancel();

    // Clean text of simple markdown symbols so speech synthesis sounds more natural
    const cleanText = text.replace(/[*_`#\-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    utterance.rate = ttsSpeed;

    // Find French voice if available, preferring Microsoft Paul - French (France) (fr-FR)
    const voices = window.speechSynthesis.getVoices();
    let targetVoice = voices.find(
      (v) =>
        v.name === "Microsoft Paul - French (France) (fr-FR)" ||
        v.name.includes("Microsoft Paul") ||
        (v.name.includes("Paul") && v.lang.startsWith("fr"))
    );
    if (!targetVoice) {
      targetVoice = voices.find((v) => v.lang.startsWith("fr"));
    }
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => {
      setSpeakingSource(null);
    };
    utterance.onerror = () => {
      setSpeakingSource(null);
    };

    setSpeakingSource(source);
    window.speechSynthesis.speak(utterance);
  };

  // Automatically cancel speaking when chapter, mode, or output changes
  useEffect(() => {
    stopSpeaking();
  }, [chapter.id, mode, actualOutput]);

  // Make sure we cancel on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleDictation = (field: "system" | "user") => {
    setDictationError(null);
    
    // If we are already dictating for the same field, stop it.
    if (activeDictationField === field) {
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.stop();
        } catch (e) {
          console.error("Failed to stop dictation", e);
        }
      }
      setActiveDictationField(null);
      return;
    }

    // If we are dictating for another field, stop that one first.
    if (activeDictationField && dictationRecognitionRef.current) {
      try {
        dictationRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "fr-FR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setActiveDictationField(field);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim() !== "") {
          if (field === "system") {
            setSystemPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setUserPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
      };

      rec.onerror = (event: any) => {
        console.error("Dictation recognition error", event);
        if (event.error !== "no-speech") {
          setDictationError(`Erreur micro : ${event.error}`);
        }
        setActiveDictationField(null);
      };

      rec.onend = () => {
        setActiveDictationField(null);
      };

      dictationRecognitionRef.current = rec;
      rec.start();
    } catch (error) {
      console.error("Speech Recognition start error:", error);
      setDictationError("Impossible d'accéder au microphone.");
      setActiveDictationField(null);
    }
  };

  // History state
  const [history, setHistory] = useState<PromptIteration[]>([]);

  // Load history from localStorage on chapter change
  useEffect(() => {
    const saved = localStorage.getItem(`prompt_history_chapter_${chapter.id}`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  }, [chapter.id]);

  // Helper functions to save history entries
  const addRunIteration = (outputVal: string) => {
    const newIteration: PromptIteration = {
      id: "run_" + Date.now(),
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      mode,
      systemPrompt,
      userPrompt,
      prefill,
      output: outputVal,
      score: null,
      passed: null,
    };
    setHistory((prev) => {
      const updated = [newIteration, ...prev];
      localStorage.setItem(`prompt_history_chapter_${chapter.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const addEvaluateIteration = (
    outputVal: string, 
    score: number, 
    passed: boolean, 
    feedback: string,
    clarityScore?: number,
    concisenessScore?: number,
    optimalVersion?: string
  ) => {
    const newIteration: PromptIteration = {
      id: "eval_" + Date.now(),
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      mode: "exercice",
      systemPrompt,
      userPrompt,
      prefill,
      output: outputVal,
      score,
      passed,
      feedback,
      clarityScore,
      concisenessScore,
      optimalVersion,
    };
    setHistory((prev) => {
      const updated = [newIteration, ...prev];
      localStorage.setItem(`prompt_history_chapter_${chapter.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`prompt_history_chapter_${chapter.id}`);
  };

  const handleRestoreIteration = (iteration: PromptIteration) => {
    setSystemPrompt(iteration.systemPrompt);
    setUserPrompt(iteration.userPrompt);
    setPrefill(iteration.prefill);
    setActualOutput(iteration.output);
    if (iteration.score !== null) {
      setEvalResult({
        score: iteration.score,
        passed: iteration.passed ?? false,
        feedback: iteration.feedback ?? "",
        clarityScore: iteration.clarityScore,
        concisenessScore: iteration.concisenessScore,
        optimalVersion: iteration.optimalVersion,
      });
    } else {
      setEvalResult(null);
    }
  };

  // Synchronize when chapter or mode changes
  useEffect(() => {
    if (mode === "exercice") {
      setSystemPrompt(progress?.userSystemPrompt ?? chapter.initialSystemPrompt);
      setUserPrompt(progress?.userUserPrompt ?? chapter.initialUserPrompt);
      setPrefill(progress?.userPrefill ?? chapter.initialPrefill);
      setActualOutput(progress?.actualOutput ?? "");
      if (progress && progress.score > 0) {
        setEvalResult({
          score: progress.score,
          passed: progress.completed,
          feedback: progress.feedback,
          clarityScore: progress.clarityScore,
          concisenessScore: progress.concisenessScore,
          optimalVersion: progress.optimalVersion,
        });
      } else {
        setEvalResult(null);
      }
    } else {
      // Playground mode
      setSystemPrompt(chapter.demoSystemPrompt);
      setUserPrompt(chapter.demoUserPrompt);
      setPrefill(chapter.demoPrefill);
      setActualOutput("");
      setEvalResult(null);
    }
    // Collapse optimal on chapter/mode changes
    setShowOptimal(false);
  }, [chapter.id, mode, progress]);

  // Inject tips from voice assistant
  useEffect(() => {
    const handleInjectTip = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.text) {
        setUserPrompt((prev) => (prev ? `${prev}\n${customEvent.detail.text}` : customEvent.detail.text));
      }
    };
    window.addEventListener("voice_assistant_inject_tip", handleInjectTip);
    return () => {
      window.removeEventListener("voice_assistant_inject_tip", handleInjectTip);
    };
  }, []);

  // Handle running the prompt (Playground mode)
  const handleRun = async () => {
    setIsRunning(true);
    setActualOutput("");
    try {
      const customKey = localStorage.getItem("custom_gemini_api_key") || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey && customKey.trim() !== "") {
        headers["x-gemini-api-key"] = customKey.trim();
      }

      const response = await fetch("/api/run-prompt", {
        method: "POST",
        headers,
        body: JSON.stringify({ systemPrompt, userPrompt, prefill }),
      });
      const data = await response.json();
      if (response.ok) {
        const outText = (prefill ? prefill : "") + data.text;
        setActualOutput(outText);
        addRunIteration(outText);
      } else {
        const outError = `Erreur : ${data.error}`;
        setActualOutput(outError);
        addRunIteration(outError);
      }
    } catch (err: any) {
      const outError = `Erreur réseau : ${err.message}`;
      setActualOutput(outError);
      addRunIteration(outError);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle evaluating the prompt (Exercise mode)
  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setActualOutput("");
    setEvalResult(null);
    try {
      const customKey = localStorage.getItem("custom_gemini_api_key") || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey && customKey.trim() !== "") {
        headers["x-gemini-api-key"] = customKey.trim();
      }

      // Step 1: Run the prompt to get actual output
      const runRes = await fetch("/api/run-prompt", {
        method: "POST",
        headers,
        body: JSON.stringify({ systemPrompt, userPrompt, prefill }),
      });
      const runData = await runRes.json();
      if (!runRes.ok) {
        const errStr = `Erreur lors de la génération de l'output : ${runData.error}`;
        setActualOutput(errStr);
        addEvaluateIteration(errStr, 0, false, "La génération du prompt a échoué.");
        setIsEvaluating(false);
        return;
      }

      const generatedText = (prefill ? prefill : "") + runData.text;
      setActualOutput(generatedText);

      // Step 2: Evaluate the output using the AI Grader
      const evalRes = await fetch("/api/evaluate-prompt", {
        method: "POST",
        headers,
        body: JSON.stringify({
          chapterId: chapter.id,
          systemPrompt,
          userPrompt,
          prefill,
          actualOutput: generatedText,
        }),
      });
      const evalData = await evalRes.json();
      
      if (evalRes.ok) {
        setEvalResult(evalData);
        
        let isBonusEarned = false;
        let bonusAmount = 0;
        
        if (isTimedChallengeActive && timedChallengeStatus === "running" && evalData.passed) {
          isBonusEarned = true;
          bonusAmount = 20;
          setTimedChallengeStatus("success");
        }

        // Save progress to App state
        onSaveProgress({
          chapterId: chapter.id,
          completed: evalData.passed,
          score: evalData.score,
          userSystemPrompt: systemPrompt,
          userUserPrompt: userPrompt,
          userPrefill: prefill,
          feedback: evalData.feedback,
          actualOutput: generatedText,
          clarityScore: evalData.clarityScore,
          concisenessScore: evalData.concisenessScore,
          optimalVersion: evalData.optimalVersion,
          quizCompleted: progress?.quizCompleted ?? false,
          timedChallengeSuccess: isBonusEarned || (progress?.timedChallengeSuccess ?? false),
          timedChallengeBonus: isBonusEarned ? bonusAmount : (progress?.timedChallengeBonus ?? 0)
        });
        // Add to history
        addEvaluateIteration(
          generatedText, 
          evalData.score, 
          evalData.passed, 
          evalData.feedback,
          evalData.clarityScore,
          evalData.concisenessScore,
          evalData.optimalVersion
        );
      } else {
        const errStr = `Erreur d'évaluation : ${evalData.error}`;
        setEvalResult({
          score: 0,
          passed: false,
          feedback: errStr,
        });
        addEvaluateIteration(generatedText, 0, false, errStr);
      }
    } catch (err: any) {
      const errStr = `Erreur réseau : ${err.message}`;
      setEvalResult({
        score: 0,
        passed: false,
        feedback: errStr,
      });
      addEvaluateIteration("", 0, false, errStr);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save quiz completion to progress
  const handleQuizComplete = () => {
    if (progress) {
      onSaveProgress({
        ...progress,
        quizCompleted: true,
      });
    } else {
      onSaveProgress({
        chapterId: chapter.id,
        completed: false,
        score: evalResult ? evalResult.score : 0,
        userSystemPrompt: systemPrompt,
        userUserPrompt: userPrompt,
        userPrefill: prefill,
        feedback: evalResult ? evalResult.feedback : "",
        actualOutput: actualOutput,
        clarityScore: evalResult?.clarityScore,
        concisenessScore: evalResult?.concisenessScore,
        optimalVersion: evalResult?.optimalVersion,
        quizCompleted: true,
      });
    }
  };

  // Reset inputs to default values
  const handleReset = () => {
    if (mode === "exercice") {
      setSystemPrompt(chapter.initialSystemPrompt);
      setUserPrompt(chapter.initialUserPrompt);
      setPrefill(chapter.initialPrefill);
    } else {
      setSystemPrompt(chapter.demoSystemPrompt);
      setUserPrompt(chapter.demoUserPrompt);
      setPrefill(chapter.demoPrefill);
    }
    setActualOutput("");
    setEvalResult(null);
  };

  return (
    <div id="exercise-panel" className="flex flex-col h-full gap-6">
      {/* Exercise header / selector */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setMode("exercice")}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === "exercice"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/35"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🎯 Défi Pratique
          </button>
          <button
            onClick={() => setMode("playground")}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === "playground"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/35"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🧪 Exemple de Démo
          </button>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Challenge explanation */}
      {mode === "exercice" ? (
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 border border-indigo-500/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Objectif du Défi</span>
              <h3 className="font-bold text-white text-sm">{chapter.exerciseTitle}</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed whitespace-pre-line">
                {chapter.exerciseInstruction}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-850/50 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Critère : {chapter.validationCheck}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 border border-amber-500/20">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Mode Bac à Sable</span>
              <h3 className="font-bold text-white text-sm">Laboratoire d'expérimentation</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Ce bac à sable contient un exemple fonctionnel de la leçon. Modifiez librement les invites (prompts) système, utilisateur ou le pré-remplissage pour observer comment Claude/Gemini ajuste ses réponses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timed Challenge Panel */}
      {mode === "exercice" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          {/* Header */}
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  Défi Chronométré
                  <span className="bg-amber-500/10 text-amber-700 text-[9px] px-2 py-0.5 rounded-full border border-amber-200/50 font-black animate-pulse">
                    ⚡ Bonus +20 pts
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Optimisez et validez votre prompt en moins de 60 secondes !
                </p>
              </div>
            </div>

            {/* Right side stats if completed already */}
            {progress?.timedChallengeSuccess && (
              <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  Défi Réussi ! (+{progress.timedChallengeBonus} pts)
                </span>
              </div>
            )}
          </div>

          {/* Content based on state */}
          <div className="p-5">
            {progress?.timedChallengeSuccess ? (
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                Vous avez brillamment relevé ce défi chronométré ! Les points bonus ont été ajoutés à votre score global dans la barre latérale. Vous pouvez toujours vous exercer ou relancer un défi chronométré pour le plaisir.
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={startTimedChallenge}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Relancer le Chrono (60s)
                  </button>
                </div>
              </div>
            ) : timedChallengeStatus === "running" ? (
              <div className="flex flex-col gap-4">
                {/* Timer active view */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      {/* SVG Ring for remaining time */}
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          className="stroke-slate-200"
                          strokeWidth="3"
                          fill="none"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          className={`transition-all duration-1000 ${
                            timeLeft > 20
                              ? "stroke-amber-500"
                              : "stroke-rose-500 animate-pulse"
                          }`}
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={
                            2 * Math.PI * 18 * (1 - timeLeft / 60)
                          }
                        />
                      </svg>
                      <span className={`absolute font-mono text-xs font-black ${
                        timeLeft > 20 ? "text-slate-700" : "text-rose-600 animate-pulse"
                      }`}>
                        {timeLeft}s
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Chrono Activé ! Écrivez vos prompts
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Modifiez les champs ci-dessous et cliquez sur <span className="font-bold text-indigo-600">Soumettre & Évaluer</span> avant la fin du temps réglementaire !
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={cancelTimedChallenge}
                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer self-end sm:self-auto shadow-sm"
                  >
                    Abandonner
                  </button>
                </div>

                {/* Nice warning alert if time is running low */}
                {timeLeft <= 15 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Dépêchez-vous ! Moins de 15 secondes restantes !</span>
                  </div>
                )}
              </div>
            ) : timedChallengeStatus === "failed" ? (
              <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Temps écoulé !
                    </h5>
                    <p className="text-[10px] text-rose-700 font-medium mt-0.5 leading-relaxed">
                      Vous n'avez pas réussi à valider l'exercice en moins de 60 secondes. Pas de panique, vous pouvez recommencer le chrono à tout moment !
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 self-end sm:self-auto">
                  <button
                    onClick={cancelTimedChallenge}
                    className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
                  >
                    Retour
                  </button>
                  <button
                    onClick={startTimedChallenge}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retenter (60s)
                  </button>
                </div>
              </div>
            ) : timedChallengeStatus === "success" ? (
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Défi Réussi avec Brio ! 🏆
                    </h5>
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5 leading-relaxed">
                      Félicitations, vous avez optimisé votre prompt en moins d'une minute ! Un bonus de <span className="font-bold">+20 points</span> a été ajouté à votre progression.
                    </p>
                  </div>
                </div>

                <button
                  onClick={cancelTimedChallenge}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                >
                  Génial !
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-[500px]">
                  Vous pensez pouvoir optimiser ce prompt en moins d'une minute ? Lancez le chrono ! Vos modifications actuelles seront réinitialisées pour démarrer sur une base équitable.
                </p>

                <button
                  onClick={startTimedChallenge}
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <Timer className="w-4 h-4 text-slate-950" />
                  Lancer le Défi (60s)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inputs area */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
        {timedChallengeStatus === "running" && (
          <div className="bg-amber-500/10 border border-amber-200/85 text-amber-900 rounded-lg p-3 text-xs font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-4 h-4 shrink-0 ${timeLeft <= 15 ? "text-rose-600" : "text-amber-600"}`} />
              <span className={timeLeft <= 15 ? "text-rose-700 font-extrabold" : "text-slate-700"}>
                ⏱️ CHRONO ACTIF : <span className="font-mono text-sm">{timeLeft}s</span> restantes pour soumettre et évaluer votre prompt !
              </span>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              timeLeft <= 15 ? "bg-rose-600 text-white" : "bg-amber-500 text-slate-950"
            }`}>
              {timeLeft <= 15 ? "Urgent !" : "En cours"}
            </span>
          </div>
        )}

        {/* System Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Invites Système (System Instructions)
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleDictation("system")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                  activeDictationField === "system"
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
                title={activeDictationField === "system" ? "Arrêter d'écouter" : "Dicter (Saisie vocale)"}
              >
                {activeDictationField === "system" ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span>Écoute active...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-slate-500" />
                    <span>Saisie vocale</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => speakText(systemPrompt, "system")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                  speakingSource === "system"
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 animate-pulse"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:text-indigo-600"
                }`}
                title={speakingSource === "system" ? "Arrêter la lecture" : "Écouter l'invite système (Text-to-Speech)"}
              >
                {speakingSource === "system" ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-950" />
                    <span>Arrêter</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Écouter</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Consignes de comportement ou de personnalité globales du modèle..."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-3 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all resize-y"
          />
        </div>

        {/* User Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Message Utilisateur (User Prompt)
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleDictation("user")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                  activeDictationField === "user"
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
                title={activeDictationField === "user" ? "Arrêter d'écouter" : "Dicter (Saisie vocale)"}
              >
                {activeDictationField === "user" ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span>Écoute active...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-slate-500" />
                    <span>Saisie vocale</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => speakText(userPrompt, "user")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                  speakingSource === "user"
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 animate-pulse"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:text-indigo-600"
                }`}
                title={speakingSource === "user" ? "Arrêter la lecture" : "Écouter le message utilisateur (Text-to-Speech)"}
              >
                {speakingSource === "user" ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-950" />
                    <span>Arrêter</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Écouter</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="La question, les variables d'entrée ou les balises XML à traiter..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg p-3 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all resize-y"
          />
        </div>

        {/* Dictation error display if any */}
        {dictationError && (
          <div className="bg-rose-50/50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{dictationError}</span>
          </div>
        )}

        {/* Response Prefilling */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Pré-remplissage (Response Prefilling)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 italic">Optionnel</span>
              <button
                type="button"
                onClick={() => speakText(prefill, "prefill")}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                  speakingSource === "prefill"
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 animate-pulse"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:text-indigo-600"
                }`}
                title={speakingSource === "prefill" ? "Arrêter la lecture" : "Écouter le pré-remplissage (Text-to-Speech)"}
              >
                {speakingSource === "prefill" ? (
                  <>
                    <VolumeX className="w-3 h-3 text-slate-950" />
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-slate-500" />
                  </>
                )}
              </button>
            </div>
          </div>
          <input
            type="text"
            value={prefill}
            onChange={(e) => setPrefill(e.target.value)}
            placeholder="Ex : [  ou  {  ou  <thinking>  (force le modèle à commencer sa réponse par cela)"
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex gap-3">
          {mode === "exercice" ? (
            <>
              <button
                onClick={handleRun}
                disabled={isRunning || isEvaluating}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 uppercase tracking-wider"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isRunning ? "Exécution..." : "Tester"}
              </button>
              <button
                onClick={handleEvaluate}
                disabled={isRunning || isEvaluating}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isEvaluating ? "Évaluation..." : "Soumettre & Évaluer"}
              </button>
            </>
          ) : (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? "Génération..." : "Exécuter l'exemple"}
            </button>
          )}
        </div>
      </div>

      {/* Output Console & Grader results */}
      <div className="flex-1 flex flex-col gap-4 min-h-[250px]">
        {/* Terminal console */}
        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-850 shadow-lg overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2 border-b border-slate-950">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Console de sortie (Assistant)</span>
            <div className="ml-auto flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
          </div>
          {/* Output text */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap select-text leading-relaxed min-h-[140px] pb-14">
            {isRunning || isEvaluating ? (
              <div className="flex flex-col gap-1 text-indigo-400 animate-pulse">
                <p className="opacity-80">&gt; Connexion au modèle de langage...</p>
                <p className="opacity-80">&gt; Analyse des instructions...</p>
                <p className="opacity-90 font-bold">&gt; En attente de la réponse...</p>
                <div className="w-2 h-4 bg-indigo-400 animate-pulse mt-1" />
              </div>
            ) : actualOutput ? (
              <span className="text-emerald-400">{actualOutput}</span>
            ) : (
              <span className="text-slate-500 italic">La réponse du modèle s'affichera ici après exécution...</span>
            )}
          </div>

          {/* Google Translate style audio player and tools */}
          {actualOutput && !isRunning && !isEvaluating && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5 shadow-xl transition-all hover:border-indigo-500/40 z-10 animate-in fade-in zoom-in-95 duration-200">
              {/* TTS Speed Selector */}
              <button
                type="button"
                onClick={toggleTtsSpeed}
                className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 border border-slate-850 transition-all cursor-pointer"
                title="Changer la vitesse de lecture"
              >
                ⚡ {ttsSpeed === 1 ? "Vitesse : 1.0x" : ttsSpeed === 0.75 ? "Vitesse : 0.75x" : "Vitesse : 1.25x"}
              </button>

              <div className="h-4 w-[1px] bg-slate-800" />

              {/* TTS Speaker Button */}
              <button
                type="button"
                onClick={() => speakText(actualOutput, "output")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                  speakingSource === "output"
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-850 hover:text-indigo-400"
                }`}
                title={speakingSource === "output" ? "Arrêter la lecture" : "Écouter la réponse (Text-to-Speech)"}
              >
                {speakingSource === "output" ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                    <span>Arrêter</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Écouter</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* AI Grader card */}
        {mode === "exercice" && evalResult && (
          <div className={`p-6 rounded-xl border transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 shadow-md ${
            evalResult.passed
              ? "bg-emerald-50/40 border-emerald-200"
              : "bg-rose-50/40 border-rose-200"
          }`}>
            <div className="flex flex-col gap-5">
              {/* Top Row: Title, Global Score and Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed pb-4 border-slate-200/60">
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    evalResult.passed 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                      : "bg-rose-500/10 text-rose-600 border-rose-200"
                  }`}>
                    {evalResult.passed ? (
                      <Trophy className="w-5 h-5 animate-bounce-slow text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {evalResult.passed ? "Défi validé !" : "Défi à corriger"}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold border shadow-sm ${
                        evalResult.passed 
                          ? "bg-emerald-500 text-white border-emerald-600" 
                          : "bg-rose-500 text-white border-rose-600"
                      }`}>
                        {evalResult.score}/100
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                      {evalResult.passed ? "Excellent travail ! Vous maîtrisez ces techniques." : "Ajustez vos instructions pour réussir la validation."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Performance Badge */}
                  {evalResult.passed ? (
                    (() => {
                      let badgeLabel = "Praticien du Prompt";
                      let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      let BadgeIcon = Award;
                      
                      if (evalResult.score >= 95) {
                        badgeLabel = "Élite du Prompt";
                        badgeStyle = "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-900 border-amber-300 shadow-sm shadow-amber-500/10";
                        BadgeIcon = Trophy;
                      } else if (evalResult.score >= 90) {
                        badgeLabel = "Maître du Prompt";
                        badgeStyle = "bg-gradient-to-r from-indigo-100 to-purple-200 text-indigo-900 border-indigo-300 shadow-sm shadow-indigo-500/10";
                        BadgeIcon = Sparkles;
                      }
                      
                      return (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${badgeStyle}`}>
                          <BadgeIcon className="w-4 h-4 shrink-0" />
                          <span>{badgeLabel}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200">
                      <Zap className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Apprenti du Prompt</span>
                    </div>
                  )}

                  {evalResult.passed && (
                    progress?.quizCompleted ? (
                      <button
                        onClick={onNextChapter}
                        className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-700 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 uppercase tracking-wider shrink-0"
                      >
                        Suivant
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border bg-amber-50/50 text-amber-700 border-amber-200">
                        <Lock className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" />
                        <span>Quiz Requis</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Middle Row: Clarity and Conciseness Sub-Scores and bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                {/* Clarity Score Gauge */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      Structure & Clarté
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {evalResult.clarityScore ?? 0}/100
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                      style={{ width: `${evalResult.clarityScore ?? 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal italic">
                    Évalue si les instructions sont explicites, non ambiguës et bien encadrées (rôle, balises).
                  </p>
                </div>

                {/* Conciseness Score Gauge */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-purple-500" />
                      Efficacité & Concision
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                      {evalResult.concisenessScore ?? 0}/100
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(168,85,247,0.3)]"
                      style={{ width: `${evalResult.concisenessScore ?? 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal italic">
                    Évalue la brièveté du prompt et s'il va droit au but sans redondance ni verbiage inutile.
                  </p>
                </div>
              </div>

              {/* Bottom Row: Detailed French Feedback */}
              <div className="text-xs text-slate-700 bg-white/40 border border-slate-200/30 rounded-xl p-4 leading-relaxed">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Retour du Mentor IA</span>
                {evalResult.feedback}
              </div>

              {/* Optimal Prompt Suggestion Box */}
              {evalResult.optimalVersion && (
                <div className="border-t border-slate-200/50 pt-3">
                  <button
                    onClick={() => setShowOptimal(!showOptimal)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50/50 cursor-pointer"
                  >
                    {showOptimal ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-indigo-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-indigo-600" />
                    )}
                    <span>{showOptimal ? "Masquer" : "Découvrir"} la version de prompt optimale suggérée</span>
                  </button>
                  
                  {showOptimal && (
                    <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-md">
                      <div className="bg-slate-850 px-4 py-2 flex items-center justify-between border-b border-slate-950/40">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">💡 Version Optimale Expert</span>
                        <button
                          onClick={() => {
                            if (evalResult.optimalVersion) {
                              navigator.clipboard.writeText(evalResult.optimalVersion);
                              setCopiedOptimal(true);
                              setTimeout(() => setCopiedOptimal(false), 2000);
                            }
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800 shrink-0 cursor-pointer border border-slate-800"
                        >
                          {copiedOptimal ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                        {evalResult.optimalVersion}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time D3 Progression Chart */}
        {mode === "exercice" && history.some(item => item.mode === "exercice" && item.score !== null) && (
          <PromptProgressionChart history={history} />
        )}

        {/* Chapter Quiz Validation Card */}
        {mode === "exercice" && (
          (progress?.completed || evalResult?.passed) ? (
            <ChapterQuiz
              chapterId={chapter.id}
              quizCompleted={progress?.quizCompleted ?? false}
              onQuizComplete={handleQuizComplete}
            />
          ) : (
            <div className="bg-slate-100/60 border border-slate-200 rounded-2xl p-6 text-center shadow-inner flex flex-col items-center justify-center min-h-[160px] animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-400 mb-2.5 shadow-inner">
                <Lock className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-slate-700">Quiz de Chapitre (Verrouillé)</h5>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                Validez le défi pratique ci-dessus avec un score d'au moins 80% pour débloquer ce quiz de validation et le chapitre suivant !
              </p>
            </div>
          )
        )}

        {/* Prompt Iterations & Side-by-Side Comparison History */}
        <PromptHistory 
          history={history}
          onClear={handleClearHistory}
          onRestore={handleRestoreIteration}
        />
      </div>
    </div>
  );
}
