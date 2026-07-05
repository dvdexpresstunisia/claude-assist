import React, { useState } from "react";
import { X, Award, Printer, Calendar, ShieldCheck, Download } from "lucide-react";

interface CertificateModalProps {
  onClose: () => void;
}

export default function CertificateModal({ onClose }: CertificateModalProps) {
  const [userName, setUserName] = useState("Apprenti Prompt Engineer");

  const handlePrint = () => {
    window.print();
  };

  // Generate a random-looking hash for the certificate
  const certHash = "CERT-PRM-2026-" + Math.floor(1000 + Math.random() * 9000);

  return (
    <div id="certificate-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800/50 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Name Input (Controls) */}
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Félicitations pour votre réussite !</h3>
              <p className="text-xs text-slate-400">Saisissez votre nom pour personnaliser le certificat.</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto shrink-0">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Votre nom complet"
              maxLength={40}
              className="bg-slate-800/80 border border-slate-700 focus:border-amber-500 px-3 py-2 text-xs rounded-xl text-white outline-none focus:ring-1 focus:ring-amber-500/20 w-full md:w-56"
            />
            <button
              onClick={handlePrint}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Printable Certificate Area */}
        <div className="p-8 flex justify-center bg-slate-950/20">
          <div 
            id="printable-certificate"
            className="w-full max-w-2xl bg-white text-slate-900 border-8 border-double border-amber-600 p-12 rounded-2xl relative shadow-inner flex flex-col items-center text-center font-serif aspect-[1.414/1] overflow-hidden"
          >
            {/* Elegant backgrounds corner decorations */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-500" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-500" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-500" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-500" />

            {/* Certificate Header */}
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-amber-600 mb-2" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-700">
                Certificat de Réussite Académique
              </span>
              <h2 className="text-3xl font-bold mt-2 font-serif text-slate-800 border-b-2 border-slate-200 pb-3 w-80">
                PROMPT ENGINEERING
              </h2>
            </div>

            {/* Certificate Body */}
            <p className="text-xs text-slate-500 italic mt-6 font-sans">
              Ce diplôme officiel est fièrement décerné à
            </p>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-3 border-b border-amber-500/30 px-6 pb-2 inline-block max-w-[90%] truncate font-sans tracking-wide">
              {userName || "Prompt Engineer"}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mt-4 font-sans px-2">
              pour avoir complété avec succès l'ensemble du cursus de formation de niveau production basé sur le tutoriel d'ingénierie des prompts d'<strong>Anthropic</strong>.
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-3">
              Maîtrise validée : Rôles, XML Tags, Exemples (Few-Shot), Pré-remplissage, Précognition et Anti-hallucinations.
            </p>

            {/* Certificate Signatures and metadata */}
            <div className="mt-8 flex justify-between w-full px-6 pt-4 border-t border-slate-100 font-sans text-left">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Délivré le</span>
                <span className="text-xs text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date().toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="font-serif italic text-amber-700 text-sm font-bold">AI Studio</span>
                <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold border-t border-slate-100 pt-0.5 w-24">Organisme</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Identifiant</span>
                <span className="text-xs text-slate-700 font-mono font-bold block mt-0.5">
                  {certHash}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
