export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChapterQuiz {
  chapterId: number;
  questions: QuizQuestion[];
}

export const quizzesData: Record<number, ChapterQuiz> = {
  1: {
    chapterId: 1,
    questions: [
      {
        id: 1,
        question: "Quelle est la fonction principale du \"Prompt Système\" ?",
        options: [
          "Définir les règles du jeu, le comportement global du modèle et ses contraintes.",
          "Saisir la question de l'utilisateur final à chaque interaction.",
          "Gérer l'interface utilisateur de l'application Web."
        ],
        correctIndex: 0,
        explanation: "Le prompt Système définit la personnalité de l'IA, ses consignes globales et ses contraintes de haut niveau de manière persistante."
      },
      {
        id: 2,
        question: "Pourquoi est-il déconseillé de mettre les consignes globales uniquement dans le prompt Utilisateur ?",
        options: [
          "Le modèle a plus de mal à séparer les consignes de travail des données brutes.",
          "Cela ralentit le temps de traitement de l'IA de manière globale.",
          "Les données brutes risquent d'être effacées du cache."
        ],
        correctIndex: 0,
        explanation: "Placer les consignes dans le prompt Système permet d'isoler hermétiquement le comportement attendu des données de travail (User prompt)."
      }
    ]
  },
  2: {
    chapterId: 2,
    questions: [
      {
        id: 1,
        question: "Qu'est-ce qu'une consigne \"spécifique et quantifiable\" ?",
        options: [
          "Une consigne vague qui laisse toute liberté créative à l'IA.",
          "Une consigne contenant des critères précis (ex: 'en exactement 3 points d'une phrase').",
          "Une consigne rédigée en langage mathématique ou logique binaire."
        ],
        correctIndex: 1,
        explanation: "Plus la consigne est quantifiable (longueur, format précis), plus la réponse de l'IA sera stable, prévisible et exploitable."
      },
      {
        id: 2,
        question: "Pour éviter qu'un modèle ne commette d'erreur, quelle approche est généralement recommandée ?",
        options: [
          "Lui répéter plusieurs fois de suite 'ne fais pas d'erreurs !'.",
          "Décrire précisément ce qu'il doit faire et la structure positive attendue.",
          "Lui donner des consignes uniquement négatives (ce qu'il ne doit pas faire)."
        ],
        correctIndex: 1,
        explanation: "Les modèles exécutent mieux les instructions formulées positivement qui décrivent précisément les étapes et critères de réussite."
      }
    ]
  },
  3: {
    chapterId: 3,
    questions: [
      {
        id: 1,
        question: "Quel est l'avantage principal d'attribuer un rôle ou Persona au modèle (ex: \"Tu es un relecteur de code sénior\") ?",
        options: [
          "L'IA adopte spontanément le ton, le vocabulaire adéquat et la rigueur d'un expert du domaine.",
          "L'IA peut exécuter des calculs mathématiques complexes sans se tromper.",
          "Cela permet de contourner les limites d'utilisation de l'API de l'éditeur."
        ],
        correctIndex: 0,
        explanation: "Un persona aide le modèle à filtrer l'immensité de ses connaissances d'entraînement pour se concentrer sur les nuances et styles propres à l'expertise demandée."
      },
      {
        id: 2,
        question: "Où est-il préférable d'assigner le rôle (Persona) pour une robustesse maximale ?",
        options: [
          "Dans le Prompt Système.",
          "À la toute fin du Prompt Utilisateur.",
          "Dans le pré-remplissage de l'assistant."
        ],
        correctIndex: 0,
        explanation: "Placer le Persona dans le prompt Système garantit qu'il guidera le comportement général et persistant du modèle tout au long de la tâche."
      }
    ]
  },
  4: {
    chapterId: 4,
    questions: [
      {
        id: 1,
        question: "Pourquoi utilise-t-on des balises XML (ex: <document>...</document>) pour encapsuler les données ?",
        options: [
          "Pour séparer hermétiquement les instructions des données brutes, évitant ainsi les confusions et injections.",
          "Parce que Claude ou Gemini refusent de lire du texte s'il n'est pas formaté en XML ou HTML.",
          "Pour réduire la taille de la requête en compressant les jetons (tokens)."
        ],
        correctIndex: 0,
        explanation: "Les balises XML constituent d'excellentes limites structurelles et éliminent le risque que le modèle confonde une consigne avec les données brutes qu'il doit traiter."
      },
      {
        id: 2,
        question: "Comment doit-on guider le modèle concernant les balises XML définies ?",
        options: [
          "En y faisant explicitement référence dans nos instructions (ex: 'Analyse le texte contenu dans les balises <texte>').",
          "En les masquant pour que seul le moteur d'exécution de l'application puisse les voir.",
          "Il ne faut pas les mentionner, leur présence seule suffit."
        ],
        correctIndex: 0,
        explanation: "Référencer explicitement les balises dans les instructions aide le modèle à savoir précisément où puiser les données à traiter."
      }
    ]
  },
  5: {
    chapterId: 5,
    questions: [
      {
        id: 1,
        question: "En quoi consiste la technique du \"Response Prefilling\" (Pré-remplissage) ?",
        options: [
          "Fournir le tout début de la réponse de l'assistant (ex: '{' pour du JSON) pour forcer le modèle à continuer sur ce format.",
          "Faire taper le prompt par l'IA à la place de l'utilisateur.",
          "Optimiser la connexion réseau en envoyant la requête par morceaux."
        ],
        correctIndex: 0,
        explanation: "Puisqu'un modèle génère la suite probable du texte, débuter sa réponse par un caractère ou un mot-clé précis l'oblige à poursuivre logiquement dans cette structure."
      },
      {
        id: 2,
        question: "Si vous voulez forcer Claude à répondre strictement en format JSON sans blabla d'introduction, quel pré-remplissage est idéal ?",
        options: [
          "L'accolade ouvrante : \"{\".",
          "Le mot : \"Bonjour,\".",
          "Une balise XML : \"<reponse>\"."
        ],
        correctIndex: 0,
        explanation: "Pré-remplir avec \"{\" contraint immédiatement le modèle à générer un objet JSON valide, supprimant toute phrase d'introduction conviviale ou bavarde."
      }
    ]
  },
  6: {
    chapterId: 6,
    questions: [
      {
        id: 1,
        question: "Pourquoi demander au modèle de \"penser étape par étape\" (Chain of Thought) améliore-t-il la précision ?",
        options: [
          "Cela permet d'étaler le raisonnement logique sur plusieurs jetons (tokens) successifs avant d'énoncer la conclusion.",
          "Cela donne plus de temps au processeur physique pour effectuer la tâche.",
          "Le modèle télécharge des guides de résolution complémentaires sur internet."
        ],
        correctIndex: 0,
        explanation: "La prédiction d'un LLM s'effectue mot par mot. Lui accorder un espace de réflexion intermédiaire lui permet de poser ses calculs logiques avant de trancher, réduisant ainsi drastiquement les erreurs."
      },
      {
        id: 2,
        question: "Comment isoler proprement la réflexion intermédiaire de la réponse finale souhaitée ?",
        options: [
          "En demandant au modèle de rédiger sa réflexion dans des balises dédiées (ex: <thinking>...</thinking>).",
          "En supprimant aléatoirement les premières lignes générées.",
          "En demandant au modèle d'écrire en minuscules pour la réflexion."
        ],
        correctIndex: 0,
        explanation: "Les balises <thinking> permettent d'isoler la réflexion, facilitant son extraction ou son masquage pour l'utilisateur final."
      }
    ]
  },
  7: {
    chapterId: 7,
    questions: [
      {
        id: 1,
        question: "Qu'est-ce que le \"Few-Shot Prompting\" (prompting par exemples) ?",
        options: [
          "Une méthode consistant à donner un ou plusieurs exemples du comportement attendu directement dans le prompt.",
          "Une technique pour envoyer plusieurs prompts en parallèle.",
          "Une limitation interdisant d'utiliser plus de quelques mots par phrase."
        ],
        correctIndex: 0,
        explanation: "Fournir des exemples concrets de couples \"entrée-sortie\" est la méthode la plus rapide pour aligner le ton, le style et la structure d'une IA sur un besoin complexe."
      },
      {
        id: 2,
        question: "Comment structurer des exemples Few-Shot de manière optimale pour éviter la confusion ?",
        options: [
          "Utiliser des délimiteurs clairs ou des balises XML pour chaque exemple d'entrée et de sortie.",
          "Les mélanger en vrac au milieu de la consigne générale.",
          "Donner des exemples contradictoires pour tester l'intelligence du modèle."
        ],
        correctIndex: 0,
        explanation: "Structurer proprement les exemples à l'aide de balises claires permet d'éviter que le modèle ne confonde un exemple avec la véritable demande en cours de traitement."
      }
    ]
  },
  8: {
    chapterId: 8,
    questions: [
      {
        id: 1,
        question: "Quelle consigne permet de limiter efficacement le risque d'hallucination d'un modèle ?",
        options: [
          "L'autoriser explicitement à dire 'Je ne sais pas' s'il ne trouve pas la réponse dans le texte fourni.",
          "Le menacer de couper son accès réseau s'il invente des faits.",
          "Lui demander d'être le plus imaginatif et bavard possible."
        ],
        correctIndex: 0,
        explanation: "Par défaut, les LLM cherchent à être agréables et à répondre coûte que coûte. Les autoriser formellement à avouer leur ignorance élimine le réflexe d'affabuler."
      },
      {
        id: 2,
        question: "Quelle technique d'ancrage (grounding) renforce la véracité des réponses du modèle sur un long document ?",
        options: [
          "Lui demander de citer mot pour mot des extraits de texte justificatifs pour appuyer chacune de ses affirmations.",
          "Lui demander de réécrire l'ensemble du document avant de répondre.",
          "Lui demander de traduire sa réponse finale en latin."
        ],
        correctIndex: 0,
        explanation: "Obliger le modèle à puiser des citations textuelles exactes (quotes) s'assure qu'il base rigoureusement son raisonnement sur la réalité des pièces fournies."
      }
    ]
  },
  9: {
    chapterId: 9,
    questions: [
      {
        id: 1,
        question: "Lors de la création d'un prompt industriel ou complexe de production, quelle est la bonne pratique de conception ?",
        options: [
          "Combiner les techniques : assignation de rôle, isolation par balises XML, exemples Few-Shot et instructions pas à pas.",
          "Écrire un paragraphe d'un seul bloc, sans retours à la ligne ni structure.",
          "Laisser le modèle libre de décider de l'ensemble de la structure et du format."
        ],
        correctIndex: 0,
        explanation: "Les meilleurs prompts de production sont de véritables architectures textuelles qui tirent profit de l'ensemble des bonnes pratiques d'ingénierie."
      },
      {
        id: 2,
        question: "Quel est le meilleur moyen d'itérer sur un prompt complexe pour l'améliorer ?",
        options: [
          "Tester le prompt sur des cas variés, analyser ses failles de manière quantifiable et ajuster ses consignes pas à pas.",
          "Changer l'intégralité du prompt à chaque erreur détectée.",
          "Copier-coller des instructions aléatoires trouvées sur internet."
        ],
        correctIndex: 0,
        explanation: "Une démarche d'amélioration empirique et méthodique, basée sur l'évaluation objective des écarts de score, permet de concevoir des invites d'une robustesse maximale."
      }
    ]
  }
};
