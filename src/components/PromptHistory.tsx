import React, { useState } from "react";
import { 
  History, RotateCcw, Trash2, ArrowLeftRight, Check, CheckCircle2, 
  XCircle, Play, Sparkles, ChevronDown, ChevronUp, Eye, FileText, Download
} from "lucide-react";

export interface PromptIteration {
  id: string;
  timestamp: string;
  mode: "exercice" | "playground";
  systemPrompt: string;
  userPrompt: string;
  prefill: string;
  output: string;
  score: number | null;
  passed: boolean | null;
  feedback?: string;
  clarityScore?: number;
  concisenessScore?: number;
  optimalVersion?: string;
}

interface PromptHistoryProps {
  history: PromptIteration[];
  onClear: () => void;
  onRestore: (iteration: PromptIteration) => void;
}

export default function PromptHistory({ history, onClear, onRestore }: PromptHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelectCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(item => item !== id));
    } else {
      if (compareIds.length >= 2) {
        // Replace second item
        setCompareIds([compareIds[0], id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const getCompareItems = () => {
    return history.filter(item => compareIds.includes(item.id));
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: "json" | "markdown", successOnly: boolean) => {
    const itemsToExport = successOnly 
      ? history.filter(item => item.passed === true)
      : history;

    if (itemsToExport.length === 0) {
      alert(successOnly 
        ? "Aucune itération réussie à exporter pour le moment." 
        : "Aucune itération à exporter."
      );
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const successSuffix = successOnly ? "_reussis" : "_tous";
    const filename = `prompt_history_${dateStr}${successSuffix}`;

    if (format === "json") {
      const jsonContent = JSON.stringify(itemsToExport, null, 2);
      downloadFile(jsonContent, `${filename}.json`, "application/json");
    } else {
      let mdContent = `# Historique des Prompts ${successOnly ? "Réussis" : "Saisis"}\n\n`;
      mdContent += `Exporté le : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n`;
      mdContent += `Nombre d'itérations : ${itemsToExport.length}\n\n`;
      mdContent += `_Généré par l'application d'apprentissage Prompt Engineering_\n\n---\n\n`;

      itemsToExport.forEach((item, idx) => {
        const totalIdx = itemsToExport.length - idx;
        mdContent += `## Itération #${totalIdx} - ${item.timestamp}\n\n`;
        mdContent += `- **Mode** : ${item.mode === "exercice" ? "Défi / Exercice" : "Playground (Entraînement)"}\n`;
        if (item.score !== null) {
          mdContent += `- **Score** : ${item.score}/100 (${item.passed ? "RÉUSSI" : "À AMÉLIORER"})\n`;
        }
        mdContent += `\n`;

        if (item.systemPrompt) {
          mdContent += `### System Instructions\n\`\`\`text\n${item.systemPrompt}\n\`\`\`\n\n`;
        }

        mdContent += `### Prompt Utilisateur\n\`\`\`text\n${item.userPrompt || "(vide)"}\n\`\`\`\n\n`;

        if (item.prefill) {
          mdContent += `### Pré-remplissage (Prefill)\n\`\`\`text\n${item.prefill}\n\`\`\`\n\n`;
        }

        mdContent += `### Réponse Générée (Output)\n\`\`\`text\n${item.output}\n\`\`\`\n\n`;

        if (item.feedback) {
          mdContent += `### Feedback de l'Évaluateur\n> ${item.feedback.replace(/\n/g, "\n> ")}\n\n`;
        }

        mdContent += `\n---\n\n`;
      });

      downloadFile(mdContent, `${filename}.md`, "text/markdown");
    }

    setShowExportMenu(false);
  };

  return (
    <div id="prompt-history-panel" className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Historique des Essais ({history.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              {compareIds.length === 2 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-all animate-bounce"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  Comparer ({compareIds.length})
                </button>
              )}

              {/* Export dropdown container */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="py-1 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  title="Exporter l'historique des prompts"
                >
                  <Download className="w-3 h-3" />
                  Exporter
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showExportMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowExportMenu(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">
                        Format d'exportation
                      </div>
                      
                      {/* Success items only */}
                      <button
                        onClick={() => handleExport("markdown", true)}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-medium">Réussis (.MD)</span>
                        </div>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                          {history.filter(item => item.passed === true).length}
                        </span>
                      </button>
                      <button
                        onClick={() => handleExport("json", true)}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-medium">Réussis (.JSON)</span>
                        </div>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                          {history.filter(item => item.passed === true).length}
                        </span>
                      </button>
                      
                      <hr className="border-slate-100 my-1" />
                      
                      {/* All items */}
                      <button
                        onClick={() => handleExport("markdown", false)}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tout l'historique (.MD)</span>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                          {history.length}
                        </span>
                      </button>
                      <button
                        onClick={() => handleExport("json", false)}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tout l'historique (.JSON)</span>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                          {history.length}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onClear}
                className="py-1 px-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-transparent hover:border-rose-100 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                title="Vider l'historique"
              >
                <Trash2 className="w-3 h-3" />
                Vider
              </button>
            </>
          )}
        </div>
      </header>

      {/* Body List */}
      <div className="max-h-[350px] overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 italic text-xs flex flex-col items-center justify-center gap-2">
            <History className="w-8 h-8 text-slate-200" />
            <p>Aucun essai enregistré pour ce chapitre.</p>
            <p className="text-[10px] text-slate-400 not-italic">Exécutez ou évaluez un prompt pour le sauvegarder dans l'historique local.</p>
          </div>
        ) : (
          history.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const isComparing = compareIds.includes(item.id);
            const isEval = item.score !== null;
            
            return (
              <div 
                key={item.id}
                className={`border rounded-lg overflow-hidden transition-all duration-250 ${
                  isExpanded ? "border-indigo-300 shadow-sm bg-indigo-50/5" : "border-slate-100 hover:border-slate-300"
                }`}
              >
                {/* Accordion Trigger Header */}
                <div 
                  className={`px-4 py-3 flex items-center gap-3 select-none cursor-pointer ${
                    isExpanded ? "bg-indigo-50/20" : "bg-white"
                  }`}
                  onClick={() => toggleExpand(item.id)}
                >
                  {/* Compare checkbox */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCompare(item.id);
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                      isComparing 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "border-slate-300 hover:border-indigo-400 text-transparent"
                    }`}
                    title="Sélectionner pour comparer"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {isEval ? (
                      item.passed ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                        </div>
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        <Play className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{history.length - index}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 font-mono">
                        {item.timestamp}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.mode === "exercice" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {item.mode === "exercice" ? "Défi" : "Playground"}
                      </span>
                    </div>

                    {/* Brief prompt snippet */}
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono max-w-xs md:max-w-md">
                      {item.userPrompt || "Sans prompt utilisateur"}
                    </p>
                  </div>

                  {/* Right side status/actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isEval && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                        item.passed 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {item.score}/100
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(item);
                      }}
                      className="py-1 px-2 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Restaurer ces invites dans l'éditeur"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restaurer
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3 pt-3 animate-in fade-in slide-in-from-top-1 duration-200 text-xs">
                    
                    {/* Prompts info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      {/* System Prompt */}
                      {item.systemPrompt && (
                        <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Prompt</span>
                          <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap select-text leading-normal max-h-[100px] overflow-y-auto">
                            {item.systemPrompt}
                          </pre>
                        </div>
                      )}

                      {/* User Prompt */}
                      <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Prompt</span>
                        <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap select-text leading-normal max-h-[100px] overflow-y-auto">
                          {item.userPrompt || "(vide)"}
                        </pre>
                      </div>

                    </div>

                    {/* Prefill if present */}
                    {item.prefill && (
                      <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pré-remplissage (Prefill)</span>
                        <code className="font-mono text-[11px] text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                          {item.prefill}
                        </code>
                      </div>
                    )}

                    {/* Feedback if evaluation */}
                    {item.feedback && (
                      <div className={`p-3 rounded-lg border leading-relaxed ${
                        item.passed 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-950" 
                          : "bg-rose-50 border-rose-100 text-rose-950"
                      }`}>
                        <div className="font-bold flex items-center gap-1 mb-0.5 text-[11px] uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          Feedback de l'évaluateur IA
                        </div>
                        <p className="text-[11px]">{item.feedback}</p>
                      </div>
                    )}

                    {/* Output */}
                    <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-lg border border-slate-900 text-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Console de sortie générée</span>
                      <pre className="font-mono text-[11px] text-emerald-400 whitespace-pre-wrap select-text leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar mt-1">
                        {item.output}
                      </pre>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Compare Guide Footer */}
      {history.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
          <span>💡 Cochez deux cases à gauche pour activer le comparateur.</span>
          {compareIds.length > 0 && (
            <button
              onClick={() => setCompareIds([])}
              className="text-indigo-600 hover:text-indigo-800 font-bold uppercase transition-colors"
            >
              Effacer la sélection ({compareIds.length})
            </button>
          )}
        </div>
      )}

      {/* Comparison Modal Side by Side */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-250">
            
            {/* Modal Header */}
            <header className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider">
                    Comparateur d'Itérations
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Visualisez l'effet de vos ajustements de prompts côte à côte</p>
                </div>
              </div>
              <button 
                onClick={() => setShowComparisonModal(false)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </header>

            {/* Modal Body columns */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex p-4 gap-4 bg-slate-100/50">
              {getCompareItems().map((item, idx) => (
                <div key={item.id} className="flex-1 min-w-[320px] bg-white rounded-lg border border-slate-250 shadow-sm flex flex-col h-full overflow-hidden">
                  
                  {/* Column Header */}
                  <div className="px-4 py-3 border-b border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 text-xs">{item.timestamp}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.mode === "exercice" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {item.mode === "exercice" ? "Défi" : "Playground"}
                      </span>
                    </div>

                    {item.score !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                        item.passed 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        Score: {item.score}/100
                      </span>
                    )}
                  </div>

                  {/* Scrollable details */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs custom-scrollbar select-text">
                    
                    {/* Restorer shortcut */}
                    <button
                      onClick={() => {
                        onRestore(item);
                        setShowComparisonModal(false);
                      }}
                      className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Appliquer cette version
                    </button>

                    {/* System Prompt block */}
                    {item.systemPrompt && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          System Instructions
                        </span>
                        <pre className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap leading-normal max-h-[140px] overflow-y-auto">
                          {item.systemPrompt}
                        </pre>
                      </div>
                    )}

                    {/* User Prompt block */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        User Prompt
                      </span>
                      <pre className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap leading-normal max-h-[140px] overflow-y-auto">
                        {item.userPrompt || "(vide)"}
                      </pre>
                    </div>

                    {/* Prefill block */}
                    {item.prefill && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prefill</span>
                        <code className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          {item.prefill}
                        </code>
                      </div>
                    )}

                    {/* Feedback block */}
                    {item.feedback && (
                      <div className={`p-3 rounded-lg border leading-relaxed ${
                        item.passed 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-950" 
                          : "bg-rose-50 border-rose-100 text-rose-950"
                      }`}>
                        <div className="font-bold flex items-center gap-1 mb-0.5 text-[10px] uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          Feedback IA
                        </div>
                        <p className="text-[11px]">{item.feedback}</p>
                      </div>
                    )}

                    {/* Output block */}
                    <div className="flex flex-col gap-1 mt-auto shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Réponse Générée
                      </span>
                      <pre className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto custom-scrollbar">
                        {item.output}
                      </pre>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <footer className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">Sélectionnez deux versions pour les comparer de façon côte à côte.</span>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Fermer
              </button>
            </footer>

          </div>
        </div>
      )}
    </div>
  );
}
