/* =====================================================================
   Monglish Power Up — Adaptive Placement Test · QUESTION BANK + CONFIG
   ---------------------------------------------------------------------
   Reading / Writing / Speaking: ORIGINAL items (Pre-A1 -> B1).
   LISTENING: Monglish's own licensed audio (audio/listen-N.mp3) + the real
   placement-test worksheet page (assets/listening/worksheet-N.png, extracted
   from the comprehensive placement test DOCX files). The learner answers the
   worksheet with dropdowns — exactly like the paper test.
   ===================================================================== */

const CONFIG = {
  weights:      { listening: 0.30, reading: 0.30, writing: 0.20, speaking: 0.20 },
  totalMinutes: 60, masteryBar: 60, downBar: 40, startTier: 2,
  maxReplays: 2, ageMin: 5, ageMax: 12
};

const TIERS = {
  1:{book:"Power Up 1",n:1,cefr:"Pre-A1",stage:"Starters",   desc:"Pre-Beginner",pos:"",        color:"#38bdf8"},
  2:{book:"Power Up 2",n:2,cefr:"A1",    stage:"Movers",     desc:"Beginner",    pos:"lower A1",color:"#3b82f6"},
  3:{book:"Power Up 3",n:3,cefr:"A1+",   stage:"Movers",     desc:"Beginner",    pos:"upper A1",color:"#6366f1"},
  4:{book:"Power Up 4",n:4,cefr:"A2",    stage:"Flyers",     desc:"Elementary",  pos:"lower A2",color:"#f59e0b"},
  5:{book:"Power Up 5",n:5,cefr:"A2+",   stage:"Flyers",     desc:"Elementary",  pos:"upper A2",color:"#f97316"},
  6:{book:"Power Up 6",n:6,cefr:"B1",    stage:"Preliminary",desc:"Intermediate",pos:"",        color:"#ea580c"}
};

const SPEAKING_RUBRIC = [
  { c:"Fluency & confidence", b:["Single words, long pauses","Short answers, some hesitation","Answers readily, keeps going"] },
  { c:"Vocabulary",           b:["Very few words","Familiar topic words","Wider range, some detail"] },
  { c:"Grammar & communication",b:["Hard to understand","Simple correct phrases","Full, varied, understood easily"] }
];
const WRITING_RUBRIC = [
  { c:"Task & content",        b:["Off task / a few words","Some relevant ideas","Task fully covered, clear ideas"] },
  { c:"Grammar & accuracy",    b:["Many errors, unclear","Mostly simple & correct","Varied and accurate"] },
  { c:"Vocabulary & organisation",b:["Very limited","Familiar words, some links","Wider range, well organised"] }
];

/* field helpers */
const N6=["1","2","3","4","5","6"], AF=["a","b","c","d","e","f"], AB=["a","b"];
const num=(label,answer)=>({kind:"select",label:label||"No.",options:N6,answer});
const pick=(label,opts,answer)=>({kind:"select",label,options:opts,answer});
const write=(label,accept)=>({kind:"text",label:label||"Write",accept});
/* dropdown word lists (answers + distractors) */
const W1=["brother","dad","grandma","grandpa","mum","sister"];
const W2=["don't have to take","has to buy","has to catch","has to get","have to get","have to visit"];
const W3=["map","postcard","pyjamas","sandcastle","stamp","suitcase","tent","trainers"];
const W4=["brush","chair","comb","fridge","key","mirror","oven","phone","shampoo","shelf","soap","toilet"];
const W6=["architect","cleaner","hairdresser","librarian","programmer","sailor"];

const BANK = {
  /* ===== TIER 1 — Pre-A1 / PU1 — family (listen & number, then write) ===== */
  1: {
    listening: {
      type:"interactive", obj:"family",
      audioSrc:"audio/listen-1.mp3",
      instruction:"Listen and number the people 1–6 in the order you hear them. Then choose the family word.",
      slots:[
        {label:"a", img:"assets/listening/w1-a.png", fields:[num("No.","4"), pick("Word",W1,"grandma")]},
        {label:"b", img:"assets/listening/w1-b.png", fields:[num("No.","6"), pick("Word",W1,"grandpa")]},
        {label:"c", img:"assets/listening/w1-c.png", fields:[num("No.","5"), pick("Word",W1,"sister")]},
        {label:"d", img:"assets/listening/w1-d.png", fields:[num("No.","3"), pick("Word",W1,"brother")]},
        {label:"e", img:"assets/listening/w1-e.png", example:true, fields:[num("No.","1"), pick("Word",W1,"dad")]},
        {label:"f", img:"assets/listening/w1-f.png", fields:[num("No.","2"), pick("Word",W1,"mum")]}
      ]
    },
    reading: [
      { id:"R1a", text:"🍎  What is this?", options:["an apple","a banana","an egg"], answer:0, obj:"food" },
      { id:"R1b", text:"🐶  What is this?", options:["a cat","a dog","a cow"], answer:1, obj:"animals" },
      { id:"R1c", text:"I ____ two eyes.", options:["have got","has got","got"], answer:0, obj:"have got" },
      { id:"R1d", text:"Look! The girl ____ now.", options:["swim","is swimming","swims"], answer:1, obj:"present continuous" },
      { id:"R1e", text:"____ there a pen in your bag?", options:["Is","Are","Am"], answer:0, obj:"there is/are" }
    ],
    writing: { instruction:"Write TWO sentences about yourself. Say your name, your age, and one thing you like.",
      starter:"My name is ______. I am ______ years old. I like ______.",
      prompts:["Say your name.","Say your age.","Say one thing you like."], lines:2 },
    speaking: { intro:"Do this part with your teacher. Answer in full sentences and do your best.",
      prompts:["What is your name? How old are you?","Have you got a brother or a sister? Tell me about your family.","What is your favourite food? Do you like fruit?","What is your favourite toy? Whose is it?","What sport do you like playing?","Can you swim? Can you ride a bike? What else can you do?","Tell me about your bedroom. What is in it? Where is your bed?","What are you wearing today? What clothes do you like?"] }
  },

  /* ===== TIER 2 — A1 / PU2 — around town + have to ===== */
  2: {
    listening: {
      type:"interactive", obj:"places / have to",
      audioSrc:"audio/listen-2.mp3",
      instruction:"Listen and number 1–6. Then choose the correct have to phrase.",
      slots:[
        {label:"a", img:"assets/listening/w2-a.png", stem:"I ___ my tennis racket to the sports centre.", fields:[num("No.","5"), pick("Phrase",W2,"don't have to take")]},
        {label:"b", img:"assets/listening/w2-b.png", stem:"My sister ___ some food at the supermarket.",   fields:[num("No.","3"), pick("Phrase",W2,"has to buy")]},
        {label:"c", img:"assets/listening/w2-c.png", stem:"I ___ my grandma in hospital.",                 fields:[num("No.","2"), pick("Phrase",W2,"have to visit")]},
        {label:"d", img:"assets/listening/w2-d.png", stem:"My brother has to get a book from the library.", example:true, fields:[num("No.","1"), pick("Phrase",W2,"has to get")]},
        {label:"e", img:"assets/listening/w2-e.png", stem:"I ___ my ticket for the funfair.",              fields:[num("No.","6"), pick("Phrase",W2,"have to get")]},
        {label:"f", img:"assets/listening/w2-f.png", stem:"My friend ___ a bus at the bus station.",       fields:[num("No.","4"), pick("Phrase",W2,"has to catch")]}
      ]
    },
    reading: [
      { id:"R2a", text:"A very high place made of rock is a ____.", options:["river","mountain","beach"], answer:1, obj:"geography" },
      { id:"R2b", text:"You borrow and read books at the ____.", options:["library","swimming pool","bus station"], answer:0, obj:"places" },
      { id:"R2c", text:"Yesterday we ____ pizza for dinner.", options:["eat","ate","eating"], answer:1, obj:"past simple" },
      { id:"R2d", text:"It is important. You ____ do your homework.", options:["have to","has to","having"], answer:0, obj:"have to" },
      { id:"R2e", text:"My brother is ____ than me.", options:["tall","taller","tallest"], answer:1, obj:"comparatives" }
    ],
    writing: { instruction:"Write THREE sentences about your day.", starter:"Every morning I ______.",
      prompts:["What do you do in the morning?","What do you do at school?","What do you do after school?"], lines:3 },
    speaking: { intro:"Do this part with your teacher. Answer in full sentences and do your best.",
      prompts:["Tell me about your week. What do you do on school days and at the weekend?","Describe someone in your family. Are they taller or older than you? What do they look like?","What is the weather like today? What are you wearing? What do you wear when it is cold?","Tell me about a wild animal. Where does it live? What can it do?","What did you do last weekend? Where did you go?","What must you do and what mustn't you do in class?"] }
  },

  /* ===== TIER 3 — A1+ / PU3 — travel (listen & tick, then write) ===== */
  3: {
    listening: {
      type:"interactive", obj:"travel gear",
      audioSrc:"audio/listen-3.mp3",
      instruction:"Listen and tick a or b for each item. Then choose the word.",
      slots:[
        {label:"1", img:"assets/listening/w3-1.png", stem:"Remember to pack your ___ before you go.", example:true, fields:[pick("a / b",AB,"b"), pick("Word",W3,"suitcase")]},
        {label:"2", img:"assets/listening/w3-2.png", stem:"Put in your ___.",                         fields:[pick("a / b",AB,"a"), pick("Word",W3,"trainers")]},
        {label:"3", img:"assets/listening/w3-3.png", stem:"Put up your ___ before it gets dark.",     fields:[pick("a / b",AB,"b"), pick("Word",W3,"tent")]},
        {label:"4", img:"assets/listening/w3-4.png", stem:"Put on your ___ before getting into bed.", fields:[pick("a / b",AB,"b"), pick("Word",W3,"pyjamas")]},
        {label:"5", img:"assets/listening/w3-5.png", stem:"Remember to write me a ___.",              fields:[pick("a / b",AB,"a"), pick("Word",W3,"postcard")]},
        {label:"6", img:"assets/listening/w3-6.png", stem:"I need to put a ___ on it.",               fields:[pick("a / b",AB,"a"), pick("Word",W3,"stamp")]}
      ]
    },
    reading: [
      { id:"R3a", text:"A person who brings you food in a restaurant is a ____.", options:["waiter","driver","singer"], answer:0, obj:"jobs" },
      { id:"R3b", text:"When I was five, I ____ swim. Now I can.", options:["couldn't","can","mustn't"], answer:0, obj:"could/couldn't" },
      { id:"R3c", text:"The Nile is the ____ river in the world.", options:["longer","longest","long"], answer:1, obj:"superlatives" },
      { id:"R3d", text:"My sister is very good ____ drawing.", options:["at","in","on"], answer:0, obj:"good at" },
      { id:"R3e", text:"The film was really ____ — I want to watch it again!", options:["bored","interesting","interested"], answer:1, obj:"-ed/-ing adjectives" }
    ],
    writing: { instruction:"Write FOUR sentences about the job you would like when you grow up.",
      starter:"When I grow up I would like to be a ______.",
      prompts:["What job would you like?","Why do you want to do it?","What are you good at?","What is a person in this job like?"], lines:4 },
    speaking: { intro:"Do this part with your teacher. Answer in full sentences and do your best.",
      prompts:["What can you do now that you couldn't do when you were five?","Tell me about your favourite school subject. What are you good at?","What job would you like to do when you grow up? Why?","Describe a friend. What do they look like and what are they like?","Tell me about a place you have travelled to, or want to travel to. What do you pack?","What should and shouldn't you do to stay healthy?"] }
  },

  /* ===== TIER 4 — A2 / PU4 — home objects (listen & tick, then write) ===== */
  4: {
    listening: {
      type:"interactive", obj:"home objects",
      audioSrc:"audio/listen-4.mp3",
      instruction:"Listen and tick a or b for each item. Then choose the word.",
      slots:[
        {label:"1", img:"assets/listening/w4-1.png", example:true, fields:[pick("a / b",AB,"a"), pick("Word",W4,"shampoo")]},
        {label:"2", img:"assets/listening/w4-2.png", fields:[pick("a / b",AB,"b"), pick("Word",W4,"fridge")]},
        {label:"3", img:"assets/listening/w4-3.png", fields:[pick("a / b",AB,"b"), pick("Word",W4,"comb")]},
        {label:"4", img:"assets/listening/w4-4.png", fields:[pick("a / b",AB,"b"), pick("Word",W4,"key")]},
        {label:"5", img:"assets/listening/w4-5.png", fields:[pick("a / b",AB,"a"), pick("Word",W4,"shelf")]},
        {label:"6", img:"assets/listening/w4-6.png", fields:[pick("a / b",AB,"a"), pick("Word",W4,"toilet")]}
      ]
    },
    reading: [
      { id:"R4a", text:"At the station you wait on the ____ for your train.", options:["platform","ocean","cave"], answer:0, obj:"transport" },
      { id:"R4b", text:"It is very cloudy, so I ____ need my umbrella today.", options:["might","must","can't"], answer:0, obj:"might (possibility)" },
      { id:"R4c", text:"There isn't ____ water in the desert for plants to grow.", options:["enough","many","too"], answer:0, obj:"enough" },
      { id:"R4d", text:"____ you ever been to a music festival?", options:["Did","Have","Are"], answer:1, obj:"present perfect (ever)" },
      { id:"R4e", text:"You live in a big city, ____?", options:["don't you","isn't it","do you"], answer:0, obj:"question tags" }
    ],
    writing: { instruction:"Finish the mystery story. Write about FIVE sentences (past simple and past continuous).",
      starter:"It was a dark, quiet night. I was walking home when I heard a strange noise behind me…",
      prompts:["What did you see or hear next?","What did you do?","How did the story end?"], lines:5 },
    speaking: { intro:"Do this part with your teacher. Answer in full sentences and do your best.",
      prompts:["Tell me about a journey or trip you have taken. How did you travel and where did you go?","What can we do to look after our planet and protect nature?","Have you ever done something exciting or unusual? Tell me about it.","What job would you like to do? What do people in that job have to do?","Describe your favourite food. What does it look like and taste like?","What do you like doing in winter, or in your favourite season?"] }
  },

  /* ===== TIER 5 — A2+ / PU5 — media (listen & match) ===== */
  5: {
    listening: {
      type:"interactive", obj:"media",
      audioSrc:"audio/listen-5.mp3", image:"assets/listening/worksheet-5.png", imageAlt:"Six television and media scenes labelled a to f",
      instruction:"Listen and match each speaker (1–6) to the correct picture (a–f).",
      slots:[
        {label:"Speaker 1", example:true, fields:[pick("Picture",AF,"c")]},
        {label:"Speaker 2", fields:[pick("Picture",AF,"e")]},
        {label:"Speaker 3", fields:[pick("Picture",AF,"d")]},
        {label:"Speaker 4", fields:[pick("Picture",AF,"a")]},
        {label:"Speaker 5", fields:[pick("Picture",AF,"f")]},
        {label:"Speaker 6", fields:[pick("Picture",AF,"b")]}
      ]
    },
    reading: [
      { id:"R5a", text:"You move this to control the pointer on a computer.", options:["a mouse","a printer","a screen"], answer:0, obj:"technology" },
      { id:"R5b", text:"The sandwich is not ____ the hot meal; it costs much less.", options:["as expensive as","more expensive","expensive than"], answer:0, obj:"as…as" },
      { id:"R5c", text:"If you ____ the button, the drawing app will open.", options:["will press","press","pressing"], answer:1, obj:"first conditional" },
      { id:"R5d", text:"I haven't seen my cousin ____ last summer.", options:["for","since","ago"], answer:1, obj:"for/since" },
      { id:"R5e", text:"You ____ run a marathon; a short run every day is enough.", options:["mustn't","don't have to","must"], answer:1, obj:"don't have to" }
    ],
    writing: { instruction:"Choose a sport and write a short sports commentary. Use as many modal verbs as you can (can, could, must, might, should, will).",
      starter:"We're here at the lake to watch the water-skiing today, and we might be lucky with the weather…",
      prompts:["Describe the action.","Use modal verbs (might, could, must, should, will).","Say what could happen next."], lines:5 },
    speaking: { intro:"Do this part with your teacher. Answer in full sentences and do your best.",
      prompts:["How do you use technology and the internet in your daily life?","What environmental problems do you know about? What can we do to help?","How do you keep healthy? What should people do to look after their body and mind?","Describe a meal you enjoy. What is in it and how is it cooked?","What would you do if you met your favourite celebrity or won a lot of money?","Tell me about a city or place that tourists visit. What can you see and do there?"] }
  },

  /* ===== TIER 6 — B1 / PU6 — jobs (listen & match, then write the job) ===== */
  6: {
    listening: {
      type:"interactive", obj:"jobs",
      audioSrc:"audio/listen-6.mp3", matchImages:[{l:"a",img:"assets/listening/w6-a.png"},{l:"b",img:"assets/listening/w6-b.png"},{l:"c",img:"assets/listening/w6-c.png"},{l:"d",img:"assets/listening/w6-d.png"},{l:"e",img:"assets/listening/w6-e.png"},{l:"f",img:"assets/listening/w6-f.png"}],
      instruction:"Listen and match each speaker (1–6) to a picture (a–f). Then choose the job.",
      slots:[
        {label:"Speaker 1", example:true, fields:[pick("Picture",AF,"b"), pick("Job",W6,"cleaner")]},
        {label:"Speaker 2", fields:[pick("Picture",AF,"e"), pick("Job",W6,"sailor")]},
        {label:"Speaker 3", fields:[pick("Picture",AF,"a"), pick("Job",W6,"programmer")]},
        {label:"Speaker 4", fields:[pick("Picture",AF,"c"), pick("Job",W6,"architect")]},
        {label:"Speaker 5", fields:[pick("Picture",AF,"f"), pick("Job",W6,"hairdresser")]},
        {label:"Speaker 6", fields:[pick("Picture",AF,"d"), pick("Job",W6,"librarian")]}
      ]
    },
    reading: [
      { id:"R6a", text:"'I really love live music.'  'So ____ I!'", options:["do","am","have"], answer:0, obj:"so/nor + auxiliary" },
      { id:"R6b", text:"Brazil, ____ is the largest country in South America, is huge.", options:["who","which","what"], answer:1, obj:"relative clauses" },
      { id:"R6c", text:"It is very easy ____ too much money if you are not careful.", options:["spend","spending","to spend"], answer:2, obj:"gerund/infinitive" },
      { id:"R6d", text:"You never eat lunch, so you ____ be really hungry by now!", options:["can't","must","mustn't"], answer:1, obj:"deduction (must)" },
      { id:"R6e", text:"When I arrived at school, I realised I ____ the wrong bus.", options:["took","had taken","have taken"], answer:1, obj:"past perfect" }
    ],
    writing: { instruction:"Write TEN sentences about ONE topic from your course. Use the prompt to help you.",
      starter:"Choose ONE: a city/country to visit · a review of a film or café · your dream job · a place you travelled to.",
      prompts:["Give facts and details (who, what, where, when).","Give your opinion and reasons (I think… because…).","Compare it with something else (more… than, the best…).","Use a range of tenses (present, past, present perfect)."], lines:10 },
    speaking: { intro:"Do this part with your teacher. Answer in full sentences and do your best.",
      prompts:["What career might you like in the future? Why do you think it could suit you?","Tell me about your country, or a country you know. Where do most people live?","How do you decide what to buy? How can people avoid wasting money?","What is the weather usually like where you live? What kind of weather do you wish for?","Tell me about an exciting or unusual thing that happened to you. What had happened before it?","Describe a dish from your country. What is in it and how is it made?"] }
  }
};

window.MPT = { CONFIG, TIERS, BANK, SPEAKING_RUBRIC, WRITING_RUBRIC };
