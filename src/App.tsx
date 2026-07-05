import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LessonPanel from "./components/LessonPanel";
import ExercisePanel from "./components/ExercisePanel";
import CertificateModal from "./components/CertificateModal";
import SettingsModal from "./components/SettingsModal";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { chaptersData, appendixData } from "./data/chaptersData";
import { UserProgress } from "./types";
import { GraduationCap, Award, BookOpen, ChevronRight, Check, Settings } from "lucide-react";

export default function App() {
  const [currentChapterId, setCurrentChapterId] = useState<number | "appendix">(1);
  const [progress, setProgress] = useState<Record<number, UserProgress>>({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem("prompt_tutorial_progress");
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (e) {
      console.error("Error loading progress from localStorage", e);
    }
  }, []);

  // Listen for request to open global settings
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };
    window.addEventListener("open_global_settings", handleOpenSettings);
    return () => {
      window.removeEventListener("open_global_settings", handleOpenSettings);
    };
  }, []);

  // Save progress handler
  const handleSaveProgress = (chapterProgress: UserProgress) => {
    const updated = {
      ...progress,
      [chapterProgress.chapterId]: chapterProgress,
    };
    setProgress(updated);
    try {
      localStorage.setItem("prompt_tutorial_progress", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving progress to localStorage", e);
    }
  };

  // Navigates to the next chapter or the appendix
  const handleNextChapter = () => {
    if (typeof currentChapterId === "number") {
      if (currentChapterId < chaptersData.length) {
        setCurrentChapterId(currentChapterId + 1);
      } else {
        // If they complete the last chapter, suggest the appendix
        setCurrentChapterId("appendix");
      }
    }
  };

  // Select a specific chapter or the appendix
  const handleSelectChapter = (id: number | "appendix") => {
    setCurrentChapterId(id);
  };

  // Check if all chapters are completed
  const allChaptersCompleted =
    chaptersData.length > 0 &&
    chaptersData.every((ch) => progress[ch.id]?.completed && progress[ch.id]?.quizCompleted);

  // Get active chapter details
  const activeChapter =
    typeof currentChapterId === "number"
      ? chaptersData.find((ch) => ch.id === currentChapterId)
      : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar navigation */}
      <Sidebar
        chapters={chaptersData}
        progress={progress}
        currentChapterId={currentChapterId}
        onSelectChapter={handleSelectChapter}
        onShowCertificate={() => setShowCertificate(true)}
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 shrink-0 px-8 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold font-sans text-sm shadow-sm shadow-indigo-500/10">P</div>
            <span className="font-bold text-sm md:text-base tracking-tight uppercase text-slate-900">
              Prompt Master <span className="text-indigo-600">/ Interactif</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Paramètres de l'application"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
              Settings
            </button>

            {allChaptersCompleted ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                  <Check className="w-4 h-4" />
                  Tous les chapitres validés !
                </span>
                <button
                  onClick={() => setShowCertificate(true)}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-600 shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  Certificat
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-semibold italic hidden sm:inline">
                Progressez pour débloquer votre certificat de maîtrise.
              </span>
            )}
          </div>
        </header>

        {/* Content body split */}
        <div className="flex-1 p-8 overflow-hidden">
          {currentChapterId === "appendix" ? (
            /* Appendix reading panel */
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 h-full overflow-y-auto max-w-4xl mx-auto custom-scrollbar animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 text-indigo-600 mb-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Guide Technique</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-6">
                {appendixData.title}
              </h1>
              
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm">
                {/* Manual formatting for the appendix sections */}
                <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2">1. Le Chaînage de Prompts (Prompt Chaining)</h3>
                <p className="mb-4">
                  Au lieu de demander à un modèle d'effectuer une tâche immense en un seul prompt complexe, il est préférable de **diviser la tâche en plusieurs étapes séquentielles** où la sortie d'un prompt devient l'entrée du suivant.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 font-mono text-xs text-slate-700 leading-relaxed">
                  <strong>Exemple de chaîne :</strong><br/>
                  Étape 1 : Traduire un texte d'entrée brut en français.<br/>
                  Étape 2 : Corriger la grammaire et le style du texte traduit.<br/>
                  Étape 3 : Mettre en page le texte corrigé en HTML propre.
                </div>
                <p className="mb-4">
                  Cette méthode est extrêmement efficace pour maintenir une précision élevée, réduire les hallucinations et faciliter le débogage de vos applications d'IA.
                </p>

                <hr className="my-6 border-slate-200" />

                <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2">2. L'Utilisation d'Outils (Tool Use / Function Calling)</h3>
                <p className="mb-4">
                  Les modèles de langage sont limités à leurs connaissances d'entraînement. Ils ne savent pas faire de calculs précis ou accéder à internet en temps réel de manière native. Le **Tool Use** permet de connecter Claude à des API externes.
                </p>
                <p className="mb-4">
                  Le modèle reçoit une description textuelle des fonctions disponibles (ex: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">calculer_taxes(montant)</code>). S'il a besoin de cette information pour répondre, il s'arrête et renvoie un appel de fonction au format JSON. Votre application exécute le code réel et réinjecte le résultat au modèle pour qu'il termine sa réponse de façon 100% exacte.
                </p>

                <hr className="my-6 border-slate-200" />

                <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2">3. La Génération Augmentée par Récupération (RAG)</h3>
                <p className="mb-4">
                  Le **RAG (Retrieval-Augmented Generation)** consiste à couper le LLM avec une base de données de documents (généralement vectorielle).
                </p>
                <p className="mb-4">
                  Lorsqu'un utilisateur pose une question :
                </p>
                <ol className="list-decimal ml-5 mb-4 space-y-1">
                  <li>Votre système recherche les documents ou fiches FAQ les plus pertinents dans votre base de données.</li>
                  <li>Il injecte ces extraits de documents directement dans le prompt système de Claude (ex : entourés de balises XML <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">&lt;documents&gt;</code>).</li>
                  <li>Claude formule une réponse fiable en se basant uniquement sur ces extraits, éliminant presque totalement les hallucinations sur vos données internes.</li>
                </ol>

                {allChaptersCompleted && (
                  <div className="mt-12 bg-amber-50 border border-amber-200 p-6 rounded-xl flex flex-col items-center text-center">
                    <Award className="w-10 h-10 text-amber-600 mb-2" />
                    <h4 className="font-bold text-slate-800 text-base">Vous avez complété tout le cursus !</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-md">
                      Félicitations pour vos efforts. Vous maîtrisez désormais l'art d'interagir avec les IA. Récupérez votre certificat officiel maintenant !
                    </p>
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="mt-4 py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer shadow-md border border-amber-600"
                    >
                      Voir mon Certificat de Maîtrise
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Split layout for lessons + practice */
            activeChapter && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden animate-in fade-in duration-300">
                {/* Left Column: Lesson */}
                <div className="h-full overflow-hidden">
                  <LessonPanel
                    title={activeChapter.title}
                    level={activeChapter.level}
                    content={activeChapter.lessonContent}
                  />
                </div>

                {/* Right Column: Exercise Area */}
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  <ExercisePanel
                    chapter={activeChapter}
                    progress={progress[activeChapter.id]}
                    onSaveProgress={handleSaveProgress}
                    onNextChapter={handleNextChapter}
                  />
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Bar */}
        <footer className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[11px] text-slate-500 font-medium no-print shrink-0 shadow-inner">
          <div className="flex gap-4">
            <span className="hover:text-slate-800 transition-colors cursor-pointer uppercase tracking-wider">Documentation Anthropic</span>
            <span className="hover:text-slate-800 transition-colors cursor-pointer uppercase tracking-wider">Guide Claude-3.5</span>
            <span className="hover:text-slate-800 transition-colors cursor-pointer uppercase tracking-wider">Aide & Conseils</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono tracking-wider">STATUT : CONNECTÉ (Gemini-3.5-Flash)</span>
          </div>
        </footer>
      </main>

      {/* Certificate modal overlay */}
      {showCertificate && (
        <CertificateModal onClose={() => setShowCertificate(false)} />
      )}

      {/* Persistent floating Voice Assistant */}
      <VoiceAssistant 
        currentChapter={activeChapter || chaptersData[0]} 
        onHelpWithPrompt={(tip) => {
          console.log("Tip received from assistant:", tip);
          window.dispatchEvent(new CustomEvent("voice_assistant_inject_tip", { detail: { text: tip } }));
        }}
      />

      {/* Global Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
