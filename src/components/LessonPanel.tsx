import React, { useState, useEffect } from "react";
import { BookOpen, Lightbulb, CheckCircle2, Volume2, VolumeX } from "lucide-react";

interface LessonPanelProps {
  title: string;
  level: string;
  content: string;
}

export default function LessonPanel({ title, level, content }: LessonPanelProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<1 | 0.75 | 1.25>(1);

  // Stop speaking when content changes or on component unmount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [content]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.25 : speed === 1.25 ? 0.75 : 1;
    setSpeed(nextSpeed);
    
    if (typeof window !== "undefined" && window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
      // Resume speaking with new speed rate
      setTimeout(() => {
        startSpeaking(content, nextSpeed);
      }, 80);
    }
  };

  const startSpeaking = (textToSpeak: string, currentSpeed: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Clean markdown structures, especially code blocks and extra markup
    let cleanText = textToSpeak
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks entirely
      .replace(/`([^`]+)`/g, "$1") // Remove backticks
      .replace(/[*_#\-]/g, " ") // Replace markdown layout with spaces
      .replace(/\s+/g, " ") // Clean up whitespaces
      .trim();

    // Include the title for context
    const fullSpeechText = `Chapitre: ${title}. ${cleanText}`;

    const utterance = new SpeechSynthesisUtterance(fullSpeechText);
    utterance.lang = "fr-FR";
    utterance.rate = currentSpeed;

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
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      startSpeaking(content, speed);
    }
  };

  // Simple custom markdown parser to convert basic md elements to elegant JSX
  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={index} className="text-sm font-bold text-slate-900 uppercase tracking-wider mt-6 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          {trimmed.replace("## ", "")}
        </h3>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={index} className="text-lg font-medium text-slate-700 mt-4 mb-2">
          {trimmed.replace("### ", "")}
        </h4>
      );
    }

    // Horizontal Rule
    if (trimmed === "---") {
      return <hr key={index} className="my-6 border-slate-200" />;
    }

    // List items
    if (trimmed.startsWith("- ")) {
      const parts = trimmed.substring(2).split("**");
      return (
        <li key={index} className="ml-5 list-disc text-slate-600 mb-2 leading-relaxed">
          {parts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="font-semibold text-slate-800">{part}</strong>;
            }
            return part;
          })}
        </li>
      );
    }

    // Blockquotes or tips
    if (trimmed.startsWith("> ")) {
      return (
        <div key={index} className="bg-indigo-50/40 border-l-4 border-indigo-600 p-4 rounded-r my-4 flex gap-3 border border-slate-200/50">
          <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-slate-700 text-xs leading-relaxed italic">
            {trimmed.replace("> ", "").replace(/\*\*/g, "")}
          </p>
        </div>
      );
    }

    // Raw paragraph with bold processing
    if (trimmed.length > 0) {
      const parts = trimmed.split("**");
      return (
        <p key={index} className="text-slate-600 mb-4 leading-relaxed">
          {parts.map((part, pIdx) => {
            // Check for bold parts
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="font-semibold text-slate-800">{part}</strong>;
            }
            return part;
          })}
        </p>
      );
    }

    return null;
  };

  // Group text into standard paragraph blocks and code blocks
  const parseContent = (rawText: string) => {
    const lines = rawText.split("\n");
    const parsedElements: React.ReactNode[] = [];
    let isCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = "";

    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) {
        if (isCodeBlock) {
          // Close code block
          parsedElements.push(
            <div key={`code-${index}`} className="relative my-4 group">
              <div className="absolute top-2 right-2 text-[10px] text-slate-400 font-mono select-none px-2 py-0.5 bg-slate-800/80 rounded border border-slate-700">
                {codeLanguage || "code"}
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-850 leading-relaxed shadow-lg">
                <code>{codeContent.join("\n")}</code>
              </pre>
            </div>
          );
          codeContent = [];
          isCodeBlock = false;
        } else {
          // Open code block
          isCodeBlock = true;
          codeLanguage = line.trim().replace("```", "");
        }
      } else if (isCodeBlock) {
        codeContent.push(line);
      } else {
        const el = renderLine(line, index);
        if (el) parsedElements.push(el);
      }
    });

    return parsedElements;
  };

  return (
    <div id="lesson-panel" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
            level === "Débutant" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
            level === "Intermédiaire" ? "bg-amber-50 text-amber-800 border border-amber-200" :
            "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              level === "Débutant" ? "bg-emerald-500" :
              level === "Intermédiaire" ? "bg-amber-500" :
              "bg-rose-500"
            }`} />
            {level}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-2">{title}</h2>
        </div>

        {/* TTS Player Panel */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              type="button"
              onClick={toggleSpeed}
              className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Vitesse de lecture"
            >
              <span>{speed}x</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSpeak}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isSpeaking
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm"
            }`}
            title={isSpeaking ? "Arrêter la lecture" : "Écouter la leçon (Text-to-Speech)"}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-slate-950" />
                <span>Arrêter</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-white" />
                <span>Écouter la leçon</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-slate-700">
        {parseContent(content)}
      </div>
    </div>
  );
}
