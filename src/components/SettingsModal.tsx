import React, { useState, useEffect } from "react";
import { 
  X, Settings, Key, Volume2, Link, Check, Lock, VolumeX, 
  Database, Sparkles, ExternalLink, Cpu, Info, HelpCircle
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "voice">("ai");

  // API Keys state
  const [backend, setBackend] = useState<"gemini" | "ollama" | "local-openai">("gemini");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3");

  // Voice state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Success indicator for saves
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (!isOpen) return;

    // Load keys
    const savedGemini = localStorage.getItem("custom_gemini_api_key") || "";
    const savedOpenai = localStorage.getItem("custom_openai_api_key") || "";
    setGeminiKey(savedGemini);
    setOpenaiKey(savedOpenai);

    // Load voice assistant settings
    let loadedVoiceName = "";
    const savedVoiceSettings = localStorage.getItem("voice_assistant_settings");
    if (savedVoiceSettings) {
      try {
        const parsed = JSON.parse(savedVoiceSettings);
        if (parsed.backend) setBackend(parsed.backend);
        if (parsed.endpoint) setOllamaEndpoint(parsed.endpoint);
        if (parsed.model) setOllamaModel(parsed.model);
        if (parsed.voiceName) {
          setSelectedVoice(parsed.voiceName);
          loadedVoiceName = parsed.voiceName;
        }
        if (parsed.rate) setSpeed(parsed.rate);
        if (parsed.pitch) setPitch(parsed.pitch);
        if (parsed.volume !== undefined) setVolume(parsed.volume);
        if (parsed.isMuted !== undefined) setIsMuted(parsed.isMuted);
      } catch (e) {
        console.error("Error loading voice settings:", e);
      }
    }

    // Load SpeechSynthesis voices
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        // Filter for french voices or list all
        const frVoices = allVoices.filter(v => v.lang.startsWith("fr"));
        setVoices(frVoices.length > 0 ? frVoices : allVoices);

        // If no voice was loaded from settings, try to find a default one (prefer Microsoft Paul / Paul)
        if (!loadedVoiceName && allVoices.length > 0) {
          const frList = frVoices.length > 0 ? frVoices : allVoices;
          const defaultFr = 
            frList.find(v => v.name.toLowerCase().includes("paul")) ||
            frList.find(v => v.name.toLowerCase().includes("microsoft")) ||
            frList.find(v => v.name.toLowerCase().includes("google") || v.default) ||
            frList[0];
          setSelectedVoice(defaultFr.name);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [isOpen]);

  const handleSave = () => {
    // Save API keys
    localStorage.setItem("custom_gemini_api_key", geminiKey.trim());
    localStorage.setItem("custom_openai_api_key", openaiKey.trim());

    // Retrieve or create voice settings object
    const savedVoiceSettings = localStorage.getItem("voice_assistant_settings");
    let baseSettings: any = {
      backend: "gemini",
      endpoint: "http://localhost:11434",
      model: "llama3"
    };

    if (savedVoiceSettings) {
      try {
        baseSettings = JSON.parse(savedVoiceSettings);
      } catch (e) {}
    }

    // Update settings with new values
    const updatedSettings = {
      ...baseSettings,
      backend: backend,
      endpoint: ollamaEndpoint.trim(),
      model: ollamaModel.trim(),
      voiceName: selectedVoice,
      rate: speed,
      pitch: pitch,
      volume: volume,
      isMuted: isMuted
    };

    localStorage.setItem("voice_assistant_settings", JSON.stringify(updatedSettings));

    // Force a dispatch event so other components (like VoiceAssistant) know settings updated
    window.dispatchEvent(new Event("storage_settings_updated"));

    // Show toast
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2500);
  };

  // Quick text speak test
  const testVoice = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance("Bonjour! La synthèse vocale de l'assistant fonctionne parfaitement.");
    utterance.lang = "fr-FR";
    
    const allVoices = window.speechSynthesis.getVoices();
    const voiceToUse = allVoices.find(v => v.name === selectedVoice);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.volume = isMuted ? 0 : volume;

    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-250">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            <div>
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider">
                Paramètres Globaux
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Configurez vos clés API et la synthèse vocale</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100/50 border-b border-slate-100 p-1 shrink-0">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "ai"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Moteurs IA & Clés API
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "voice"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voix & Synthèse
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
          
          {/* TAB 1: AI & KEYS */}
          {activeTab === "ai" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-indigo-950 text-xs leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Sécurisation des clés</span> : Vos clés API sont stockées confidentiellement en local sur votre propre navigateur (<code className="bg-indigo-100/50 px-1 rounded font-mono text-[10px]">localStorage</code>) et ne transitent jamais de façon non sécurisée.
                </div>
              </div>

              {/* Moteur d'IA Actif & Bouton Par Défaut */}
              <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    Moteur IA Actif / Par défaut
                  </span>
                  <button
                    onClick={() => {
                      setBackend("gemini");
                      setOllamaEndpoint("http://localhost:11434");
                      setOllamaModel("llama3");
                    }}
                    className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Choisir Google Gemini comme l'IA par défaut"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Par défaut
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setBackend("gemini")}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                      backend === "gemini"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>Google Gemini</span>
                    <span className={`text-[9px] font-semibold ${backend === "gemini" ? "text-indigo-200" : "text-emerald-600"}`}>
                      (Inclus)
                    </span>
                  </button>
                  <button
                    onClick={() => setBackend("local-openai")}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                      backend === "local-openai"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>OpenAI API</span>
                    <span className={`text-[9px] font-normal ${backend === "local-openai" ? "text-indigo-200" : "text-slate-400"}`}>
                      Perso
                    </span>
                  </button>
                  <button
                    onClick={() => setBackend("ollama")}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                      backend === "ollama"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>Ollama</span>
                    <span className={`text-[9px] font-normal ${backend === "ollama" ? "text-indigo-200" : "text-slate-400"}`}>
                      Local
                    </span>
                  </button>
                </div>
              </div>

              {/* Gemini Key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                  <span>Clé API Google Gemini</span>
                  <span className="text-[10px] text-indigo-600 font-medium lowercase">gemini-3.5-flash</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={process.env.GEMINI_API_KEY ? "•••••••••••••••••••••••• (Clé serveur incluse active)" : "Entrez votre clé API Gemini personnelle"}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 font-mono outline-none transition-all"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-0.5 self-start bg-indigo-50/40 hover:bg-indigo-50 px-2 py-1 rounded transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Obtenir une clé API Gemini gratuite sur Google AI Studio
                </a>
              </div>

              <hr className="border-slate-100" />

              {/* OpenAI Key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                  <span>Clé API OpenAI</span>
                  <span className="text-[10px] text-slate-500 font-medium">Pour modèles locaux / proxy</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Entrez votre clé API OpenAI personnelle"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 font-mono outline-none transition-all"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-0.5 self-start bg-indigo-50/40 hover:bg-indigo-50 px-2 py-1 rounded transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Créer une clé API sur la plateforme OpenAI
                </a>
              </div>

              <hr className="border-slate-100" />

              {/* Ollama Options */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  Paramètres IA Locale (Ollama)
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Adresse API</label>
                    <input
                      type="text"
                      value={ollamaEndpoint}
                      onChange={(e) => setOllamaEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Modèle</label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      placeholder="llama3"
                      className="bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all"
                    />
                  </div>
                </div>

                <a 
                  href="https://ollama.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-0.5 self-start bg-indigo-50/40 hover:bg-indigo-50 px-2 py-1 rounded transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Télécharger Ollama pour exécuter des modèles locaux
                </a>
              </div>

            </div>
          )}

          {/* TAB 2: VOICE */}
          {activeTab === "voice" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              
              {/* Voice Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  Voix Humaine Installée
                </label>
                {voices.length > 0 ? (
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none transition-all cursor-pointer"
                  >
                    {voices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang}) {voice.localService ? '🔊 local' : '☁️ cloud'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-500 text-xs italic">
                    Aucune voix spécifique n'est installée sur votre navigateur. La voix système par défaut sera utilisée.
                  </div>
                )}
                <span className="text-[9px] text-slate-400 italic">
                  Les voix disponibles dépendent entièrement de votre système d'exploitation et de votre navigateur.
                </span>
              </div>

              {/* Volume Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 uppercase tracking-widest text-[11px]">Volume</span>
                  <span className="font-mono text-indigo-600 font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isMuted ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Speed Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 uppercase tracking-widest text-[11px]">Vitesse de diction</span>
                  <span className="font-mono text-indigo-600 font-bold">{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 uppercase tracking-widest text-[11px]">Hauteur de voix (Pitch)</span>
                  <span className="font-mono text-indigo-600 font-bold">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Test Voice button */}
              <button
                onClick={testVoice}
                className="w-full py-2 bg-slate-850 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 border border-slate-800"
              >
                <Volume2 className="w-4 h-4" />
                Tester la configuration de la voix
              </button>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {showSavedToast && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                <Check className="w-4 h-4" />
                Sauvegardé avec succès !
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={handleSave}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
