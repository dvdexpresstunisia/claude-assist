import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { quizzesData, QuizQuestion } from "../data/quizData";
import { 
  CheckCircle2, XCircle, ArrowRight, HelpCircle, RefreshCw, Award, Lock, Sparkles
} from "lucide-react";

interface ChapterQuizProps {
  chapterId: number;
  quizCompleted: boolean;
  onQuizComplete: () => void;
}

export default function ChapterQuiz({ chapterId, quizCompleted, onQuizComplete }: ChapterQuizProps) {
  const quiz = quizzesData[chapterId];
  
  if (!quiz) return null;

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  // Reset state when chapter changes
  useEffect(() => {
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setSubmitted(false);
    setWrongAnswersCount(0);
    setShowExplanation(false);
    setScore(0);
  }, [chapterId]);

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1;

  const handleOptionSelect = (idx: number) => {
    if (submitted) return;
    setSelectedOptionIdx(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionIdx === null || submitted) return;
    
    setSubmitted(true);
    setShowExplanation(true);

    if (selectedOptionIdx === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    } else {
      setWrongAnswersCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Quiz ended
      if (wrongAnswersCount === 0 || score === quiz.questions.length) {
        onQuizComplete();
      }
    } else {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setSubmitted(false);
      setShowExplanation(false);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setSubmitted(false);
    setWrongAnswersCount(0);
    setShowExplanation(false);
    setScore(0);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Quiz Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quiz Rapide</h4>
            <p className="text-[11px] text-slate-500 font-medium">Validez vos connaissances pour débloquer le chapitre suivant</p>
          </div>
        </div>
        
        <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/50">
          Question {currentQuestionIdx + 1} / {quiz.questions.length}
        </div>
      </div>

      {/* Already completed state */}
      {quizCompleted ? (
        <div className="flex flex-col items-center text-center py-6 px-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/80">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h5 className="text-sm font-bold text-slate-800">Quiz Validé avec Succès !</h5>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[340px] leading-relaxed">
            Vous avez parfaitement assimilé les concepts clés du chapitre {chapterId}. Le chapitre suivant est maintenant débloqué !
          </p>
          
          <button
            onClick={handleRestartQuiz}
            className="mt-4 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recommencer le quiz
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Question Text */}
          <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 shadow-inner">
            <span className="text-[9px] font-extrabold text-violet-600 uppercase tracking-widest block mb-1">Question</span>
            <p className="text-xs font-bold text-slate-700 leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options List */}
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptionIdx === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              
              let optionStyle = "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white text-slate-600";
              if (isSelected && !submitted) {
                optionStyle = "border-violet-500 bg-violet-50/30 text-violet-900";
              } else if (submitted) {
                if (isCorrect) {
                  optionStyle = "border-emerald-500 bg-emerald-50/40 text-emerald-900 font-medium";
                } else if (isSelected) {
                  optionStyle = "border-rose-500 bg-rose-50/40 text-rose-900";
                } else {
                  optionStyle = "border-slate-100 bg-slate-50/20 text-slate-400 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => handleOptionSelect(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                >
                  {/* Selector Circle */}
                  <div className="mt-0.5 shrink-0">
                    {submitted ? (
                      isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-200" />
                      )
                    ) : (
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? "border-violet-600 bg-violet-600" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                  </div>

                  <span className="flex-1 leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className={`p-4 rounded-xl text-xs border ${
                  selectedOptionIdx === currentQuestion.correctIndex
                    ? "bg-emerald-50/20 border-emerald-100 text-emerald-800"
                    : "bg-rose-50/20 border-rose-100 text-rose-800"
                }`}
              >
                <div className="flex gap-1.5 items-center font-bold mb-1">
                  {selectedOptionIdx === currentQuestion.correctIndex ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Excellente réponse !</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Ce n'est pas tout à fait ça.</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed text-[11px] font-medium text-slate-600">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            {!submitted ? (
              <button
                disabled={selectedOptionIdx === null}
                onClick={handleSubmitAnswer}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm border ${
                  selectedOptionIdx !== null
                    ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-700 cursor-pointer"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                Vérifier ma réponse
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {isLastQuestion ? (
                  wrongAnswersCount > 0 ? "Terminer & Réessayer" : "Valider le Quiz"
                ) : (
                  "Question suivante"
                )}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Final fail message block if some responses were wrong */}
          {submitted && isLastQuestion && wrongAnswersCount > 0 && (
            <div className="p-3 bg-rose-50/45 border border-rose-100 rounded-xl text-center text-[11px] font-medium text-rose-700 leading-normal">
              Oups ! Vous avez commis des erreurs. Recommencez le quiz pour obtenir un score parfait de 100% et débloquer la suite.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
