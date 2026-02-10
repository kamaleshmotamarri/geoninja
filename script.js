// Audio context
let audioContext;
let masterGain;

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioContext.destination);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duration);
}

// DOM Elements
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const comboEl = document.getElementById('comboStat');
const levelEl = document.getElementById('levelStat');
const startScreen = document.getElementById('startScreen');
const howScreen = document.getElementById('howScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const finalScoreEl = document.getElementById('finalScore');
const togglePauseBtn = document.getElementById('togglePauseBtn');
const quizModal = document.getElementById('quizModal');
const quizQuestionEl = document.getElementById('quizQuestion');
const quizOptionsEl = document.getElementById('quizOptions');

// Game State
let entities = [];
let particles = [];
let scorePopups = [];
let running = false;
let paused = false;
let pausedForQuiz = false;
let gameOver = false;
let score = 0;
const maxLives = 7;
let lives = maxLives;
let lastSpawnAt = 0;
let spawnIntervalMs = 850;
let lastT = 0;
let combo = 0;
let maxCombo = 0;
let streak = 0;
let timeScale = 1;
let level = 1;
let nextStreakLifeReward = 12;

// Power-ups
let freezeTimer = 0;
let doubleScoreTimer = 0;
let frenzyTimer = 0;

// Swipe Trail
const trailPoints = [];
const maxTrailPoints = 24;
const trailFadeMs = 350;
let isPointerDown = false;
let lastPointer = null;

// Quiz Data
const questionPools = {
    easy: [
        { q: 'What is the capital of France?', options: ['Madrid', 'Paris', 'Rome', 'Vienna'], answer: 'Paris' },
        { q: 'Which is the largest ocean?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answer: 'Pacific' },
        { q: 'What is the capital of Japan?', options: ['Seoul', 'Kyoto', 'Tokyo', 'Osaka'], answer: 'Tokyo' },
        { q: 'Which continent has the most countries?', options: ['Africa', 'Asia', 'Europe', 'South America'], answer: 'Africa' },
        { q: 'What is the smallest country?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], answer: 'Vatican City' },
        { q: 'The Great Barrier Reef is in which country?', options: ['Indonesia', 'Australia', 'Philippines', 'New Zealand'], answer: 'Australia' },
        { q: 'Which desert is the largest hot desert?', options: ['Sahara', 'Arabian', 'Gobi', 'Kalahari'], answer: 'Sahara' },
        { q: 'Which US state has the most coastline?', options: ['Florida', 'California', 'Alaska', 'Hawaii'], answer: 'Alaska' },
        { q: 'What is the capital of Italy?', options: ['Milan', 'Rome', 'Naples', 'Turin'], answer: 'Rome' },
        { q: 'What is the capital of Spain?', options: ['Madrid', 'Barcelona', 'Valencia', 'Seville'], answer: 'Madrid' },
        { q: 'What is the capital of Germany?', options: ['Munich', 'Frankfurt', 'Berlin', 'Hamburg'], answer: 'Berlin' },
        { q: 'What is the capital of India?', options: ['Mumbai', 'Bengaluru', 'Chennai', 'New Delhi'], answer: 'New Delhi' },
        { q: 'What is the capital of China?', options: ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou'], answer: 'Beijing' },
        { q: 'What is the capital of Russia?', options: ['Saint Petersburg', 'Moscow', 'Kazan', 'Novosibirsk'], answer: 'Moscow' },
        { q: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'Brasilia', 'Sao Paulo', 'Salvador'], answer: 'Brasilia' },
        { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 'Canberra' },
        { q: 'What is the capital of the United Kingdom?', options: ['Manchester', 'Birmingham', 'London', 'Leeds'], answer: 'London' },
        { q: 'What is the capital of the United States?', options: ['New York', 'Los Angeles', 'Chicago', 'Washington, D.C.'], answer: 'Washington, D.C.' },
        { q: 'Which is the largest continent?', options: ['Europe', 'Africa', 'Asia', 'South America'], answer: 'Asia' },
        { q: 'Which is the smallest continent by land area?', options: ['Australia', 'Europe', 'Antarctica', 'South America'], answer: 'Australia' },
        { q: 'Which is the largest country by land area?', options: ['China', 'Canada', 'Russia', 'United States'], answer: 'Russia' },
        { q: 'The pyramids are in which country?', options: ['Morocco', 'Egypt', 'Sudan', 'Tunisia'], answer: 'Egypt' },
        { q: 'The Sahara Desert is on which continent?', options: ['Asia', 'Africa', 'Europe', 'South America'], answer: 'Africa' },
        { q: 'Which country is called the Land of the Rising Sun?', options: ['China', 'Japan', 'South Korea', 'Thailand'], answer: 'Japan' },
        { q: 'Which river flows through Egypt?', options: ['Nile', 'Amazon', 'Danube', 'Yangtze'], answer: 'Nile' },
        { q: 'Which ocean lies between Africa and Australia?', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'], answer: 'Indian Ocean' },
        { q: 'Venice is a city in which country?', options: ['France', 'Italy', 'Spain', 'Greece'], answer: 'Italy' },
        { q: 'Madagascar is located in which ocean?', options: ['Indian Ocean', 'Pacific Ocean', 'Atlantic Ocean', 'Arctic Ocean'], answer: 'Indian Ocean' },
        { q: 'What is the capital of South Korea?', options: ['Busan', 'Seoul', 'Incheon', 'Daegu'], answer: 'Seoul' },
        { q: 'What is the capital of Mexico?', options: ['Guadalajara', 'Monterrey', 'Mexico City', 'Tijuana'], answer: 'Mexico City' },
        { q: 'What is the capital of Argentina?', options: ['Cordoba', 'Rosario', 'Mendoza', 'Buenos Aires'], answer: 'Buenos Aires' },
        { q: 'What is the capital of Turkey?', options: ['Istanbul', 'Izmir', 'Ankara', 'Bursa'], answer: 'Ankara' },
        { q: 'What is the capital of the Netherlands?', options: ['Rotterdam', 'The Hague', 'Utrecht', 'Amsterdam'], answer: 'Amsterdam' },
        { q: 'What is the capital of Switzerland?', options: ['Zurich', 'Geneva', 'Basel', 'Bern'], answer: 'Bern' },
        { q: 'What is the capital of Sweden?', options: ['Gothenburg', 'Malmo', 'Uppsala', 'Stockholm'], answer: 'Stockholm' },
        { q: 'What is the capital of Norway?', options: ['Bergen', 'Trondheim', 'Oslo', 'Stavanger'], answer: 'Oslo' },
        { q: 'What is the capital of Denmark?', options: ['Aarhus', 'Odense', 'Copenhagen', 'Aalborg'], answer: 'Copenhagen' },
        { q: 'What is the capital of Finland?', options: ['Espoo', 'Helsinki', 'Tampere', 'Turku'], answer: 'Helsinki' },
        { q: 'What is the capital of Portugal?', options: ['Porto', 'Lisbon', 'Coimbra', 'Braga'], answer: 'Lisbon' },
        { q: 'What is the capital of Belgium?', options: ['Antwerp', 'Ghent', 'Bruges', 'Brussels'], answer: 'Brussels' },
        { q: 'What is the capital of Greece?', options: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion'], answer: 'Athens' },
        { q: 'What is the capital of Egypt?', options: ['Alexandria', 'Cairo', 'Giza', 'Luxor'], answer: 'Cairo' },
        { q: 'What is the capital of Saudi Arabia?', options: ['Jeddah', 'Mecca', 'Riyadh', 'Medina'], answer: 'Riyadh' },
        { q: 'What is the capital of the United Arab Emirates?', options: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'], answer: 'Abu Dhabi' }
    ],
    medium: [
        { q: 'Which river flows through Baghdad?', options: ['Euphrates', 'Tigris', 'Jordan', 'Nile'], answer: 'Tigris' },
        { q: 'Mount Everest sits on the border of?', options: ['India-China', 'Nepal-China', 'Bhutan-Nepal', 'India-Nepal'], answer: 'Nepal-China' },
        { q: 'Which country does not border the Mediterranean?', options: ['Portugal', 'Spain', 'Italy', 'Greece'], answer: 'Portugal' },
        { q: 'What is the capital of Canada?', options: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'], answer: 'Ottawa' },
        { q: 'Which city is known as the City of Canals?', options: ['Venice', 'Amsterdam', 'Bangkok', 'Bruges'], answer: 'Venice' },
        { q: 'Which is the longest river by most measures?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 'Nile' },
        { q: 'Which sea does Ukraine border?', options: ['Baltic Sea', 'Black Sea', 'Red Sea', 'Caspian Sea'], answer: 'Black Sea' },
        { q: 'Nairobi is the capital of which country?', options: ['Uganda', 'Ethiopia', 'Kenya', 'Tanzania'], answer: 'Kenya' },
        { q: 'The Gobi Desert spans which two countries?', options: ['China and Mongolia', 'China and Russia', 'Mongolia and Kazakhstan', 'Kazakhstan and Russia'], answer: 'China and Mongolia' },
        { q: 'Lake Baikal is in which country?', options: ['Mongolia', 'Russia', 'Kazakhstan', 'China'], answer: 'Russia' },
        { q: 'The Andes are in which continent?', options: ['Africa', 'Asia', 'South America', 'Europe'], answer: 'South America' },
        { q: 'The Alps are primarily in which continent?', options: ['Europe', 'Asia', 'Africa', 'Oceania'], answer: 'Europe' },
        { q: 'Which is the highest mountain in Africa?', options: ['Mount Kenya', 'Mount Elgon', 'Mount Kilimanjaro', 'Mount Stanley'], answer: 'Mount Kilimanjaro' },
        { q: 'Which river flows through Budapest?', options: ['Rhine', 'Danube', 'Seine', 'Thames'], answer: 'Danube' },
        { q: 'Which country was formerly known as Persia?', options: ['Iraq', 'Jordan', 'Iran', 'Syria'], answer: 'Iran' },
        { q: 'Which country is enclaved within South Africa?', options: ['Eswatini', 'Botswana', 'Lesotho', 'Namibia'], answer: 'Lesotho' },
        { q: 'Which of these is landlocked in South America?', options: ['Chile', 'Uruguay', 'Paraguay', 'Ecuador'], answer: 'Paraguay' },
        { q: 'What is the capital of Pakistan?', options: ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'], answer: 'Islamabad' },
        { q: 'What is the capital of Indonesia?', options: ['Surabaya', 'Bandung', 'Jakarta', 'Medan'], answer: 'Jakarta' },
        { q: 'What is the capital of Thailand?', options: ['Chiang Mai', 'Bangkok', 'Phuket', 'Pattaya'], answer: 'Bangkok' },
        { q: 'Casablanca is a city in which country?', options: ['Algeria', 'Morocco', 'Tunisia', 'Libya'], answer: 'Morocco' },
        { q: 'The Maldives are in which ocean?', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Southern Ocean'], answer: 'Indian Ocean' },
        { q: 'Which is the largest peninsula?', options: ['Iberian Peninsula', 'Arabian Peninsula', 'Korean Peninsula', 'Yucatan Peninsula'], answer: 'Arabian Peninsula' },
        { q: 'Dubrovnik is a city in which country?', options: ['Croatia', 'Greece', 'Italy', 'Albania'], answer: 'Croatia' },
        { q: 'Sicily belongs to which country?', options: ['Greece', 'Italy', 'Malta', 'Spain'], answer: 'Italy' },
        { q: 'Zurich is in which country?', options: ['Germany', 'Austria', 'Switzerland', 'France'], answer: 'Switzerland' },
        { q: 'Which sea separates Africa from the Arabian Peninsula?', options: ['Black Sea', 'Baltic Sea', 'Red Sea', 'Caribbean Sea'], answer: 'Red Sea' },
        { q: 'Which river forms part of the border between the USA and Mexico?', options: ['Colorado River', 'Rio Grande', 'Missouri River', 'Columbia River'], answer: 'Rio Grande' },
        { q: 'Which country has the city of Reykjavik?', options: ['Norway', 'Iceland', 'Greenland', 'Faroe Islands'], answer: 'Iceland' },
        { q: 'Which country has the city of Auckland?', options: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'], answer: 'New Zealand' }
    ],
    hard: [
        { q: 'Which African lake is the source of the White Nile?', options: ['Lake Victoria', 'Lake Tanganyika', 'Lake Malawi', 'Lake Turkana'], answer: 'Lake Victoria' },
        { q: 'Which strait separates Asia from North America?', options: ['Bering Strait', 'Bosporus', 'Malacca', 'Davis Strait'], answer: 'Bering Strait' },
        { q: 'Which country is transcontinental in Europe and Asia?', options: ['Italy', 'Turkey', 'Morocco', 'Spain'], answer: 'Turkey' },
        { q: 'Which country has the most natural lakes?', options: ['Canada', 'Russia', 'Finland', 'United States'], answer: 'Canada' },
        { q: 'Which is the largest island not a continent?', options: ['Borneo', 'New Guinea', 'Greenland', 'Sumatra'], answer: 'Greenland' },
        { q: 'What is the capital of Kazakhstan?', options: ['Almaty', 'Astana (Nur-Sultan)', 'Tashkent', 'Bishkek'], answer: 'Astana (Nur-Sultan)' },
        { q: 'What is the capital of Myanmar?', options: ['Yangon', 'Mandalay', 'Naypyidaw', 'Bago'], answer: 'Naypyidaw' },
        { q: 'What is the capital of Nigeria?', options: ['Lagos', 'Kano', 'Abuja', 'Ibadan'], answer: 'Abuja' },
        { q: 'What is the capital of Tanzania?', options: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza'], answer: 'Dodoma' },
        { q: 'What is the capital of Vietnam?', options: ['Ho Chi Minh City', 'Da Nang', 'Hue', 'Hanoi'], answer: 'Hanoi' },
        { q: 'What is the capital of Laos?', options: ['Luang Prabang', 'Vientiane', 'Pakse', 'Savannakhet'], answer: 'Vientiane' },
        { q: 'What is the capital of Cambodia?', options: ['Siem Reap', 'Battambang', 'Phnom Penh', 'Sihanoukville'], answer: 'Phnom Penh' },
        { q: 'What is the capital of Mongolia?', options: ['Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan'], answer: 'Ulaanbaatar' },
        { q: 'What is the capital of South Sudan?', options: ['Juba', 'Wau', 'Malakal', 'Bor'], answer: 'Juba' },
        { q: 'What is the capital of Eritrea?', options: ['Asmara', 'Massawa', 'Keren', 'Assab'], answer: 'Asmara' },
        { q: 'What is the capital of Madagascar?', options: ['Antsirabe', 'Antananarivo', 'Toamasina', 'Fianarantsoa'], answer: 'Antananarivo' },
        { q: 'What is the capital of Namibia?', options: ['Windhoek', 'Swakopmund', 'Walvis Bay', 'Oshakati'], answer: 'Windhoek' },
        { q: 'What is the capital of Zambia?', options: ['Ndola', 'Kitwe', 'Lusaka', 'Livingstone'], answer: 'Lusaka' },
        { q: 'What is the capital of Zimbabwe?', options: ['Harare', 'Bulawayo', 'Gweru', 'Mutare'], answer: 'Harare' },
        { q: 'What is the capital of Botswana?', options: ['Gaborone', 'Francistown', 'Maun', 'Serowe'], answer: 'Gaborone' },
        { q: 'What is the capital of Malawi?', options: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'], answer: 'Lilongwe' },
        { q: 'What is the capital of Mozambique?', options: ['Beira', 'Nampula', 'Maputo', 'Tete'], answer: 'Maputo' },
        { q: 'What is the capital of Azerbaijan?', options: ['Ganja', 'Sumqayit', 'Shaki', 'Baku'], answer: 'Baku' },
        { q: 'What is the capital of Georgia (country)?', options: ['Kutaisi', 'Batumi', 'Tbilisi', 'Rustavi'], answer: 'Tbilisi' },
        { q: 'What is the capital of Armenia?', options: ['Gyumri', 'Vanadzor', 'Kapan', 'Yerevan'], answer: 'Yerevan' },
        { q: 'What is the capital of Kyrgyzstan?', options: ['Osh', 'Jalal-Abad', 'Bishkek', 'Karakol'], answer: 'Bishkek' },
        { q: 'What is the capital of Tajikistan?', options: ['Khujand', 'Kulob', 'Dushanbe', 'Bokhtar'], answer: 'Dushanbe' },
        { q: 'What is the capital of Turkmenistan?', options: ['Mary', 'Turkmenabat', 'Ashgabat', 'Dashoguz'], answer: 'Ashgabat' },
        { q: 'What is the capital of Uzbekistan?', options: ['Samarkand', 'Bukhara', 'Tashkent', 'Namangan'], answer: 'Tashkent' },
        { q: 'What is the capital of Belarus?', options: ['Gomel', 'Brest', 'Mogilev', 'Minsk'], answer: 'Minsk' },
        { q: 'What is the capital of Lithuania?', options: ['Kaunas', 'Klaipeda', 'Vilnius', 'Siauliai'], answer: 'Vilnius' },
        { q: 'What is the capital of Latvia?', options: ['Daugavpils', 'Liepaja', 'Riga', 'Jelgava'], answer: 'Riga' },
        { q: 'What is the capital of Estonia?', options: ['Tartu', 'Parnu', 'Tallinn', 'Narva'], answer: 'Tallinn' },
        { q: 'What is the capital of Cape Verde?', options: ['Praia', 'Mindelo', 'Santa Maria', 'Assomada'], answer: 'Praia' },
        { q: 'What is the capital of Seychelles?', options: ['Victoria', 'Beau Vallon', 'Anse Boileau', 'Takamaka'], answer: 'Victoria' },
        { q: 'What is the capital of Mauritius?', options: ['Curepipe', 'Beau Bassin', 'Port Louis', 'Vacoas'], answer: 'Port Louis' },
        { q: 'What is the capital of Fiji?', options: ['Nadi', 'Lautoka', 'Suva', 'Labasa'], answer: 'Suva' }
    ],
    un: [
        { q: 'How many member states are in the United Nations?', options: ['191', '193', '195', '197'], answer: '193' },
        { q: 'Where is the UN headquarters located?', options: ['Geneva', 'New York', 'Vienna', 'Paris'], answer: 'New York' },
        { q: 'Which of these is a principal UN organ?', options: ['World Bank', 'Security Council', 'OECD', 'Interpol'], answer: 'Security Council' },
        { q: 'Which country is a permanent member of the UN Security Council?', options: ['Germany', 'India', 'United Kingdom', 'Japan'], answer: 'United Kingdom' },
        { q: 'What does UNESCO focus on?', options: ['Education, Science, Culture', 'Health', 'Labor', 'Trade'], answer: 'Education, Science, Culture' },
        { q: 'Which city hosts the UN Human Rights Council?', options: ['New York', 'Geneva', 'The Hague', 'Brussels'], answer: 'Geneva' },
        { q: 'In what year was the United Nations founded?', options: ['1919', '1939', '1945', '1955'], answer: '1945' },
        { q: 'How many official languages does the UN have?', options: ['4', '5', '6', '7'], answer: '6' },
        { q: 'Where is the World Health Organization (WHO) headquartered?', options: ['Rome', 'Geneva', 'New York', 'Nairobi'], answer: 'Geneva' },
        { q: 'Where is the Food and Agriculture Organization (FAO) headquartered?', options: ['Rome', 'Paris', 'Vienna', 'Copenhagen'], answer: 'Rome' },
        { q: 'UNICEF primarily focuses on which group?', options: ['Women', 'Children', 'Refugees', 'Workers'], answer: 'Children' },
        { q: 'How many non-permanent members are on the UN Security Council?', options: ['5', '10', '12', '15'], answer: '10' },
        { q: 'How many Sustainable Development Goals (SDGs) are there?', options: ['12', '15', '17', '20'], answer: '17' },
        { q: 'What does UNHCR focus on?', options: ['Refugees', 'Labor rights', 'Trade', 'Education'], answer: 'Refugees' },
        { q: 'Which city hosts the International Court of Justice (ICJ)?', options: ['Geneva', 'The Hague', 'Vienna', 'Strasbourg'], answer: 'The Hague' },
        { q: 'UNESCO World Heritage sites are related to what?', options: ['Sports', 'Technology', 'Cultural and natural heritage', 'Finance'], answer: 'Cultural and natural heritage' },
        { q: 'When is United Nations Day observed?', options: ['June 26', 'September 21', 'October 24', 'December 10'], answer: 'October 24' },
        { q: 'UN peacekeeping forces are commonly known as what?', options: ['Green Berets', 'Blue Helmets', 'White Shields', 'Red Guards'], answer: 'Blue Helmets' },
        { q: 'Which city hosts the International Atomic Energy Agency (IAEA)?', options: ['Vienna', 'Geneva', 'New York', 'Paris'], answer: 'Vienna' },
        { q: 'Which agency is responsible for labor standards?', options: ['UNDP', 'UNICEF', 'ILO', 'UNESCO'], answer: 'ILO' }
    ]
};

let currentMode = 'easy';
const modeSettings = {
    easy: { baseSpawn: 920, minSpawn: 460, bombChance: 0.11, speedScale: 0.95 },
    medium: { baseSpawn: 840, minSpawn: 420, bombChance: 0.14, speedScale: 1.0 },
    hard: { baseSpawn: 760, minSpawn: 360, bombChance: 0.17, speedScale: 1.08 },
    un: { baseSpawn: 820, minSpawn: 380, bombChance: 0.16, speedScale: 1.04 }
};

// Resize
function fitCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fitCanvas);

// Helpers
function getQuestion() {
    const pool = questionPools[currentMode] || questionPools.easy;
    return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Spawning
function spawnEntity() {
    const settings = modeSettings[currentMode] || modeSettings.easy;
    const dynamicBombChance = Math.min(0.28, settings.bombChance + (level - 1) * 0.005);
    const isBomb = Math.random() < dynamicBombChance;

    // Powerup Chance (5%)
    const isPowerUp = !isBomb && Math.random() < 0.05;
    let powerUpType = null;

    if (isPowerUp) {
        const r = Math.random();
        if (r < 0.33) powerUpType = 'freeze'; // Freeze time
        else if (r < 0.66) powerUpType = 'frenzy'; // Spawn many fruits
        else powerUpType = 'double'; // Double points
    }

    // Radius & Position
    const radius = isBomb ? 28 : (isPowerUp ? 35 : 24 + Math.random() * 12);
    const x = 50 + Math.random() * (canvas.clientWidth - 100);
    const y = canvas.clientHeight + 45;

    // Velocity
    // Slightly more variety in launch angles
    const angle = (-Math.PI / 2) + (Math.random() * Math.PI / 2.5) - Math.PI / 5;
    const speedBoost = 1 + Math.min((level - 1) * 0.03, 0.5);
    const speed = (isBomb ? 12 : 16 + Math.random() * 6) * (canvas.clientHeight / 800) * settings.speedScale * speedBoost;
    const vx = Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1) * 0.7;
    const vy = -Math.abs(Math.sin(angle) * speed) - 10; // Even higher jump

    // Visuals
    const fruitColors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6'];
    const fruitTypes = ['🍎', '🍊', '🍌', '🍇', '🍓', '🍑', '🥝', '🍍'];

    let color = fruitColors[Math.floor(Math.random() * fruitColors.length)];
    let emoji = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

    if (isBomb) {
        color = '#1e293b';
        emoji = '💣';
    } else if (powerUpType === 'freeze') {
        color = '#0ea5e9'; // Sky blue
        emoji = '❄️';
    } else if (powerUpType === 'frenzy') {
        color = '#f59e0b'; // Amber
        emoji = '🔥';
    } else if (powerUpType === 'double') {
        color = '#8b5cf6'; // Violet
        emoji = '✨';
    }

    entities.push({
        id: crypto.randomUUID?.() || String(Math.random()),
        x, y, vx, vy, radius, color,
        type: isBomb ? 'bomb' : (isPowerUp ? 'powerup' : 'fruit'),
        powerUpType,
        angle: 0,
        spin: (Math.random() * 2 - 1) * 0.15,
        sliced: false,
        emoji
    });
}

function spawnHalf(x, y, vx, vy, radius, color, emoji, angle, rotationDir) {
    entities.push({
        id: Math.random(),
        x, y, vx, vy, radius, color,
        type: 'half',
        angle,
        spin: rotationDir * 0.2,
        sliced: true,
        emoji
    });
}

function emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 4 + Math.random() * 8; // Faster particles
        particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 4,
            life: 600 + Math.random() * 600,
            born: performance.now(),
            color,
            size: 1 + Math.random() * 4,
            gravity: 0.2 + Math.random() * 0.3
        });
    }
}

function createScorePopup(x, y, points, color = '#fff') {
    scorePopups.push({
        x, y,
        text: `+${points}`,
        color,
        life: 1000,
        born: performance.now(),
        vy: -2
    });
}

function createTextPopup(x, y, text, color = '#fff') {
    scorePopups.push({
        x, y,
        text: text,
        color,
        life: 1500,
        born: performance.now(),
        vy: -1
    });
}

// Logic
const gravity = 0.45; // Slightly higher gravity to match higher initial velocity for punchy feel
let screenShake = 0;

function update(dt) {
    // Update timers
    if (freezeTimer > 0) {
        freezeTimer -= dt;
        timeScale = 0.4; // Slow motion
    } else {
        timeScale = 1;
    }

    if (doubleScoreTimer > 0) doubleScoreTimer -= dt;
    if (frenzyTimer > 0) {
        frenzyTimer -= dt;
        // Frenzy spawning
        if (Math.random() < 0.15) spawnEntity();
    }

    const scaledDt = dt * timeScale;

    // Update entities
    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];

        // Physics
        e.vy += gravity * scaledDt * 0.05;
        e.x += e.vx * scaledDt * 0.05;
        e.y += e.vy * scaledDt * 0.05;
        e.angle += e.spin * scaledDt * 0.05;

        // Bounds
        if (e.x < e.radius) { e.x = e.radius; e.vx *= -1; }
        if (e.x > canvas.clientWidth - e.radius) { e.x = canvas.clientWidth - e.radius; e.vx *= -1; }

        // Fell off screen
        if (e.y > canvas.clientHeight + 60) {
            if ((e.type === 'fruit') && !e.sliced) {
                loseLife();
            }
            entities.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += (p.gravity || gravity) * 0.05 * dt;
        p.x += p.vx * 0.05 * dt;
        p.y += p.vy * 0.05 * dt;
        if (performance.now() - p.born > p.life) particles.splice(i, 1);
    }

    // Popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const p = scorePopups[i];
        p.y += p.vy * 0.05 * dt;
        if (performance.now() - p.born > p.life) scorePopups.splice(i, 1);
    }
}

function loseLife() {
    lives--;
    combo = 0;
    streak = 0;
    nextStreakLifeReward = 12;
    playSound(150, 0.2, 'sawtooth');
    if (lives < 0) lives = 0;
    updateHUD();

    if (lives <= 0) {
        screenShake = 10;
        openQuiz(true, {
            onCorrect: () => {
                gainLife(1);
                createTextPopup(canvas.clientWidth / 2, canvas.clientHeight / 2, 'REVIVED! +1 LIFE', '#10b981');
            },
            onWrong: () => {
                screenShake = 15;
                triggerGameOver();
            }
        });
    }
}

function gainLife(amount = 1) {
    const prev = lives;
    lives = Math.min(maxLives, lives + amount);
    if (lives > prev) {
        playSound(680, 0.2, 'triangle');
        updateHUD();
    }
}

function updateDifficultyProgression() {
    const newLevel = Math.max(1, Math.floor(score / 20) + 1);
    if (newLevel !== level) {
        level = newLevel;
        createTextPopup(canvas.clientWidth / 2, canvas.clientHeight * 0.35, `LEVEL ${level}`, '#38bdf8');
        playSound(760, 0.15, 'sine');
    }

    const settings = modeSettings[currentMode] || modeSettings.easy;
    spawnIntervalMs = Math.max(settings.minSpawn, settings.baseSpawn - (level - 1) * 18);
}

function draw() {
    ctx.save();
    if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(sx, sy);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
    ctx.clearRect(-20, -20, canvas.clientWidth + 40, canvas.clientHeight + 40);

    // Entities
    for (const e of entities) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        if (e.type === 'half') {
            // Draw half emoji by clipping
            ctx.beginPath();
            ctx.rect(-e.radius * 2, -e.radius * 2, e.radius * 4, e.radius * 2);
            ctx.clip();
        }

        // Glow
        const glowRadius = e.radius * (e.type === 'powerup' ? 2.0 : 1.5);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glow.addColorStop(0, e.color + '88');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Body with slightly more detail
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();

        // Inner shine
        const shade = ctx.createLinearGradient(-e.radius, -e.radius, e.radius, e.radius);
        shade.addColorStop(0, 'rgba(255,255,255,0.4)');
        shade.addColorStop(0.5, 'transparent');
        shade.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = shade;
        ctx.fill();

        // Emoji
        ctx.font = `${e.radius * 1.3}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.emoji, 0, 0);

        // Bomb Decor
        if (e.type === 'bomb') {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#fff';
            ctx.stroke();

            // Fuse
            ctx.beginPath();
            ctx.moveTo(0, -e.radius);
            ctx.quadraticCurveTo(10, -e.radius - 12, 8, -e.radius - 20);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Spark
            ctx.beginPath();
            ctx.arc(8, -e.radius - 20, 4 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fillStyle = Math.random() < 0.5 ? '#f59e0b' : '#ef4444';
            ctx.fill();
        }

        ctx.restore();
    }

    // Particles
    for (const p of particles) {
        const age = performance.now() - p.born;
        const alpha = 1 - (age / p.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Trail
    if (trailPoints.length > 2) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Multi-layered vibrant trail
        const layers = [
            { width: 18, color: 'rgba(56, 189, 248, 0.15)' },
            { width: 10, color: 'rgba(56, 189, 248, 0.4)' },
            { width: 4, color: '#fff' }
        ];

        layers.forEach(layer => {
            ctx.beginPath();
            ctx.lineWidth = layer.width;
            ctx.strokeStyle = layer.color;
            ctx.moveTo(trailPoints[0].x, trailPoints[0].y);

            for (let i = 1; i < trailPoints.length; i++) {
                const b = trailPoints[i];
                const alpha = Math.max(0, 1 - (performance.now() - b.t) / trailFadeMs);
                if (alpha <= 0) continue;
                ctx.lineTo(b.x, b.y);
            }
            ctx.stroke();
        });
    }

    // Popups
    for (const p of scorePopups) {
        const age = performance.now() - p.born;
        const alpha = 1 - (age / p.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        // Float up
        ctx.font = '700 24px "Outfit", sans-serif';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

// Interactivity
function addTrailPoint(x, y) {
    trailPoints.push({ x, y, t: performance.now() });
    if (trailPoints.length > maxTrailPoints) trailPoints.shift();
}

function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Account for scaling
    const scaleX = canvas.width / rect.width; // dpr
    const scaleY = canvas.height / rect.height; // dpr
    // But our logic uses client coordinates mostly, let's stick to client logical coords for game logic
    // WAIT: canvas drawing is scaled, but entity coords are logical?
    // Previous code used clientWidth/Height for entity bounds.
    // So we should return coords relative to the element, unscaled by DPR.
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function handleSlice(p1, p2) {
    let slicedCount = 0;
    if (!p1 || !p2) return;

    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (e.sliced) continue;

        // Check intersection with more forgiveness
        const forgiveness = 1.25;
        const checkRadius = e.radius * forgiveness;

        const d = { x: p2.x - p1.x, y: p2.y - p1.y };
        const f = { x: p1.x - e.x, y: p1.y - e.y };
        const a = d.x * d.x + d.y * d.y;
        if (a === 0) continue;
        const b = 2 * (f.x * d.x + f.y * d.y);
        const cVal = f.x * f.x + f.y * f.y - checkRadius * checkRadius;
        let discriminant = b * b - 4 * a * cVal;

        if (discriminant >= 0) {
            discriminant = Math.sqrt(discriminant);
            const t1 = (-b - discriminant) / (2 * a);
            const t2 = (-b + discriminant) / (2 * a);

            if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
                // Hit!
                e.sliced = true;
                slicedCount++;

                if (e.type === 'bomb') {
                    screenShake = 20;
                    entities.splice(i, 1);
                    playSound(100, 0.5, 'sawtooth');
                    openQuiz(false, {
                        onCorrect: () => {
                            score += 5;
                            gainLife(1);
                            createScorePopup(canvas.clientWidth * 0.5, canvas.clientHeight * 0.45, 5, '#fbbf24');
                            createTextPopup(canvas.clientWidth * 0.5, canvas.clientHeight * 0.52, 'BOMB DEFUSED +1 LIFE', '#10b981');
                            updateDifficultyProgression();
                            updateHUD();
                        },
                        onWrong: () => {
                            loseLife();
                        }
                    });
                    return;
                } else if (e.type === 'powerup') {
                    screenShake = 10;
                    activatePowerUp(e.powerUpType);
                    emitParticles(e.x, e.y, e.color, 40);
                    entities.splice(i, 1);
                    playSound(600, 0.3, 'sine');
                    slicedCount--; // Don't count as standard fruit combo
                } else {
                    // Fruit
                    screenShake = 4;
                    streak++;
                    combo++;
                    maxCombo = Math.max(maxCombo, combo);
                    let pts = 1;
                    if (combo >= 3) pts = 2;
                    if (doubleScoreTimer > 0) pts *= 2;

                    score += pts;
                    createScorePopup(e.x, e.y, pts, e.color);
                    emitParticles(e.x, e.y, e.color, 25);
                    playSound(300 + Math.min(combo * 50, 500), 0.1, 'triangle');

                    // Spawn halves
                    spawnHalf(e.x, e.y, e.vx - 3, e.vy - 2, e.radius, e.color, e.emoji, e.angle, -1);
                    spawnHalf(e.x, e.y, e.vx + 3, e.vy - 2, e.radius, e.color, e.emoji, e.angle + Math.PI, 1);

                    entities.splice(i, 1);
                }
            }
        }
    }

    if (slicedCount >= 2) {
        const chainBonus = slicedCount - 1;
        score += chainBonus;
        createTextPopup(lastPointer?.x || canvas.clientWidth / 2, lastPointer?.y || canvas.clientHeight / 2, `CHAIN +${chainBonus}`, '#fbbf24');
        playSound(520, 0.08, 'triangle');
    }

    if (streak >= nextStreakLifeReward) {
        gainLife(1);
        createTextPopup(canvas.clientWidth * 0.5, canvas.clientHeight * 0.4, `STREAK ${streak}! +1 LIFE`, '#34d399');
        nextStreakLifeReward += 12;
    }

    if (slicedCount === 0) combo = 0;
    updateDifficultyProgression();
    updateHUD();
}

function activatePowerUp(type) {
    if (type === 'freeze') {
        freezeTimer = 5000; // 5s
        createTextPopup(canvas.clientWidth / 2, canvas.clientHeight / 2, "❄️ FREEZE! ❄️", "#38bdf8");
    } else if (type === 'frenzy') {
        frenzyTimer = 3000; // 3s
        createTextPopup(canvas.clientWidth / 2, canvas.clientHeight / 2, "🔥 FRENZY! 🔥", "#fbbf24");
    } else if (type === 'double') {
        doubleScoreTimer = 8000; // 8s
        createTextPopup(canvas.clientWidth / 2, canvas.clientHeight / 2, "✨ 2x SCORE! ✨", "#a78bfa");
    }
}

// Input Listeners
function onDown(e) {
    if (!running || paused || pausedForQuiz || gameOver) return;
    isPointerDown = true;
    lastPointer = getCanvasPos(e);
    addTrailPoint(lastPointer.x, lastPointer.y);
}
function onMove(e) {
    if (!isPointerDown) return;
    const p = getCanvasPos(e);
    handleSlice(lastPointer, p);
    lastPointer = p;
    addTrailPoint(p.x, p.y);
}
function onUp() { isPointerDown = false; lastPointer = null; }

canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); }, { passive: false });

// UI Functions
function openQuiz(isRevive = false, callbacks = {}) {
    if (pausedForQuiz || gameOver) return;
    pausedForQuiz = true;
    const q = getQuestion();
    quizQuestionEl.textContent = q.q;
    quizOptionsEl.innerHTML = '';
    document.getElementById('quizTitle').textContent = isRevive ? 'Final Chance: Revive' : 'Bomb Challenge';

    const shuffled = shuffle([...q.options]);
    shuffled.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            const optionButtons = quizOptionsEl.querySelectorAll('.option-btn');
            optionButtons.forEach(option => {
                option.disabled = true;
                if (option.textContent === q.answer) {
                    option.classList.add('correct');
                }
            });

            if (opt === q.answer) {
                btn.classList.add('correct');
                playSound(600, 0.2, 'sine');
                setTimeout(() => {
                    quizModal.classList.remove('active');
                    pausedForQuiz = false;
                    lastT = performance.now();
                    if (typeof callbacks.onCorrect === 'function') callbacks.onCorrect();
                }, 1000);
            } else {
                btn.classList.add('wrong');
                playSound(150, 0.4, 'sawtooth');
                // Explicitly tell the player the correct answer
                const feedback = document.createElement('div');
                feedback.className = 'quiz-feedback';
                feedback.textContent = `Correct answer: ${q.answer}`;
                // Remove any existing feedback before adding a new one
                const oldFeedback = quizModal.querySelector('.quiz-feedback');
                if (oldFeedback) oldFeedback.remove();
                quizModal.appendChild(feedback);
                setTimeout(() => {
                    const existingFeedback = quizModal.querySelector('.quiz-feedback');
                    if (existingFeedback) existingFeedback.remove();
                    quizModal.classList.remove('active');
                    pausedForQuiz = false;
                    lastT = performance.now();
                    if (typeof callbacks.onWrong === 'function') callbacks.onWrong();
                }, 2000);
            }
        };
        quizOptionsEl.appendChild(btn);
    });
    quizModal.classList.add('active');
}

function updateHUD() {
    scoreEl.textContent = score;
    comboEl.textContent = `x${Math.max(1, combo)}`;
    levelEl.textContent = level;
    livesEl.innerHTML = '';
    // Show hearts up to a limit
    const maxHearts = maxLives;
    const count = Math.min(lives, maxHearts);
    for (let i = 0; i < count; i++) livesEl.innerHTML += '<span class="heart">❤</span>';
    if (lives > maxHearts) livesEl.innerHTML += `<span class="stat-label" style="margin-left: 8px;">+${lives - maxHearts}</span>`;
}

function togglePause() {
    if (!running || gameOver || pausedForQuiz) return;
    paused = !paused;
    if (paused) {
        pauseScreen.classList.add('active');
    } else {
        pauseScreen.classList.remove('active');
        lastT = performance.now(); // reset time delta preventing giant jump
    }
}

function triggerGameOver() {
    gameOver = true;
    running = false;
    finalScoreEl.textContent = score;
    gameOverScreen.classList.add('active');
}

function resetGame() {
    entities = [];
    particles = [];
    scorePopups = [];
    score = 0;
    lives = maxLives;
    combo = 0;
    maxCombo = 0;
    streak = 0;
    level = 1;
    nextStreakLifeReward = 12;
    running = true;
    paused = false;
    pausedForQuiz = false;
    gameOver = false;

    freezeTimer = 0;
    doubleScoreTimer = 0;
    frenzyTimer = 0;
    timeScale = 1;
    spawnIntervalMs = (modeSettings[currentMode] || modeSettings.easy).baseSpawn;
    lastSpawnAt = 0;
    lastT = performance.now();

    startScreen.classList.remove('active');
    howScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    pauseScreen.classList.remove('active');
    updateHUD();
}

// Mode Select
const modeButtons = [
    document.getElementById('modeEasy'),
    document.getElementById('modeMedium'),
    document.getElementById('modeHard'),
    document.getElementById('modeUN'),
];
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode || 'easy';
    });
});

// Button Events
document.getElementById('startBtn').onclick = resetGame;
document.getElementById('howBtn').onclick = () => {
    startScreen.classList.remove('active');
    howScreen.classList.add('active');
};
document.getElementById('backBtn').onclick = () => {
    howScreen.classList.remove('active');
    startScreen.classList.add('active');
};
document.getElementById('resumeBtn').onclick = togglePause;
document.getElementById('quitBtn').onclick = () => {
    pauseScreen.classList.remove('active');
    startScreen.classList.add('active');
    running = false;
};
document.getElementById('restartBtn').onclick = resetGame;
document.getElementById('homeBtn').onclick = () => {
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
};
togglePauseBtn.onclick = togglePause;

// Main Loop
function loop(t) {
    requestAnimationFrame(loop);
    const dt = t - lastT;
    lastT = t;

    // Cleanup trail
    while (trailPoints.length && performance.now() - trailPoints[0].t > trailFadeMs) {
        trailPoints.shift();
    }

    if (running && !paused && !pausedForQuiz && !gameOver) {
        if (performance.now() - lastSpawnAt > spawnIntervalMs / (frenzyTimer > 0 ? 3 : 1)) {
            spawnEntity();
            lastSpawnAt = performance.now();
        }
        update(dt); // Physics
    }

    draw();

    // Draw Pause Text if paused
    if (paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Init
fitCanvas();
updateHUD();
initAudio();
// Start screen active by default
startScreen.classList.add('active');
requestAnimationFrame(loop);
