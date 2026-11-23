/* Akeed · Catalogue bornes — Prod by Oussema Jl
 * ------------------------------------------------------------------
 * CE FICHIER SE MODIFIE À LA MAIN (le script de mise à jour ne le touche pas).
 *
 * Pour ajouter / enlever un modèle d'une catégorie : ajouter / enlever son
 * identifiant dans la liste "items". L'identifiant = feuille + ligne Excel :
 *   "f1-r5"  = feuille 1 (Bornes multifonction), ligne 5
 *   "f3-r10" = feuille 3, ligne 10
 * (on le voit aussi dans l'adresse de la page de l'article : #/article/f1-r5)
 *
 * "prices" = colonnes de prix de l'Excel à afficher (un morceau du titre suffit).
 * "video"  = (optionnel) nom exact d'une vidéo du dossier fournisseur à mettre en avant.
 * ------------------------------------------------------------------ */
window.BORNES = {
  categories: [
    {
      id: "multifonction",
      num: "1",
      title: "Borne multifonction",
      desc: "Borne de paiement complète : encaisse les billets et les pièces, rend la monnaie, imprime le ticket et lit les QR codes.",
      features: ["Lecteur de billets", "Monnayeur (pièces)", "Rendu monnaie", "Imprimante tickets", "Lecteur QR", "Écran tactile"],
      variants: [
        {
          id: "full",
          title: "Full option",
          desc: "Billets + pièces + rendu monnaie + imprimante ticket + lecteur QR.",
          prices: ["Prix SANS combiné", "si on achète 1", "si on achète 10"],
          items: [
            "f1-r17", // LKS
            "f1-r5",  // Chuangli CRT401
            "f1-r3",  // Xishida Cashlogy
            "f1-r4",  // Xishida indoor
            "f1-r12", // Huitong 19"
            "f1-r18", // Seelinkin
            "f1-r15", // Hongzhou Smart
            "f1-r2",  // Hongjiali (écarté)
          ],
          video: { "f1-r18": "Seelinkin - video borne rendu monnaie billets (20-11).mp4" },
        },
        {
          id: "combine",
          title: "Full option + combiné téléphonique",
          desc: "Même borne full option, avec un combiné téléphonique (VoIP / SIP) pour appeler le support.",
          features: ["Combiné téléphonique"],
          prices: ["Prix AVEC combiné", "si on achète 1", "si on achète 10"],
          items: [
            "f1-r17", // LKS
            "f1-r5",  // Chuangli CRT401 (combiné inclus)
            "f1-r12", // Huitong (handset dans l'annonce)
            "f1-r16", // LCDKIOSK (écarté : pas de module cash)
          ],
        },
      ],
    },
    {
      id: "mini",
      num: "2",
      title: "Mini borne",
      desc: "Borne compacte de comptoir pour supérettes et petits commerces : encaissement cash et rendu monnaie dans un format réduit.",
      features: ["Format comptoir", "Billets + pièces", "Rendu monnaie", "Imprimante tickets", "Lecteur QR"],
      variants: [
        {
          id: "mini",
          title: "Mini borne (supérette…)",
          prices: ["si on achète 1", "si on achète 10"],
          items: [
            "f1-r11", // Sichuan Blu-Ray 10.1"
            "f1-r10", // KER Chujie (self checkout retail)
            "f1-r6",  // Poling desktop (écarté)
            "f1-r7",  // Tcang 15.6" (écarté)
          ],
        },
      ],
    },
    {
      id: "deposit",
      num: "3",
      title: "Cash deposit",
      desc: "Machine de dépôt d'espèces : comptage, détection des faux billets, tri par coupure et coffre sécurisé.",
      features: ["Dépôt de billets en liasse", "Détection faux billets", "Comptage & tri", "Coffre sécurisé"],
      variants: [
        {
          id: "deposit",
          title: "Cash deposit",
          prices: ["si on achète 1", "si on achète 10"],
          items: [
            "f1-r21", // Diversity Kiosk DK-BD006
            "f1-r8",  // SNBC BATM-N2200 (écarté)
          ],
        },
      ],
    },
  ],
};
