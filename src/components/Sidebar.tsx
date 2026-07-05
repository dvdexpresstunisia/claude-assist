import React from "react";
import { Chapter, UserProgress } from "../types";
import { CheckCircle2, Circle, AlertCircle, Award, BookOpen, ChevronRight, Lock } from "lucide-react";

interface SidebarProps {
  chapters: Chapter[];
  progress: Record<number, UserProgress>;
  currentChapterId: number | "appendix";
  onSelectChapter: (id: number | "appendix") => void;
  onShowCertificate: () => void;
}

export default function Sidebar({
  chapters,
  progress,
  currentChapterId,
  onSelectChapter,
  onShowCertificate,
}: SidebarProps) {
  // Helper to determine if a chapter is unlocked
  const isChapterUnlocked = (id: number): boolean => {
    if (id === 1) return true;
    const prevCh = progress[id - 1];
    return !!(prevCh?.completed && prevCh?.quizCompleted);
  };

  // Calculate completion percentage
  const totalChapters = chapters.length;
  const completedChapters = Object.values(progress).filter((p) => p.completed && p.quizCompleted).length;
  const progressPercent = Math.round((completedChapters / totalChapters) * 100);

  return (
    <div id="sidebar" className="w-80 bg-slate-900 text-slate-100 flex flex-col h-full shrink-0 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">MasterClass</h1>
            <p className="text-xs text-indigo-400 font-medium">Ingénierie des Prompts</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-800/80">
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-400">Progression globale</span>
            <span className="text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-[1px] border border-slate-700/30">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Micro Stats */}
          {(() => {
            const completedWithScore = Object.values(progress).filter((p) => p.completed && p.score > 0);
            const averageScore = completedWithScore.length > 0 
              ? Math.round(completedWithScore.reduce((acc, curr) => acc + curr.score, 0) / completedWithScore.length)
              : 0;
            const totalBonus = Object.values(progress).reduce((acc, curr) => acc + (curr.timedChallengeBonus || 0), 0);
            return (
              <div className="grid grid-cols-3 gap-2 mt-3.5 text-[10px] font-mono text-slate-400 border-t border-slate-800/40 pt-2.5">
                <div>
                  <span className="block text-slate-500 uppercase tracking-wider">MOYENNE</span>
                  <span className="font-bold text-slate-200">{averageScore > 0 ? `${averageScore}%` : '—'}</span>
                </div>
                <div className="text-center border-x border-slate-800/40 px-1">
                  <span className="block text-slate-500 uppercase tracking-wider">⚡ BONUS</span>
                  <span className="font-bold text-amber-400">{totalBonus} pts</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 uppercase tracking-wider">CHAPITRES</span>
                  <span className="font-bold text-slate-200">{completedChapters} / {totalChapters}</span>
                </div>
              </div>
            );
          })()}

          {/* Milestone Step Indicators */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/40">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Statut des chapitres
            </span>
            <div className="grid grid-cols-9 gap-1">
              {chapters.map((ch) => {
                const isChCompleted = progress[ch.id]?.completed && progress[ch.id]?.quizCompleted;
                const isChCurrent = currentChapterId === ch.id;
                const chScore = progress[ch.id]?.score || 0;
                const isUnlocked = isChapterUnlocked(ch.id);
                
                return (
                  <button
                    key={ch.id}
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && onSelectChapter(ch.id)}
                    title={
                      !isUnlocked 
                        ? `Chapitre ${ch.id} : Verrouillé (Terminez le chapitre ${ch.id - 1} d'abord)`
                        : `Chapitre ${ch.id} : ${ch.title} ${isChCompleted ? `(Validé - ${chScore}/100)` : ''}`
                    }
                    className={`h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                      !isUnlocked
                        ? "bg-slate-950/40 text-slate-650 border border-slate-900 cursor-not-allowed opacity-40"
                        : isChCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/35 cursor-pointer"
                        : isChCurrent
                        ? "bg-indigo-600 text-white border border-indigo-400 hover:bg-indigo-500 animate-pulse cursor-pointer"
                        : chScore > 0
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                        : "bg-slate-850 text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-400 cursor-pointer"
                    }`}
                  >
                    {ch.id}
                  </button>
                );
              })}
            </div>
          </div>

          {progressPercent === 100 && (
            <button
              onClick={onShowCertificate}
              className="w-full mt-4 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-amber-600"
            >
              <Award className="w-4 h-4" />
              Voir mon Certificat
            </button>
          )}
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Chapitres</span>
        
        {chapters.map((chapter) => {
          const chProgress = progress[chapter.id];
          const isSelected = currentChapterId === chapter.id;
          const isCompleted = chProgress?.completed && chProgress?.quizCompleted;
          const hasAttempted = chProgress && chProgress.score > 0;
          const isUnlocked = isChapterUnlocked(chapter.id);

          return (
            <button
              key={chapter.id}
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectChapter(chapter.id)}
              title={!isUnlocked ? `Complétez le chapitre ${chapter.id - 1} (exercice et quiz) pour débloquer` : undefined}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group relative ${
                !isUnlocked
                  ? "bg-slate-950/25 text-slate-600 border border-transparent cursor-not-allowed opacity-45"
                  : isSelected
                  ? "bg-indigo-600/10 text-white border border-indigo-500/20 font-medium cursor-pointer"
                  : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent cursor-pointer"
              }`}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {!isUnlocked ? (
                  <Lock className="w-4 h-4 text-slate-600" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : hasAttempted && chProgress.score < 80 ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Chapitre {chapter.id}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    !isUnlocked ? "bg-slate-800 text-slate-500" :
                    chapter.level === "Débutant" ? "bg-emerald-500/10 text-emerald-400" :
                    chapter.level === "Intermédiaire" ? "bg-amber-500/10 text-amber-400" :
                    "bg-rose-500/10 text-rose-400"
                  }`}>
                    {chapter.level}
                  </span>
                </div>
                <h3 className={`text-xs font-semibold mt-1 truncate ${isUnlocked ? "group-hover:text-slate-100" : ""}`}>
                  {chapter.title}
                </h3>
                {isUnlocked && chProgress && chProgress.score > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold mt-1">
                    <span>Score : {chProgress.score}/100</span>
                    {chProgress.timedChallengeSuccess && (
                      <span className="text-amber-400 flex items-center gap-0.5 font-bold" title="Défi chronométré réussi !">
                        ⚡ +{chProgress.timedChallengeBonus}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isUnlocked && (
                <ChevronRight className={`w-3.5 h-3.5 text-slate-600 mt-1 transition-transform group-hover:translate-x-0.5 shrink-0 ${
                  isSelected ? "text-indigo-400" : "opacity-0 group-hover:opacity-100"
                }`} />
              )}
            </button>
          );
        })}

        {/* Appendix Section */}
        <div className="mt-6 pt-4 border-t border-slate-800/60">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">Plus Loin</span>
          <button
            onClick={() => onSelectChapter("appendix")}
            className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
              currentChapterId === "appendix"
                ? "bg-indigo-600/10 text-white border border-indigo-500/20 font-medium"
                : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold">Annexe : Concepts Avancés</h3>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">Chaining, Tool Use, RAG</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/60 text-center">
        <p className="text-[10px] text-slate-500">
          Inspiré du cours interactif Anthropic
        </p>
        <p className="text-[9px] text-slate-600 font-mono mt-0.5">
          v1.2.0 • AI Studio Build
        </p>
      </div>
    </div>
  );
}
