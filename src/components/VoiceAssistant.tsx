import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Volume2, VolumeX, Settings, X, Play, Square, 
  HelpCircle, ChevronRight, RefreshCw, Cpu, MessageSquare, AlertCircle, Info
} from "lucide-react";
import { Chapter } from "../types";

interface VoiceAssistantProps {
  currentChapter: Chapter;
  onHelpWithPrompt: (tipText: string) => void; // Callback to inject tips or fill instructions
}

interface AssistantSettings {
  backend: "gemini" | "ollama" | "local-openai";
  endpoint: string;
  model: string;
  voiceName: string;
  pitch: number;
  rate: number;
}

interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  currentChapter, 
  onHelpWithPrompt 
}) => {
  // Toggle assistant visibility
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Chat log
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: "Bonjour ! Je suis votre tuteur vocal Prompt Master. Cliquez sur le micro pour me parler ou utilisez l'un des raccourcis ci-dessous.",
      timestamp: new Date()
    }
  ]);
  const [textInput, setTextInput] = useState("");
  
  // Settings with defaults saved in local storage
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    const saved = localStorage.getItem("voice_assistant_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      backend: "gemini",
      endpoint: "http://localhost:11434",
      model: "llama3",
      voiceName: "",
      pitch: 1.0,
      rate: 1.0
    };
  });

  // Browser SpeechSynthesis voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Ref elements
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Save settings on update
  useEffect(() => {
    localStorage.setItem("voice_assistant_settings", JSON.stringify(settings));
  }, [settings]);

  // Listen for global settings updates from SettingsModal
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const saved = localStorage.getItem("voice_assistant_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
          if (parsed.isMuted !== undefined) {
            setIsMuted(parsed.isMuted);
          }
        } catch (e) {
          console.error("Error reloading settings in voice assistant", e);
        }
      }
    };

    window.addEventListener("storage_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("storage_settings_updated", handleSettingsUpdate);
    };
  }, []);

  // Scroll to bottom of chat log
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog, isThinking]);

  // Load Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter for French or select all if none found
        const frVoices = voices.filter(v => v.lang.startsWith("fr"));
        setAvailableVoices(frVoices.length > 0 ? frVoices : voices);
        
        // Pick default French voice if none selected yet (prefer Microsoft Paul / Paul)
        if (!settings.voiceName && voices.length > 0) {
          const frList = frVoices.length > 0 ? frVoices : voices;
          const defaultFr = 
            frList.find(v => v.name.toLowerCase().includes("paul")) ||
            frList.find(v => v.name.toLowerCase().includes("microsoft")) ||
            frList.find(v => v.name.toLowerCase().includes("google") || v.default) ||
            frList[0];
          setSettings(prev => ({ ...prev, voiceName: defaultFr.name }));
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "fr-FR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
        // Stop any current reading aloud when user speaks
        stopSpeaking();
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text && text.trim() !== "") {
          handleSendMessage(text);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition error", event);
        if (event.error !== "no-speech") {
          setErrorMsg(`Erreur micro : ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [settings, currentChapter]);

  // Auto-listen when panel is opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error("Auto-listening failed to start:", e);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isOpen]);

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Helper: Read text aloud with system synthesizer
  const speakText = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;

    // Stop previous speaks
    stopSpeaking();

    // Clean text from Markdown formats or symbols that sound weird
    const cleanText = text
      .replace(/[\*\#\_\-\[\]]/g, "") // remove formatting markdown
      .replace(/<\/?[^>]+(>|$)/g, "") // remove XML tags
      .trim();

    if (cleanText === "") return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    
    // Set voice properties
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === settings.voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    utterance.volume = (settings as any).volume !== undefined ? (settings as any).volume : 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error", e);
      setIsSpeaking(false);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Microphone toggle button
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMsg("La reconnaissance vocale n'est pas supportée sur ce navigateur. Veuillez taper votre question.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  // Submit message to the selected AI Model backend
  const handleSendMessage = async (text: string) => {
    if (!text || text.trim() === "") return;

    // Add user message
    const newUserMsg: ChatMessage = {
      sender: "user",
      text: text,
      timestamp: new Date()
    };
    setChatLog(prev => [...prev, newUserMsg]);
    setTextInput("");
    setIsThinking(true);
    setErrorMsg(null);

    try {
      let responseText = "";

      const customKey = localStorage.getItem("custom_gemini_api_key") || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey && customKey.trim() !== "") {
        headers["x-gemini-api-key"] = customKey.trim();
      }

      const res = await fetch("/api/voice-assistant", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userMessage: text,
          currentChapterTitle: currentChapter.title,
          currentChapterInstruction: currentChapter.exerciseInstruction,
          backend: settings.backend,
          endpoint: settings.endpoint,
          model: settings.model
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const specificError = errorData.error || "Impossible de joindre le serveur d'IA.";
        throw new Error(specificError);
      }

      const data = await res.json();
      responseText = data.text || "Désolé, je n'ai pas pu générer de réponse.";

      // Success
      const assistantMsg: ChatMessage = {
        sender: "assistant",
        text: responseText,
        timestamp: new Date()
      };
      setChatLog(prev => [...prev, assistantMsg]);
      setIsThinking(false);

      // Read aloud
      speakText(responseText);

      // Context injection hook: if the assistant suggests code or changes, we can look for tips
      // (or let the user click a code snippet if one is returned)
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Une erreur est survenue lors de la communication avec l'IA.");
      setIsThinking(false);
    }
  };

  // Ask quick shortcut suggestions
  const handleShortcutClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Auto-inject tip into user prompt if applicable
  const injectTip = (text: string) => {
    onHelpWithPrompt(text);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Launch Button (bottom right corner) */}
      <div className="fixed bottom-16 right-6 z-50 no-print flex flex-col items-end gap-3">
        {/* Help label above floating button on hover */}
        {!isOpen && (
          <div className="bg-slate-900 text-slate-100 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md border border-slate-800 opacity-0 hover:opacity-100 transition-opacity duration-300 select-none pointer-events-none mb-1">
            Assistant Vocal Actif
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          id="toggle-voice-assistant-btn"
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 border cursor-pointer ${
            isOpen 
              ? "bg-slate-900 border-slate-700 text-rose-500 hover:bg-slate-850" 
              : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-indigo-600/20"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-in fade-in zoom-in duration-300" />
          ) : (
            <div className="relative">
              <Mic className="w-6 h-6 animate-pulse" />
              {isSpeaking && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Main Assistant Panel (Slide-out Bottom Sheet / Overlay Drawer) */}
      {isOpen && (
        <div 
          id="voice-assistant-panel"
          className="fixed bottom-32 right-6 w-[380px] max-w-[calc(100vw-32px)] h-[520px] bg-slate-950 text-slate-100 rounded-2xl border border-slate-850 shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <header className="bg-slate-900/80 px-4 py-3 border-b border-slate-850/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-bold text-xs shadow-sm">
                VM
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Prompt Master <span className="text-indigo-400">Vocal</span>
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    {isListening ? 'À l\'écoute...' : isSpeaking ? 'Parle...' : isThinking ? 'Réflexion...' : 'Prêt'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Mute toggle */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400'}`}
                title={isMuted ? "Activer le son" : "Désactiver le son"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Settings toggle */}
              <button 
                onClick={() => window.dispatchEvent(new Event("open_global_settings"))}
                className="p-1.5 rounded hover:bg-slate-800 transition-colors text-slate-400"
                title="Paramètres globaux de l'IA"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Reset/Clear Chat */}
              <button 
                onClick={() => setChatLog([{
                  sender: "assistant",
                  text: "Chat réinitialisé ! Comment puis-je vous aider aujourd'hui ?",
                  timestamp: new Date()
                }])}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors"
                title="Effacer l'historique"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Area 1: Config/Settings screen */}
          {showSettings ? (
            <div className="flex-1 p-4 bg-slate-900/40 overflow-y-auto custom-scrollbar text-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-1">
                <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Moteur d'IA & Modèle
                </h5>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  Retour
                </button>
              </div>

              {/* Backend Selector */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Moteur IA
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, backend: "gemini" }))}
                    className={`py-1 rounded font-bold uppercase text-[9px] tracking-wider transition-all ${settings.backend === "gemini" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Gemini (Inclus)
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, backend: "ollama" }))}
                    className={`py-1 rounded font-bold uppercase text-[9px] tracking-wider transition-all ${settings.backend === "ollama" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Ollama (Local)
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, backend: "local-openai" }))}
                    className={`py-1 rounded font-bold uppercase text-[9px] tracking-wider transition-all ${settings.backend === "local-openai" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Local OpenAI
                  </button>
                </div>
              </div>

              {/* Model / Endpoint Config */}
              {settings.backend !== "gemini" && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Adresse API de l'IA locale (Endpoint)
                    </label>
                    <input
                      type="text"
                      value={settings.endpoint}
                      onChange={(e) => setSettings(prev => ({ ...prev, endpoint: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
                      placeholder="Ex: http://localhost:11434"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Nom du modèle IA
                    </label>
                    <input
                      type="text"
                      value={settings.model}
                      onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
                      placeholder="Ex: llama3.1 ou mistral"
                    />
                    <span className="text-[9px] text-slate-500 block mt-1">
                      Ollama : assurez-vous d'avoir fait <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-400 font-mono">ollama run llama3</code> localement.
                    </span>
                  </div>
                </div>
              )}

              {/* Voice Selector */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Voix Humaine (Synthèse Vocale)
                </label>
                {availableVoices.length > 0 ? (
                  <select
                    value={settings.voiceName}
                    onChange={(e) => setSettings(prev => ({ ...prev, voiceName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  >
                    {availableVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang}) {voice.localService ? '🔊' : '☁️'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-slate-900 p-2 rounded border border-slate-850 text-slate-500 text-[10px]">
                    Aucune voix détectée. Utilisation de la voix système par défaut.
                  </div>
                )}
              </div>

              {/* Pitch & Rate Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px]">Vitesse</span>
                    <span className="font-mono text-indigo-400">{settings.rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.rate}
                    onChange={(e) => setSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px]">Hauteur (Pitch)</span>
                    <span className="font-mono text-indigo-400">{settings.pitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.pitch}
                    onChange={(e) => setSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Quick test vocal */}
              <button
                onClick={() => speakText("Test de la voix humaine de Prompt Master. Le son fonctionne parfaitement !")}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded font-bold uppercase text-[9px] tracking-wider transition-colors border border-slate-750 flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Tester la voix
              </button>

              <div className="mt-auto bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-3 text-indigo-300/80 text-[10px]">
                <span className="font-bold text-indigo-300 block mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Note sur la voix locale :
                </span>
                Les voix gratuites proviennent directement du système d'exploitation de votre machine (Chrome, Windows, macOS, Android). Elles s'exécutent de façon confidentielle et gratuite dans votre navigateur.
              </div>
            </div>
          ) : (
            <>
              {/* Area 2: Live Chat view & Wave Animation */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                
                {chatLog.map((msg, i) => (
                  <div 
                    key={i}
                    className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-indigo-600 text-white rounded-br-none" 
                        : "bg-slate-900 text-slate-200 border border-slate-850 rounded-bl-none shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-500 mt-0.5 px-1 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex flex-col items-start max-w-[85%] mr-auto animate-pulse">
                    <div className="bg-slate-900 text-slate-400 border border-slate-850 p-3 rounded-xl text-xs rounded-bl-none flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span>Réflexion vocale...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Beautiful interactive Wave Area */}
              <div className="bg-slate-900/40 border-t border-slate-900 p-3 flex flex-col items-center justify-center gap-2">
                {/* Active audio visualizer wave */}
                <div className="h-8 flex items-center justify-center gap-1 w-full max-w-[200px]">
                  {isListening ? (
                    // Listening Wave (bouncing bars)
                    Array.from({ length: 9 }).map((_, i) => {
                      const heights = ["h-3", "h-6", "h-4", "h-7", "h-5", "h-8", "h-4", "h-6", "h-3"];
                      const delays = ["delay-100", "delay-300", "delay-75", "delay-500", "delay-150", "delay-300", "delay-100", "delay-200", "delay-75"];
                      return (
                        <div 
                          key={i} 
                          className={`w-1.5 bg-rose-500 rounded-full transition-all duration-300 animate-pulse ${heights[i]} ${delays[i]}`}
                          style={{ animationDuration: `${300 + (i * 75)}ms` }}
                        />
                      );
                    })
                  ) : isSpeaking ? (
                    // Speaking Wave (flowing pulse bars)
                    Array.from({ length: 9 }).map((_, i) => {
                      const heights = ["h-4", "h-5", "h-7", "h-6", "h-8", "h-6", "h-7", "h-5", "h-4"];
                      return (
                        <div 
                          key={i} 
                          className={`w-1.5 bg-emerald-500 rounded-full transition-all duration-300 animate-bounce ${heights[i]}`}
                          style={{ animationDuration: `${400 + (i * 120)}ms`, animationDelay: `${i * 40}ms` }}
                        />
                      );
                    })
                  ) : isThinking ? (
                    // Thinking wave (subtle slow glow)
                    <div className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 animate-spin duration-3000" />
                      génération vocale
                    </div>
                  ) : (
                    // Resting wave
                    Array.from({ length: 9 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 h-1 bg-slate-700 rounded-full transition-all duration-300"
                      />
                    ))
                  )}
                </div>

                {/* Local Mic/State Errors */}
                {errorMsg && (
                  <div className="text-[10px] text-rose-400 bg-rose-950/20 border border-rose-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 max-w-[90%] text-center">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Shortcut Prompt Actions (Contextual depending on current chapter) */}
                <div className="w-full flex gap-1.5 overflow-x-auto px-1 py-1 custom-scrollbar shrink-0 select-none">
                  <button
                    onClick={() => handleShortcutClick(`Donne-moi un indice ou une astuce pour réussir le défi du chapitre "${currentChapter.title}"`)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 text-[10px] rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <HelpCircle className="w-3 h-3 text-indigo-400" />
                    Indice Défi
                  </button>

                  <button
                    onClick={() => handleShortcutClick("Qu'est-ce que l'ingénierie de prompts et pourquoi est-ce important ?")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 text-[10px] rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3 text-indigo-400" />
                    Bases des Prompts
                  </button>

                  <button
                    onClick={() => handleShortcutClick(`Explique-moi la leçon du chapitre "${currentChapter.title}" de manière très simple`)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 text-[10px] rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                    Expliquer Leçon
                  </button>

                  {/* Contextual code helper shortcut */}
                  {currentChapter.id === 5 && (
                    <button
                      onClick={() => handleShortcutClick("Pourquoi le response prefilling fonctionne si bien pour imposer le format JSON ?")}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 text-[10px] rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Cpu className="w-3 h-3 text-amber-400" />
                      Prefilling JSON
                    </button>
                  )}
                  {currentChapter.id === 4 && (
                    <button
                      onClick={() => handleShortcutClick("Pourquoi utilisons-nous des balises XML pour isoler les instructions ?")}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 text-[10px] rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Cpu className="w-3 h-3 text-amber-400" />
                      XML Isolation
                    </button>
                  )}
                </div>
              </div>

              {/* Area 3: Chat Input / Speak Controls */}
              <footer className="p-3 bg-slate-900 border-t border-slate-850 flex items-center gap-2">
                {/* Visual mic status button */}
                <button
                  onClick={toggleListening}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border shrink-0 shadow ${
                    isListening 
                      ? "bg-rose-600 border-rose-500 text-white animate-pulse" 
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                  title={isListening ? "Arrêter d'écouter" : "Parler (Activer le micro)"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text input for quiet modes */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(textInput);
                  }}
                  className="flex-1 flex gap-1.5"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isListening ? "Parlez maintenant..." : "Écrire une question..."}
                    disabled={isListening}
                    className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none transition-colors font-sans placeholder-slate-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isListening || isThinking}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 uppercase tracking-wider"
                  >
                    Envoyer
                  </button>
                </form>
              </footer>
            </>
          )}
        </div>
      )}
    </>
  );
};
