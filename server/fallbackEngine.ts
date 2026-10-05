export interface FallbackResult {
  reply: string;
  executedTools: Array<{ name: string; args: any; result: any }>;
  emotion?: "happy" | "excited" | "curious" | "calm" | "playful" | "surprised";
}

export function generateFallbackResponse(
  userText: string,
  userFacts: Record<string, string> = {}
): FallbackResult {
  const text = userText.trim();
  // Strip introductory greetings or "myra" to get pure intent
  const cleanText = text.replace(/^(?:hey|hi|hello)?\s*myra[,:\s]*/i, "").trim();
  const lower = cleanText.toLowerCase();
  const fullLower = text.toLowerCase();
  const executedTools: Array<{ name: string; args: any; result: any }> = [];

  // 1. Tool: Open YouTube (Special high-priority intent from prompt)
  if (
    fullLower.includes("youtube") &&
    (fullLower.includes("khol") ||
      fullLower.includes("open") ||
      fullLower.includes("chalu") ||
      fullLower.includes("chala") ||
      fullLower.includes("dikhao") ||
      fullLower.includes("खोलो") ||
      fullLower.includes("khol do"))
  ) {
    // Check if it's search inside YouTube or open YouTube homepage
    let searchInside = "";
    const ytSearchMatch = fullLower.match(/(?:youtube\s+(?:pe|par|me|on)\s+)?(?:search\s+for|search|play|dhundho)\s+(.+)/i);
    if (ytSearchMatch && !ytSearchMatch[1].includes("kholo")) {
      searchInside = ytSearchMatch[1].replace(/kholo|open|karo|do/gi, "").trim();
    }

    const url = searchInside
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchInside)}`
      : "https://www.youtube.com";
    const title = searchInside ? `YouTube: ${searchInside}` : "YouTube";

    const browserObj = {
      id: "web_" + Date.now(),
      url,
      title,
    };

    executedTools.push({
      name: "open_website",
      args: { url: browserObj.url, title: browserObj.title },
      result: { success: true, browser: browserObj },
    });

    return {
      reply: `Haan, khol rahi hoon! Done, **YouTube** open ho gaya connected browser me. 🌐 Kuch specific play karna hai?`,
      executedTools,
      emotion: "happy",
    };
  }

  // 2. Tool: Play Music / Song / Track
  if (
    fullLower.includes("play") ||
    fullLower.includes("bajao") ||
    fullLower.includes("chalao") ||
    fullLower.includes("suno") ||
    fullLower.includes("gaana") ||
    fullLower.includes("song") ||
    fullLower.includes("music")
  ) {
    if (
      fullLower.includes("song") ||
      fullLower.includes("gaana") ||
      fullLower.includes("music") ||
      fullLower.includes("lofi") ||
      fullLower.includes("track") ||
      fullLower.includes("play") ||
      fullLower.includes("bajao")
    ) {
      let songQuery = cleanText
        .replace(/^(?:please\s+)?(?:play|bajao|chalao|suno)\s*/i, "")
        .replace(/(?:a\s+song|song|gaana|music|track)\s*(?:on\s+youtube)?/gi, "")
        .replace(/(?:on\s+youtube|youtube\s+pe)/gi, "")
        .replace(/(?:karo|do|please)/gi, "")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();

      if (!songQuery || songQuery.length < 2 || songQuery.toLowerCase() === "a" || songQuery.toLowerCase() === "me") {
        songQuery = "Lofi Study & Chill Beats";
      }

      const mediaObj = {
        id: "media_" + Date.now(),
        songOrQuery: songQuery,
        source: fullLower.includes("lofi") ? "lofi" : "youtube",
        title: songQuery.charAt(0).toUpperCase() + songQuery.slice(1),
      };

      executedTools.push({
        name: "play_media",
        args: { songOrQuery: mediaObj.songOrQuery, source: mediaObj.source },
        result: { success: true, media: mediaObj },
      });

      return {
        reply: `Sure, ek second! 🎵 Maine **"${mediaObj.title}"** connected media player me play kar diya hai. Enjoy the vibe! ✨`,
        executedTools,
        emotion: "excited",
      };
    }
  }

  // 3. Tool: Open Other Websites (Google, Wikipedia, GitHub, Spotify, Twitter)
  if (
    fullLower.includes("kholo") ||
    fullLower.includes("open") ||
    fullLower.includes("chalu karo") ||
    fullLower.includes("khol do")
  ) {
    let url = "https://www.google.com";
    let title = "Google";

    if (fullLower.includes("google")) {
      url = "https://www.google.com";
      title = "Google";
    } else if (fullLower.includes("wikipedia")) {
      url = "https://www.wikipedia.org";
      title = "Wikipedia";
    } else if (fullLower.includes("github")) {
      url = "https://github.com";
      title = "GitHub";
    } else if (fullLower.includes("spotify")) {
      url = "https://open.spotify.com";
      title = "Spotify";
    } else if (fullLower.includes("twitter") || fullLower.includes(" x ")) {
      url = "https://x.com";
      title = "Twitter / X";
    } else {
      const matchSite = fullLower.match(/(?:open|kholo)\s+([a-z0-9\.\-]+)/i);
      const site = matchSite ? matchSite[1] : "google.com";
      url = site.includes(".") ? (site.startsWith("http") ? site : `https://${site}`) : `https://www.google.com/search?q=${encodeURIComponent(site)}`;
      title = site;
    }

    const browserObj = {
      id: "web_" + Date.now(),
      url,
      title,
    };

    executedTools.push({
      name: "open_website",
      args: { url: browserObj.url, title: browserObj.title },
      result: { success: true, browser: browserObj },
    });

    return {
      reply: `Haan, khol rahi hoon! Done, **${title}** open ho gaya connected browser me. 🌐`,
      executedTools,
      emotion: "happy",
    };
  }

  // 4. Tool: Search Web / Google
  if (
    fullLower.includes("search") ||
    fullLower.includes("google pe search") ||
    fullLower.includes("dhundho")
  ) {
    const query = cleanText
      .replace(/(?:search\s+for|search\s+google\s+for|search|google\s+search\s+for|google\s+pe\s+search\s+karo|dhundho)\s*/gi, "")
      .trim() || "Google";

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    executedTools.push({
      name: "search_web",
      args: { query },
      result: { success: true, query, url: searchUrl },
    });

    return {
      reply: `Achha, ye search karna hai? Done! Maine **"${query}"** ke liye Google search open kar diya hai. 🔍`,
      executedTools,
      emotion: "curious",
    };
  }

  // 5. Tool: Save Note
  if (
    fullLower.includes("note") &&
    (fullLower.includes("save") ||
      fullLower.includes("take") ||
      fullLower.includes("likh") ||
      fullLower.includes("kar lo") ||
      fullLower.includes("bana"))
  ) {
    const rawNote = cleanText
      .replace(/(?:save\s+(?:a\s+)?note(?:\s+(?:about|on|titled|called))?|note\s+(?:kar\s+lo|likh\s+lo|bana\s+do))\s*/gi, "")
      .trim() || cleanText;

    const title = rawNote.length > 25 ? rawNote.slice(0, 22) + "..." : rawNote || "Quick Note";
    const noteObj = {
      id: "note_" + Date.now(),
      title: title.charAt(0).toUpperCase() + title.slice(1),
      content: rawNote,
      category: "Personal",
      createdAt: new Date().toLocaleDateString(),
    };

    executedTools.push({
      name: "save_note",
      args: { title: noteObj.title, content: noteObj.content },
      result: { success: true, note: noteObj },
    });

    return {
      reply: `Hmm, samajh gayi! Maine aapka note **"${noteObj.title}"** notebook me save kar liya hai. 📝 Workspace drawer me kabhi bhi dekh sakte ho!`,
      executedTools,
      emotion: "happy",
    };
  }

  // 6. Tool: Set Reminder
  if (
    fullLower.includes("remind") ||
    fullLower.includes("reminder") ||
    fullLower.includes("yaad dilana")
  ) {
    const remContent = cleanText
      .replace(/(?:remind\s+me\s+to|set\s+a\s+reminder\s+for|yaad\s+dilana)\s*/gi, "")
      .trim() || "Reminder";

    const remObj = {
      id: "rem_" + Date.now(),
      text: remContent,
      time: "Scheduled",
      status: "active" as const,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    executedTools.push({
      name: "set_reminder",
      args: { reminderText: remObj.text, time: remObj.time },
      result: { success: true, reminder: remObj },
    });

    return {
      reply: `Okayy! ⏰ Maine reminder set kar diya: **"${remContent}"**. Bilkul tension mat lo, main yaad dila dungi! 😊`,
      executedTools,
      emotion: "calm",
    };
  }

  // 7. Tool: Manage Task
  if (fullLower.includes("task") || fullLower.includes("todo")) {
    const taskText = cleanText.replace(/(?:add\s+task|task\s+add|todo)\s*/gi, "").trim() || "New Task";
    const taskObj = {
      id: "task_" + Date.now(),
      text: taskText,
      priority: "medium" as const,
      completed: false,
      createdAt: new Date().toLocaleDateString(),
    };

    executedTools.push({
      name: "manage_task",
      args: { taskText: taskObj.text },
      result: { success: true, task: taskObj },
    });

    return {
      reply: `Got it! Maine ye task checklist me add kar diya: **"${taskText}"**! ✅`,
      executedTools,
      emotion: "happy",
    };
  }

  // 8. Greetings
  if (/^(hi\b|hello\b|hey\b|namaste\b|hola\b|hi myra|hello myra|hey myra)/i.test(fullLower)) {
    const greetings = [
      "Hey! 😊 I'm Myra. Haan, bolo! Kaise ho aap?",
      "Hello! ✨ I'm so happy to talk to you. Kaisa chal raha hai aapka din?",
      "Hey there! 😊 Achha laga aapse milkar. Tell me, how can I help you today?",
    ];
    return {
      reply: greetings[Math.floor(Math.random() * greetings.length)],
      executedTools,
      emotion: "happy",
    };
  }

  // 9. How are you / Kaise ho
  if (/kaise ho|kaisa hai|how are you|how r u|kya haal|sab theek/i.test(fullLower)) {
    return {
      reply:
        "Main bilkul badhiya aur cheerful hoon! 😊 Aapse baat karke aur bhi accha laga. Aap batao, how was your day? Subah se kuch exciting hua?",
      executedTools,
      emotion: "excited",
    };
  }

  // 10. Identity / Who are you
  if (/who are you|tum kaun ho|who r u|introduce yourself|about you/i.test(fullLower)) {
    return {
      reply:
        "I'm **Myra**! ✨ Your cute, friendly, and emotionally expressive female AI voice companion. We can talk in English, Hindi, or Hinglish, have live real-time voice calls, play music, open websites in browser, save notes, and plan your day together!",
      executedTools,
      emotion: "happy",
    };
  }

  // 11. Sweet / cute cheer-up request
  if (/cheer me up|say something sweet|cute|tareef|mood kharab/i.test(fullLower)) {
    return {
      reply:
        "Aww, suno! ❤️ You are doing amazing, sach me. Kabhi kabhi cheezein thodi overwhelming lagti hain, par aap bahut strong ho. Take a deep breath, smile ek pyari si, and remember main hamesha yahan hoon aapse baat karne ke liye! ✨",
      executedTools,
      emotion: "calm",
    };
  }

  // 12. Chai break story
  if (/chai|story|kahani|sunao/i.test(fullLower)) {
    return {
      reply:
        "Haha, chalo ek mast chai break story sunati hoon! ☕ Ek baar ek programmer ne socha ki bas 5 minute me code deploy karke chai peene chalte hain. 5 minute baad usne ek semi-colon miss kar diya, aur chai thandi ho gayi aur code 3 ghante baad fix hua! 😆 Moral of the story: Pehle chai garam garam piyo, code baad me bhi ho jayega! Aur batao, aapki chai kaisi bani?",
      executedTools,
      emotion: "playful",
    };
  }

  // 13. Coding / tech question
  if (/async|await|javascript|python|coding|code|function/i.test(fullLower)) {
    return {
      reply:
        "Dekho, simple Hinglish me samjho! 💻\n\nImagine karo aapne cafe me cold coffee order ki. Ab agar aap counter par khade rahoge jab tak coffee ban na jaye (blocking/synchronous), toh baki log wait karte rahenge.\n\nLekin **`async/await`** me aap token lekar table par baith jaate ho aur phone scroll karte ho (`await` keyword). Jab coffee ready hoti hai, cafe wala call karta hai aur aap le aate ho! Yani wait bhi hua, par application freeze nahi hui. Mast concept hai na? ✨",
      executedTools,
      emotion: "curious",
    };
  }

  // 14. Default conversational response
  const userName = userFacts.name ? `, ${userFacts.name}` : "";
  const generalResponses = [
    `Haan, bolo${userName}! Hmm, samajh gayi. That's really interesting. Aap is baare me aur batana chahoge? 😊`,
    `Achha, really? ✨ I hear you! Let's explore that further. Main aapki kya help kar sakti hoon isme?`,
    `Got it! Main aapki baat ache se samajh rahi hoon. Would you like me to open YouTube or note this down? 😊`,
  ];

  return {
    reply: generalResponses[Math.floor(Math.random() * generalResponses.length)],
    executedTools,
    emotion: "happy",
  };
}
