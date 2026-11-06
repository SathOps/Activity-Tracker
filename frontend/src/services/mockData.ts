import type {
  BatchRecord,
  StandupWorkspaceResponse,
  Team,
  TeamDetailRecord,
  TeamRecord,
  TeamResult,
  UserCommitsResponse,
  UserProfileData,
  UserRecord,
  UserRole,
  WeeklyActivity,
} from '../types';
import type { InternAudioMetadata, InternSummary } from './corpus/corpusService';

export interface MockUserSession {
  id: number;
  corpus_username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  institution_id?: string;
  institution_name?: string;
  gitlab_username?: string;
  team_id?: number;
  team_name?: string;
  batch_id?: number;
  batch_name?: string;
}

export const DEFAULT_MOCK_TEAMS: Array<{ id: number; name: string; slug: string }> = [
  {
    "id": 1,
    "name": "Dev 3",
    "slug": "dev-3"
  },
  {
    "id": 2,
    "name": "Trinity",
    "slug": "trinity"
  },
  {
    "id": 3,
    "name": "Sudo",
    "slug": "sudo"
  },
  {
    "id": 4,
    "name": "Trishul",
    "slug": "trishul"
  },
  {
    "id": 5,
    "name": "BrainStorm",
    "slug": "brainstorm"
  },
  {
    "id": 6,
    "name": "Core",
    "slug": "core"
  },
  {
    "id": 7,
    "name": "Magnum",
    "slug": "magnum"
  },
  {
    "id": 8,
    "name": "TrioForce",
    "slug": "trioforce"
  },
  {
    "id": 9,
    "name": "Techops",
    "slug": "techops"
  },
  {
    "id": 10,
    "name": "Mind ops",
    "slug": "mind-ops"
  },
  {
    "id": 11,
    "name": "Code-Dev",
    "slug": "codedev"
  },
  {
    "id": 12,
    "name": "Vision Pair",
    "slug": "visionpair"
  },
  {
    "id": 13,
    "name": "Team 2Mates",
    "slug": "team-2Mates"
  },
  {
    "id": 14,
    "name": "Code Duo",
    "slug": "codeduo"
  },
  {
    "id": 15,
    "name": "Tech Titans",
    "slug": "techtitans"
  },
  {
    "id": 16,
    "name": "Alpha circle",
    "slug": "alpha-circle"
  },
  {
    "id": 17,
    "name": "Centurions",
    "slug": "centurions"
  },
  {
    "id": 18,
    "name": "Code titans",
    "slug": "code-titans"
  },
  {
    "id": 19,
    "name": "Echo Minds",
    "slug": "echo-minds"
  },
  {
    "id": 20,
    "name": "Eclipse",
    "slug": "eclipse"
  },
  {
    "id": 21,
    "name": "Five forks",
    "slug": "five-forks"
  },
  {
    "id": 22,
    "name": "Five Pixels",
    "slug": "five-pixels"
  },
  {
    "id": 23,
    "name": "FiveStack",
    "slug": "fivestack"
  },
  {
    "id": 24,
    "name": "ForkD",
    "slug": "forkd"
  },
  {
    "id": 25,
    "name": "Fusion5",
    "slug": "fusion5"
  },
  {
    "id": 26,
    "name": "Future tech",
    "slug": "future-tech"
  },
  {
    "id": 27,
    "name": "GANTS",
    "slug": "gants"
  },
  {
    "id": 28,
    "name": "High fives",
    "slug": "high-fives"
  },
  {
    "id": 29,
    "name": "InTech",
    "slug": "intech"
  },
  {
    "id": 30,
    "name": "Intelli",
    "slug": "intelli"
  },
  {
    "id": 31,
    "name": "Knight shades",
    "slug": "knight-shades"
  },
  {
    "id": 32,
    "name": "MP5",
    "slug": "mp5"
  },
  {
    "id": 33,
    "name": "NEURAL NINJAS",
    "slug": "neural-ninjas"
  },
  {
    "id": 34,
    "name": "Nexola",
    "slug": "nexola"
  },
  {
    "id": 35,
    "name": "NEXORA",
    "slug": "nexora"
  },
  {
    "id": 36,
    "name": "NextGen Minds",
    "slug": "nextgen-minds"
  },
  {
    "id": 37,
    "name": "OS5 (OPEN SOURCE FIVE",
    "slug": "os5-open-source-five"
  },
  {
    "id": 38,
    "name": "Pixel Pirates",
    "slug": "pixel-pirates"
  },
  {
    "id": 39,
    "name": "Prism",
    "slug": "prism"
  },
  {
    "id": 40,
    "name": "SI",
    "slug": "si"
  },
  {
    "id": 41,
    "name": "SKY",
    "slug": "sky"
  },
  {
    "id": 42,
    "name": "Syncron",
    "slug": "syncron"
  },
  {
    "id": 43,
    "name": "Synergy",
    "slug": "synergy"
  },
  {
    "id": 44,
    "name": "Team alpha",
    "slug": "team-alpha"
  },
  {
    "id": 45,
    "name": "Team Hybrid",
    "slug": "team-hybrid"
  },
  {
    "id": 46,
    "name": "Team Infinity",
    "slug": "team-infinity"
  },
  {
    "id": 47,
    "name": "Team MTSKV",
    "slug": "team-mtskv"
  },
  {
    "id": 48,
    "name": "Team Rashiphalalu",
    "slug": "team-rashiphalalu"
  },
  {
    "id": 49,
    "name": "Team semicolon",
    "slug": "team-semicolon"
  },
  {
    "id": 50,
    "name": "Team storm",
    "slug": "team-storm"
  },
  {
    "id": 51,
    "name": "Tech storm",
    "slug": "tech-storm"
  },
  {
    "id": 52,
    "name": "Tech strom",
    "slug": "tech-strom"
  },
  {
    "id": 53,
    "name": "Techies",
    "slug": "techies"
  },
  {
    "id": 54,
    "name": "TechX",
    "slug": "techx"
  },
  {
    "id": 55,
    "name": "TechYuga",
    "slug": "techyuga"
  },
  {
    "id": 56,
    "name": "Thunderbolts",
    "slug": "thunderbolts"
  },
  {
    "id": 57,
    "name": "ECHOVERSE",
    "slug": "echoverse"
  },
  {
    "id": 58,
    "name": "SYNTRA",
    "slug": "syntra"
  },
  {
    "id": 59,
    "name": "Algnite elite",
    "slug": "algnite-elite"
  },
  {
    "id": 60,
    "name": "OUTLIER X",
    "slug": "outlier-x"
  },
  {
    "id": 61,
    "name": "SANKALP",
    "slug": "sankalp"
  },
  {
    "id": 62,
    "name": "ALPHABET",
    "slug": "alphabet"
  },
  {
    "id": 63,
    "name": "Promptify",
    "slug": "promptify"
  },
  {
    "id": 64,
    "name": "Datapulse",
    "slug": "datapulse"
  },
  {
    "id": 65,
    "name": "DEEPTHINK",
    "slug": "deepthink"
  }
];

export const DEFAULT_MOCK_MEMBERS: Array<{
  teamSlug: string;
  internId: string;
  name: string;
}> = [
  {
    "teamSlug": "dev-3",
    "internId": "cameron_davis",
    "name": "Cameron Davis"
  },
  {
    "teamSlug": "dev-3",
    "internId": "taylor_morgan",
    "name": "Taylor Morgan"
  },
  {
    "teamSlug": "dev-3",
    "internId": "sawyer_wright",
    "name": "Sawyer Wright"
  },
  {
    "teamSlug": "trinity",
    "internId": "logan_white",
    "name": "Logan White"
  },
  {
    "teamSlug": "trinity",
    "internId": "elliott_king",
    "name": "Elliott King"
  },
  {
    "teamSlug": "trinity",
    "internId": "skyler_anderson",
    "name": "Skyler Anderson"
  },
  {
    "teamSlug": "sudo",
    "internId": "finley_martinez",
    "name": "Finley Martinez"
  },
  {
    "teamSlug": "sudo",
    "internId": "casey_taylor",
    "name": "Casey Taylor"
  },
  {
    "teamSlug": "sudo",
    "internId": "jesse_allen",
    "name": "Jesse Allen"
  },
  {
    "teamSlug": "trishul",
    "internId": "avery_carter",
    "name": "Avery Carter"
  },
  {
    "teamSlug": "trishul",
    "internId": "riley_brooks",
    "name": "Riley Brooks"
  },
  {
    "teamSlug": "trishul",
    "internId": "kai_lewis",
    "name": "Kai Lewis"
  },
  {
    "teamSlug": "brainstorm",
    "internId": "river_robinson",
    "name": "River Robinson"
  },
  {
    "teamSlug": "brainstorm",
    "internId": "jamie_hayes",
    "name": "Jamie Hayes"
  },
  {
    "teamSlug": "brainstorm",
    "internId": "dakota_miller",
    "name": "Dakota Miller"
  },
  {
    "teamSlug": "core",
    "internId": "quinn_thompson",
    "name": "Quinn Thompson"
  },
  {
    "teamSlug": "core",
    "internId": "amari_adams",
    "name": "Amari Adams"
  },
  {
    "teamSlug": "core",
    "internId": "kendall_jackson",
    "name": "Kendall Jackson"
  },
  {
    "teamSlug": "magnum",
    "internId": "alex_rivera",
    "name": "Alex Rivera"
  },
  {
    "teamSlug": "magnum",
    "internId": "harper_harris",
    "name": "Harper Harris"
  },
  {
    "teamSlug": "magnum",
    "internId": "drew_young",
    "name": "Drew Young"
  },
  {
    "teamSlug": "trioforce",
    "internId": "parker_walker",
    "name": "Parker Walker"
  },
  {
    "teamSlug": "trioforce",
    "internId": "jordan_lee",
    "name": "Jordan Lee"
  },
  {
    "teamSlug": "trioforce",
    "internId": "emerson_garcia",
    "name": "Emerson Garcia"
  },
  {
    "teamSlug": "techops",
    "internId": "rowan_thomas",
    "name": "Rowan Thomas"
  },
  {
    "teamSlug": "techops",
    "internId": "peyton_martin",
    "name": "Peyton Martin"
  },
  {
    "teamSlug": "techops",
    "internId": "dylan_hall",
    "name": "Dylan Hall"
  },
  {
    "teamSlug": "mind-ops",
    "internId": "sam_patel",
    "name": "Sam Patel"
  },
  {
    "teamSlug": "mind-ops",
    "internId": "sage_green",
    "name": "Sage Green"
  },
  {
    "teamSlug": "mind-ops",
    "internId": "reese_wilson",
    "name": "Reese Wilson"
  },
  {
    "teamSlug": "codedev",
    "internId": "corey_flores",
    "name": "Corey Flores"
  },
  {
    "teamSlug": "codedev",
    "internId": "shiloh_nelson",
    "name": "Shiloh Nelson"
  },
  {
    "teamSlug": "visionpair",
    "internId": "milan_nguyen",
    "name": "Milan Nguyen"
  },
  {
    "teamSlug": "visionpair",
    "internId": "hayden_clark",
    "name": "Hayden Clark"
  },
  {
    "teamSlug": "team-2Mates",
    "internId": "morgan_chen",
    "name": "Morgan Chen"
  },
  {
    "teamSlug": "team-2Mates",
    "internId": "devon_hill",
    "name": "Devon Hill"
  },
  {
    "teamSlug": "codeduo",
    "internId": "eden_scott",
    "name": "Eden Scott"
  },
  {
    "teamSlug": "codeduo",
    "internId": "remy_baker",
    "name": "Remy Baker"
  },
  {
    "teamSlug": "techtitans",
    "internId": "dallas_torres",
    "name": "Dallas Torres"
  },
  {
    "teamSlug": "techtitans",
    "internId": "adrian_rodriguez",
    "name": "Adrian Rodriguez"
  },
  {
    "teamSlug": "sky",
    "internId": "micah_campbell",
    "name": "Micah Campbell"
  },
  {
    "teamSlug": "centurions",
    "internId": "ellis_mitchell",
    "name": "Ellis Mitchell"
  },
  {
    "teamSlug": "neural-ninjas",
    "internId": "robin_roberts",
    "name": "Robin Roberts"
  },
  {
    "teamSlug": "prism",
    "internId": "sloan_phillips",
    "name": "Sloan Phillips"
  },
  {
    "teamSlug": "neural-ninjas",
    "internId": "lennon_evans",
    "name": "Lennon Evans"
  },
  {
    "teamSlug": "prism",
    "internId": "phoenix_turner",
    "name": "Phoenix Turner"
  },
  {
    "teamSlug": "techies",
    "internId": "rory_diaz",
    "name": "Rory Diaz"
  },
  {
    "teamSlug": "syncron",
    "internId": "oakley_parker",
    "name": "Oakley Parker"
  },
  {
    "teamSlug": "intech",
    "internId": "arlo_cruz",
    "name": "Arlo Cruz"
  },
  {
    "teamSlug": "nextgen-minds",
    "internId": "blake_edwards",
    "name": "Blake Edwards"
  },
  {
    "teamSlug": "high-fives",
    "internId": "liam_collins",
    "name": "Liam Collins"
  },
  {
    "teamSlug": "team-hybrid",
    "internId": "noah_reyes",
    "name": "Noah Reyes"
  },
  {
    "teamSlug": "fivestack",
    "internId": "oliver_stewart",
    "name": "Oliver Stewart"
  },
  {
    "teamSlug": "knight-shades",
    "internId": "james_morris",
    "name": "James Morris"
  },
  {
    "teamSlug": "nextgen-minds",
    "internId": "elijah_morales",
    "name": "Elijah Morales"
  },
  {
    "teamSlug": "knight-shades",
    "internId": "william_murphy",
    "name": "William Murphy"
  },
  {
    "teamSlug": "neural-ninjas",
    "internId": "henry_cook",
    "name": "Henry Cook"
  },
  {
    "teamSlug": "centurions",
    "internId": "lucas_rogers",
    "name": "Lucas Rogers"
  },
  {
    "teamSlug": "neural-ninjas",
    "internId": "benjamin_gutierrez",
    "name": "Benjamin Gutierrez"
  },
  {
    "teamSlug": "os5-open-source-five",
    "internId": "theodore_ortiz",
    "name": "Theodore Ortiz"
  },
  {
    "teamSlug": "team-rashiphalalu",
    "internId": "jack_cooper",
    "name": "Jack Cooper"
  },
  {
    "teamSlug": "code-titans",
    "internId": "levi_peterson",
    "name": "Levi Peterson"
  },
  {
    "teamSlug": "pixel-pirates",
    "internId": "alexander_bailey",
    "name": "Alexander Bailey"
  },
  {
    "teamSlug": "fusion5",
    "internId": "jackson_reed",
    "name": "Jackson Reed"
  },
  {
    "teamSlug": "intelli",
    "internId": "mateo_kelly",
    "name": "Mateo Kelly"
  },
  {
    "teamSlug": "centurions",
    "internId": "daniel_howard",
    "name": "Daniel Howard"
  },
  {
    "teamSlug": "mp5",
    "internId": "michael_ramos",
    "name": "Michael Ramos"
  },
  {
    "teamSlug": "centurions",
    "internId": "mason_kim",
    "name": "Mason Kim"
  },
  {
    "teamSlug": "neural-ninjas",
    "internId": "sebastian_cox",
    "name": "Sebastian Cox"
  },
  {
    "teamSlug": "techyuga",
    "internId": "ethan_ward",
    "name": "Ethan Ward"
  },
  {
    "teamSlug": "centurions",
    "internId": "emma_richardson",
    "name": "Emma Richardson"
  },
  {
    "teamSlug": "pixel-pirates",
    "internId": "olivia_watson",
    "name": "Olivia Watson"
  },
  {
    "teamSlug": "team-hybrid",
    "internId": "charlotte_chavez",
    "name": "Charlotte Chavez"
  },
  {
    "teamSlug": "forkd",
    "internId": "amelia_wood",
    "name": "Amelia Wood"
  },
  {
    "teamSlug": "fivestack",
    "internId": "sophia_james",
    "name": "Sophia James"
  },
  {
    "teamSlug": "prism",
    "internId": "isabella_bennett",
    "name": "Isabella Bennett"
  },
  {
    "teamSlug": "team-infinity",
    "internId": "ava_gray",
    "name": "Ava Gray"
  },
  {
    "teamSlug": "fusion5",
    "internId": "mia_mendoza",
    "name": "Mia Mendoza"
  },
  {
    "teamSlug": "intelli",
    "internId": "evelyn_ruiz",
    "name": "Evelyn Ruiz"
  },
  {
    "teamSlug": "pixel-pirates",
    "internId": "luna_hughes",
    "name": "Luna Hughes"
  },
  {
    "teamSlug": "team-infinity",
    "internId": "camila_price",
    "name": "Camila Price"
  },
  {
    "teamSlug": "code-titans",
    "internId": "sofia_alvarez",
    "name": "Sofia Alvarez"
  },
  {
    "teamSlug": "techtitans",
    "internId": "aria_castillo",
    "name": "Aria Castillo"
  },
  {
    "teamSlug": "code-titans",
    "internId": "scarlett_sanders",
    "name": "Scarlett Sanders"
  },
  {
    "teamSlug": "techx",
    "internId": "victoria_myers",
    "name": "Victoria Myers"
  },
  {
    "teamSlug": "fusion5",
    "internId": "eleanor_ross",
    "name": "Eleanor Ross"
  },
  {
    "teamSlug": "intech",
    "internId": "grace_foster",
    "name": "Grace Foster"
  },
  {
    "teamSlug": "gants",
    "internId": "chloe_jimenez",
    "name": "Chloe Jimenez"
  },
  {
    "teamSlug": "gants",
    "internId": "penelope_powell",
    "name": "Penelope Powell"
  },
  {
    "teamSlug": "nexora",
    "internId": "layla_jenkins",
    "name": "Layla Jenkins"
  },
  {
    "teamSlug": "techtitans",
    "internId": "zoey_perry",
    "name": "Zoey Perry"
  },
  {
    "teamSlug": "eclipse",
    "internId": "nora_russell",
    "name": "Nora Russell"
  },
  {
    "teamSlug": "thunderbolts",
    "internId": "lily_sullivan",
    "name": "Lily Sullivan"
  },
  {
    "teamSlug": "alpha-circle",
    "internId": "hannah_bell",
    "name": "Hannah Bell"
  },
  {
    "teamSlug": "team-semicolon",
    "internId": "lillian_coleman",
    "name": "Lillian Coleman"
  },
  {
    "teamSlug": "prism",
    "internId": "addison_butler",
    "name": "Addison Butler"
  },
  {
    "teamSlug": "team-semicolon",
    "internId": "aubrey_henderson",
    "name": "Aubrey Henderson"
  },
  {
    "teamSlug": "five-pixels",
    "internId": "ellie_barnes",
    "name": "Ellie Barnes"
  },
  {
    "teamSlug": "intech",
    "internId": "stella_gonzales",
    "name": "Stella Gonzales"
  },
  {
    "teamSlug": "alpha-circle",
    "internId": "natalie_fisher",
    "name": "Natalie Fisher"
  },
  {
    "teamSlug": "knight-shades",
    "internId": "zoe_vasquez",
    "name": "Zoe Vasquez"
  },
  {
    "teamSlug": "eclipse",
    "internId": "leah_simmons",
    "name": "Leah Simmons"
  },
  {
    "teamSlug": "pixel-pirates",
    "internId": "hazel_romero",
    "name": "Hazel Romero"
  },
  {
    "teamSlug": "echo-minds",
    "internId": "violet_jordan",
    "name": "Violet Jordan"
  },
  {
    "teamSlug": "synergy",
    "internId": "aurora_patterson",
    "name": "Aurora Patterson"
  },
  {
    "teamSlug": "high-fives",
    "internId": "savannah_alexander",
    "name": "Savannah Alexander"
  },
  {
    "teamSlug": "fivestack",
    "internId": "audrey_hamilton",
    "name": "Audrey Hamilton"
  },
  {
    "teamSlug": "five-forks",
    "internId": "brooklyn_graham",
    "name": "Brooklyn Graham"
  },
  {
    "teamSlug": "team-alpha",
    "internId": "bella_reynolds",
    "name": "Bella Reynolds"
  },
  {
    "teamSlug": "team-mtskv",
    "internId": "claire_griffin",
    "name": "Claire Griffin"
  },
  {
    "teamSlug": "eclipse",
    "internId": "skylar_wallace",
    "name": "Skylar Wallace"
  },
  {
    "teamSlug": "team-rashiphalalu",
    "internId": "lucy_moreno",
    "name": "Lucy Moreno"
  },
  {
    "teamSlug": "syncron",
    "internId": "paisley_west",
    "name": "Paisley West"
  },
  {
    "teamSlug": "team-hybrid",
    "internId": "everly_cole",
    "name": "Everly Cole"
  },
  {
    "teamSlug": "team-semicolon",
    "internId": "caroline_herrera",
    "name": "Caroline Herrera"
  },
  {
    "teamSlug": "nexora",
    "internId": "nova_gibson",
    "name": "Nova Gibson"
  },
  {
    "teamSlug": "techyuga",
    "internId": "genesis_ellis",
    "name": "Genesis Ellis"
  },
  {
    "teamSlug": "team-rashiphalalu",
    "internId": "emilia_tran",
    "name": "Emilia Tran"
  },
  {
    "teamSlug": "team-alpha",
    "internId": "kennedy_medina",
    "name": "Kennedy Medina"
  },
  {
    "teamSlug": "high-fives",
    "internId": "samantha_aguilar",
    "name": "Samantha Aguilar"
  },
  {
    "teamSlug": "code-titans",
    "internId": "maya_stevens",
    "name": "Maya Stevens"
  },
  {
    "teamSlug": "techies",
    "internId": "willow_murray",
    "name": "Willow Murray"
  },
  {
    "teamSlug": "team-hybrid",
    "internId": "kinsley_ford",
    "name": "Kinsley Ford"
  },
  {
    "teamSlug": "fusion5",
    "internId": "naomi_castro",
    "name": "Naomi Castro"
  },
  {
    "teamSlug": "forkd",
    "internId": "aaliyah_marshall",
    "name": "Aaliyah Marshall"
  },
  {
    "teamSlug": "future-tech",
    "internId": "elena_owens",
    "name": "Elena Owens"
  },
  {
    "teamSlug": "team-mtskv",
    "internId": "sarah_harrison",
    "name": "Sarah Harrison"
  },
  {
    "teamSlug": "sky",
    "internId": "ariana_fernandez",
    "name": "Ariana Fernandez"
  },
  {
    "teamSlug": "future-tech",
    "internId": "allison_mcdonald",
    "name": "Allison McDonald"
  },
  {
    "teamSlug": "high-fives",
    "internId": "gabriella_woods",
    "name": "Gabriella Woods"
  },
  {
    "teamSlug": "gants",
    "internId": "alice_washington",
    "name": "Alice Washington"
  },
  {
    "teamSlug": "techyuga",
    "internId": "madelyn_kennedy",
    "name": "Madelyn Kennedy"
  },
  {
    "teamSlug": "gants",
    "internId": "cora_wells",
    "name": "Cora Wells"
  },
  {
    "teamSlug": "intech",
    "internId": "ruby_vargas",
    "name": "Ruby Vargas"
  },
  {
    "teamSlug": "five-pixels",
    "internId": "eva_henry",
    "name": "Eva Henry"
  },
  {
    "teamSlug": "knight-shades",
    "internId": "serenity_freeman",
    "name": "Serenity Freeman"
  },
  {
    "teamSlug": "synergy",
    "internId": "autumn_webb",
    "name": "Autumn Webb"
  },
  {
    "teamSlug": "eclipse",
    "internId": "adeline_tucker",
    "name": "Adeline Tucker"
  },
  {
    "teamSlug": "nextgen-minds",
    "internId": "hailey_guzman",
    "name": "Hailey Guzman"
  },
  {
    "teamSlug": "techtitans",
    "internId": "gianna_burns",
    "name": "Gianna Burns"
  },
  {
    "teamSlug": "pixel-pirates",
    "internId": "valentina_crawford",
    "name": "Valentina Crawford"
  },
  {
    "teamSlug": "sky",
    "internId": "isla_olson",
    "name": "Isla Olson"
  },
  {
    "teamSlug": "nexora",
    "internId": "eliana_simpson",
    "name": "Eliana Simpson"
  },
  {
    "teamSlug": "team-mtskv",
    "internId": "nevaeh_porter",
    "name": "Nevaeh Porter"
  },
  {
    "teamSlug": "forkd",
    "internId": "ivy_hunter",
    "name": "Ivy Hunter"
  },
  {
    "teamSlug": "echo-minds",
    "internId": "sadie_gordon",
    "name": "Sadie Gordon"
  },
  {
    "teamSlug": "team-alpha",
    "internId": "piper_mendez",
    "name": "Piper Mendez"
  },
  {
    "teamSlug": "techtitans",
    "internId": "lydia_silva",
    "name": "Lydia Silva"
  },
  {
    "teamSlug": "team-alpha",
    "internId": "alexa_shaw",
    "name": "Alexa Shaw"
  },
  {
    "teamSlug": "syncron",
    "internId": "josephine_snyder",
    "name": "Josephine Snyder"
  },
  {
    "teamSlug": "team-mtskv",
    "internId": "emery_mason",
    "name": "Emery Mason"
  },
  {
    "teamSlug": "tech-storm",
    "internId": "julia_dixon",
    "name": "Julia Dixon"
  },
  {
    "teamSlug": "techx",
    "internId": "delilah_munoz",
    "name": "Delilah Munoz"
  },
  {
    "teamSlug": "gants",
    "internId": "arianna_hunt",
    "name": "Arianna Hunt"
  },
  {
    "teamSlug": "alpha-circle",
    "internId": "vivian_hicks",
    "name": "Vivian Hicks"
  },
  {
    "teamSlug": "synergy",
    "internId": "kaylee_holmes",
    "name": "Kaylee Holmes"
  },
  {
    "teamSlug": "techies",
    "internId": "sophie_palmer",
    "name": "Sophie Palmer"
  },
  {
    "teamSlug": "fusion5",
    "internId": "brielle_wagner",
    "name": "Brielle Wagner"
  },
  {
    "teamSlug": "mp5",
    "internId": "madeline_black",
    "name": "Madeline Black"
  },
  {
    "teamSlug": "tech-storm",
    "internId": "rylee_robertson",
    "name": "Rylee Robertson"
  },
  {
    "teamSlug": "forkd",
    "internId": "clara_boyd",
    "name": "Clara Boyd"
  },
  {
    "teamSlug": "five-pixels",
    "internId": "hadley_rose",
    "name": "Hadley Rose"
  },
  {
    "teamSlug": "tech-storm",
    "internId": "melanie_stone",
    "name": "Melanie Stone"
  },
  {
    "teamSlug": "five-forks",
    "internId": "mackenzie_salazar",
    "name": "Mackenzie Salazar"
  },
  {
    "teamSlug": "thunderbolts",
    "internId": "reagan_fox",
    "name": "Reagan Fox"
  },
  {
    "teamSlug": "techx",
    "internId": "adalynn_warren",
    "name": "Adalynn Warren"
  },
  {
    "teamSlug": "prism",
    "internId": "liliana_mills",
    "name": "Liliana Mills"
  },
  {
    "teamSlug": "syncron",
    "internId": "aubree_meyer",
    "name": "Aubree Meyer"
  },
  {
    "teamSlug": "mp5",
    "internId": "jade_rice",
    "name": "Jade Rice"
  },
  {
    "teamSlug": "synergy",
    "internId": "katherine_schmidt",
    "name": "Katherine Schmidt"
  },
  {
    "teamSlug": "team-infinity",
    "internId": "isabelle_garza",
    "name": "Isabelle Garza"
  },
  {
    "teamSlug": "five-forks",
    "internId": "natalia_daniels",
    "name": "Natalia Daniels"
  },
  {
    "teamSlug": "intech",
    "internId": "raelynn_ferguson",
    "name": "Raelynn Ferguson"
  },
  {
    "teamSlug": "future-tech",
    "internId": "maria_nichols",
    "name": "Maria Nichols"
  },
  {
    "teamSlug": "alpha-circle",
    "internId": "athena_stephens",
    "name": "Athena Stephens"
  },
  {
    "teamSlug": "techyuga",
    "internId": "arya_weaver",
    "name": "Arya Weaver"
  },
  {
    "teamSlug": "fivestack",
    "internId": "leilani_ryan",
    "name": "Leilani Ryan"
  },
  {
    "teamSlug": "team-rashiphalalu",
    "internId": "faith_gardner",
    "name": "Faith Gardner"
  },
  {
    "teamSlug": "nexola",
    "internId": "rose_payne",
    "name": "Rose Payne"
  },
  {
    "teamSlug": "sky",
    "internId": "kylie_grant",
    "name": "Kylie Grant"
  },
  {
    "teamSlug": "five-forks",
    "internId": "alexandra_barker",
    "name": "Alexandra Barker"
  },
  {
    "teamSlug": "high-fives",
    "internId": "mary_bradley",
    "name": "Mary Bradley"
  },
  {
    "teamSlug": "fivestack",
    "internId": "margaret_cummings",
    "name": "Margaret Cummings"
  },
  {
    "teamSlug": "syncron",
    "internId": "lyla_hansen",
    "name": "Lyla Hansen"
  },
  {
    "teamSlug": "future-tech",
    "internId": "ashley_rhodes",
    "name": "Ashley Rhodes"
  },
  {
    "teamSlug": "techtitans",
    "internId": "amaya_estrada",
    "name": "Amaya Estrada"
  },
  {
    "teamSlug": "techies",
    "internId": "eliza_webber",
    "name": "Eliza Webber"
  },
  {
    "teamSlug": "team-semicolon",
    "internId": "brianna_fleming",
    "name": "Brianna Fleming"
  },
  {
    "teamSlug": "five-pixels",
    "internId": "bailey_sharp",
    "name": "Bailey Sharp"
  },
  {
    "teamSlug": "team-infinity",
    "internId": "andrea_bowers",
    "name": "Andrea Bowers"
  },
  {
    "teamSlug": "thunderbolts",
    "internId": "khloe_underwood",
    "name": "Khloe Underwood"
  },
  {
    "teamSlug": "intelli",
    "internId": "jasmine_vance",
    "name": "Jasmine Vance"
  },
  {
    "teamSlug": "os5-open-source-five",
    "internId": "melody_ballard",
    "name": "Melody Ballard"
  },
  {
    "teamSlug": "mp5",
    "internId": "iris_powers",
    "name": "Iris Powers"
  },
  {
    "teamSlug": "techyuga",
    "internId": "isabel_hines",
    "name": "Isabel Hines"
  },
  {
    "teamSlug": "mp5",
    "internId": "norah_glover",
    "name": "Norah Glover"
  },
  {
    "teamSlug": "echo-minds",
    "internId": "annabelle_todd",
    "name": "Annabelle Todd"
  },
  {
    "teamSlug": "team-rashiphalalu",
    "internId": "valeria_mckenzie",
    "name": "Valeria Mckenzie"
  },
  {
    "teamSlug": "intelli",
    "internId": "sienna_hess",
    "name": "Sienna Hess"
  },
  {
    "teamSlug": "code-titans",
    "internId": "adalyn_beard",
    "name": "Adalyn Beard"
  },
  {
    "teamSlug": "nextgen-minds",
    "internId": "kayla_roberson",
    "name": "Kayla Roberson"
  },
  {
    "teamSlug": "team-alpha",
    "internId": "julian_fletcher",
    "name": "Julian Fletcher"
  },
  {
    "teamSlug": "future-tech",
    "internId": "leo_mullins",
    "name": "Leo Mullins"
  },
  {
    "teamSlug": "techx",
    "internId": "owen_rowe",
    "name": "Owen Rowe"
  },
  {
    "teamSlug": "knight-shades",
    "internId": "ezra_garrett",
    "name": "Ezra Garrett"
  },
  {
    "teamSlug": "team-semicolon",
    "internId": "john_browning",
    "name": "John Browning"
  },
  {
    "teamSlug": "nextgen-minds",
    "internId": "wyatt_walsh",
    "name": "Wyatt Walsh"
  },
  {
    "teamSlug": "five-pixels",
    "internId": "david_rivera",
    "name": "David Rivera"
  },
  {
    "teamSlug": "five-forks",
    "internId": "josiah_lee",
    "name": "Josiah Lee"
  },
  {
    "teamSlug": "nexora",
    "internId": "luke_morgan",
    "name": "Luke Morgan"
  },
  {
    "teamSlug": "alpha-circle",
    "internId": "asher_chen",
    "name": "Asher Chen"
  },
  {
    "teamSlug": "techx",
    "internId": "carter_taylor",
    "name": "Carter Taylor"
  },
  {
    "teamSlug": "team-mtskv",
    "internId": "julian_patel",
    "name": "Julian Patel"
  },
  {
    "teamSlug": "team-infinity",
    "internId": "grayson_brooks",
    "name": "Grayson Brooks"
  },
  {
    "teamSlug": "techies",
    "internId": "leo_hayes",
    "name": "Leo Hayes"
  },
  {
    "teamSlug": "techies",
    "internId": "jayden_carter",
    "name": "Jayden Carter"
  },
  {
    "teamSlug": "eclipse",
    "internId": "gabriel_davis",
    "name": "Gabriel Davis"
  },
  {
    "teamSlug": "sky",
    "internId": "isaac_miller",
    "name": "Isaac Miller"
  },
  {
    "teamSlug": "forkd",
    "internId": "lincoln_wilson",
    "name": "Lincoln Wilson"
  },
  {
    "teamSlug": "team-hybrid",
    "internId": "anthony_anderson",
    "name": "Anthony Anderson"
  },
  {
    "teamSlug": "echoverse",
    "internId": "hudson_thomas",
    "name": "Hudson Thomas"
  },
  {
    "teamSlug": "syntra",
    "internId": "dylan_jackson",
    "name": "Dylan Jackson"
  },
  {
    "teamSlug": "algnite-elite",
    "internId": "ezra_white",
    "name": "Ezra White"
  },
  {
    "teamSlug": "outlier-x",
    "internId": "thomas_harris",
    "name": "Thomas Harris"
  },
  {
    "teamSlug": "echoverse",
    "internId": "charles_martin",
    "name": "Charles Martin"
  },
  {
    "teamSlug": "sankalp",
    "internId": "christopher_thompson",
    "name": "Christopher Thompson"
  },
  {
    "teamSlug": "outlier-x",
    "internId": "jaxon_garcia",
    "name": "Jaxon Garcia"
  },
  {
    "teamSlug": "outlier-x",
    "internId": "maverick_martinez",
    "name": "Maverick Martinez"
  },
  {
    "teamSlug": "nexora",
    "internId": "josiah_robinson",
    "name": "Josiah Robinson"
  },
  {
    "teamSlug": "algnite-elite",
    "internId": "isaiah_clark",
    "name": "Isaiah Clark"
  },
  {
    "teamSlug": "sankalp",
    "internId": "andrew_rodriguez",
    "name": "Andrew Rodriguez"
  },
  {
    "teamSlug": "syntra",
    "internId": "elias_lewis",
    "name": "Elias Lewis"
  },
  {
    "teamSlug": "alphabet",
    "internId": "joshua_walker",
    "name": "Joshua Walker"
  },
  {
    "teamSlug": "promptify",
    "internId": "nathan_hall",
    "name": "Nathan Hall"
  },
  {
    "teamSlug": "sankalp",
    "internId": "caleb_allen",
    "name": "Caleb Allen"
  },
  {
    "teamSlug": "syntra",
    "internId": "ryan_young",
    "name": "Ryan Young"
  },
  {
    "teamSlug": "datapulse",
    "internId": "adrian_king",
    "name": "Adrian King"
  },
  {
    "teamSlug": "alphabet",
    "internId": "miles_wright",
    "name": "Miles Wright"
  },
  {
    "teamSlug": "deepthink",
    "internId": "eli_scott",
    "name": "Eli Scott"
  },
  {
    "teamSlug": "datapulse",
    "internId": "nolan_torres",
    "name": "Nolan Torres"
  },
  {
    "teamSlug": "datapulse",
    "internId": "christian_nguyen",
    "name": "Christian Nguyen"
  },
  {
    "teamSlug": "alphabet",
    "internId": "aaron_hill",
    "name": "Aaron Hill"
  },
  {
    "teamSlug": "deepthink",
    "internId": "cameron_flores",
    "name": "Cameron Flores"
  },
  {
    "teamSlug": "algnite-elite",
    "internId": "ezekiel_green",
    "name": "Ezekiel Green"
  },
  {
    "teamSlug": "promptify",
    "internId": "colton_adams",
    "name": "Colton Adams"
  },
  {
    "teamSlug": "nexora",
    "internId": "luca_nelson",
    "name": "Luca Nelson"
  },
  {
    "teamSlug": "promptify",
    "internId": "landon_baker",
    "name": "Landon Baker"
  },
  {
    "teamSlug": "deepthink",
    "internId": "hunter_campbell",
    "name": "Hunter Campbell"
  },
  {
    "teamSlug": "nexora",
    "internId": "jonathan_mitchell",
    "name": "Jonathan Mitchell"
  }
];

export const ALL_MOCK_USERS: Array<UserRecord> = [
  {
    "id": 1,
    "name": "Alex Rivera",
    "corpus_username": "alex_rivera",
    "email": "alex_rivera@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "alex_rivera",
    "role": "intern",
    "team_id": 7,
    "team_name": "Magnum",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 2,
    "name": "Jordan Lee",
    "corpus_username": "jordan_lee",
    "email": "jordan_lee@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jordan_lee",
    "role": "intern",
    "team_id": 8,
    "team_name": "TrioForce",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 3,
    "name": "Taylor Morgan",
    "corpus_username": "taylor_morgan",
    "email": "taylor_morgan@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "taylor_morgan",
    "role": "intern",
    "team_id": 1,
    "team_name": "Dev 3",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 4,
    "name": "Morgan Chen",
    "corpus_username": "morgan_chen",
    "email": "morgan_chen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "morgan_chen",
    "role": "intern",
    "team_id": 13,
    "team_name": "Team 2Mates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 5,
    "name": "Casey Taylor",
    "corpus_username": "casey_taylor",
    "email": "casey_taylor@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "casey_taylor",
    "role": "intern",
    "team_id": 3,
    "team_name": "Sudo",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 6,
    "name": "Sam Patel",
    "corpus_username": "sam_patel",
    "email": "sam_patel@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sam_patel",
    "role": "intern",
    "team_id": 10,
    "team_name": "Mind ops",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 7,
    "name": "Riley Brooks",
    "corpus_username": "riley_brooks",
    "email": "riley_brooks@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "riley_brooks",
    "role": "intern",
    "team_id": 4,
    "team_name": "Trishul",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 8,
    "name": "Jamie Hayes",
    "corpus_username": "jamie_hayes",
    "email": "jamie_hayes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jamie_hayes",
    "role": "intern",
    "team_id": 5,
    "team_name": "BrainStorm",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 9,
    "name": "Avery Carter",
    "corpus_username": "avery_carter",
    "email": "avery_carter@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "avery_carter",
    "role": "intern",
    "team_id": 4,
    "team_name": "Trishul",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 10,
    "name": "Cameron Davis",
    "corpus_username": "cameron_davis",
    "email": "cameron_davis@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "cameron_davis",
    "role": "intern",
    "team_id": 1,
    "team_name": "Dev 3",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 11,
    "name": "Dakota Miller",
    "corpus_username": "dakota_miller",
    "email": "dakota_miller@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "dakota_miller",
    "role": "intern",
    "team_id": 5,
    "team_name": "BrainStorm",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 12,
    "name": "Reese Wilson",
    "corpus_username": "reese_wilson",
    "email": "reese_wilson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "reese_wilson",
    "role": "intern",
    "team_id": 10,
    "team_name": "Mind ops",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 13,
    "name": "Skyler Anderson",
    "corpus_username": "skyler_anderson",
    "email": "skyler_anderson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "skyler_anderson",
    "role": "intern",
    "team_id": 2,
    "team_name": "Trinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 14,
    "name": "Rowan Thomas",
    "corpus_username": "rowan_thomas",
    "email": "rowan_thomas@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "rowan_thomas",
    "role": "intern",
    "team_id": 9,
    "team_name": "Techops",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 15,
    "name": "Kendall Jackson",
    "corpus_username": "kendall_jackson",
    "email": "kendall_jackson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kendall_jackson",
    "role": "intern",
    "team_id": 6,
    "team_name": "Core",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 16,
    "name": "Logan White",
    "corpus_username": "logan_white",
    "email": "logan_white@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "logan_white",
    "role": "intern",
    "team_id": 2,
    "team_name": "Trinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 17,
    "name": "Harper Harris",
    "corpus_username": "harper_harris",
    "email": "harper_harris@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "harper_harris",
    "role": "intern",
    "team_id": 7,
    "team_name": "Magnum",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 18,
    "name": "Peyton Martin",
    "corpus_username": "peyton_martin",
    "email": "peyton_martin@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "peyton_martin",
    "role": "intern",
    "team_id": 9,
    "team_name": "Techops",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 19,
    "name": "Quinn Thompson",
    "corpus_username": "quinn_thompson",
    "email": "quinn_thompson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "quinn_thompson",
    "role": "intern",
    "team_id": 6,
    "team_name": "Core",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 20,
    "name": "Emerson Garcia",
    "corpus_username": "emerson_garcia",
    "email": "emerson_garcia@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "emerson_garcia",
    "role": "intern",
    "team_id": 8,
    "team_name": "TrioForce",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 21,
    "name": "Finley Martinez",
    "corpus_username": "finley_martinez",
    "email": "finley_martinez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "finley_martinez",
    "role": "intern",
    "team_id": 3,
    "team_name": "Sudo",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 22,
    "name": "River Robinson",
    "corpus_username": "river_robinson",
    "email": "river_robinson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "river_robinson",
    "role": "intern",
    "team_id": 5,
    "team_name": "BrainStorm",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 23,
    "name": "Hayden Clark",
    "corpus_username": "hayden_clark",
    "email": "hayden_clark@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hayden_clark",
    "role": "intern",
    "team_id": 12,
    "team_name": "Vision Pair",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 24,
    "name": "Adrian Rodriguez",
    "corpus_username": "adrian_rodriguez",
    "email": "adrian_rodriguez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "adrian_rodriguez",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 25,
    "name": "Kai Lewis",
    "corpus_username": "kai_lewis",
    "email": "kai_lewis@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kai_lewis",
    "role": "intern",
    "team_id": 4,
    "team_name": "Trishul",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 26,
    "name": "Parker Walker",
    "corpus_username": "parker_walker",
    "email": "parker_walker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "parker_walker",
    "role": "intern",
    "team_id": 8,
    "team_name": "TrioForce",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 27,
    "name": "Dylan Hall",
    "corpus_username": "dylan_hall",
    "email": "dylan_hall@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "dylan_hall",
    "role": "intern",
    "team_id": 9,
    "team_name": "Techops",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 28,
    "name": "Jesse Allen",
    "corpus_username": "jesse_allen",
    "email": "jesse_allen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jesse_allen",
    "role": "intern",
    "team_id": 3,
    "team_name": "Sudo",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 29,
    "name": "Drew Young",
    "corpus_username": "drew_young",
    "email": "drew_young@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "drew_young",
    "role": "intern",
    "team_id": 7,
    "team_name": "Magnum",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 30,
    "name": "Elliott King",
    "corpus_username": "elliott_king",
    "email": "elliott_king@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "elliott_king",
    "role": "intern",
    "team_id": 2,
    "team_name": "Trinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 31,
    "name": "Sawyer Wright",
    "corpus_username": "sawyer_wright",
    "email": "sawyer_wright@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sawyer_wright",
    "role": "intern",
    "team_id": 1,
    "team_name": "Dev 3",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 32,
    "name": "Eden Scott",
    "corpus_username": "eden_scott",
    "email": "eden_scott@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "eden_scott",
    "role": "intern",
    "team_id": 14,
    "team_name": "Code Duo",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 33,
    "name": "Dallas Torres",
    "corpus_username": "dallas_torres",
    "email": "dallas_torres@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "dallas_torres",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 34,
    "name": "Milan Nguyen",
    "corpus_username": "milan_nguyen",
    "email": "milan_nguyen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "milan_nguyen",
    "role": "intern",
    "team_id": 12,
    "team_name": "Vision Pair",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 35,
    "name": "Devon Hill",
    "corpus_username": "devon_hill",
    "email": "devon_hill@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "devon_hill",
    "role": "intern",
    "team_id": 13,
    "team_name": "Team 2Mates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 36,
    "name": "Corey Flores",
    "corpus_username": "corey_flores",
    "email": "corey_flores@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "corey_flores",
    "role": "intern",
    "team_id": 11,
    "team_name": "Code-Dev",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 37,
    "name": "Sage Green",
    "corpus_username": "sage_green",
    "email": "sage_green@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sage_green",
    "role": "intern",
    "team_id": 10,
    "team_name": "Mind ops",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 38,
    "name": "Amari Adams",
    "corpus_username": "amari_adams",
    "email": "amari_adams@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "amari_adams",
    "role": "intern",
    "team_id": 6,
    "team_name": "Core",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 39,
    "name": "Shiloh Nelson",
    "corpus_username": "shiloh_nelson",
    "email": "shiloh_nelson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "shiloh_nelson",
    "role": "intern",
    "team_id": 11,
    "team_name": "Code-Dev",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 40,
    "name": "Remy Baker",
    "corpus_username": "remy_baker",
    "email": "remy_baker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "remy_baker",
    "role": "intern",
    "team_id": 14,
    "team_name": "Code Duo",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 41,
    "name": "Micah Campbell",
    "corpus_username": "micah_campbell",
    "email": "micah_campbell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "micah_campbell",
    "role": "intern",
    "team_id": 41,
    "team_name": "SKY",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 42,
    "name": "Ellis Mitchell",
    "corpus_username": "ellis_mitchell",
    "email": "ellis_mitchell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ellis_mitchell",
    "role": "intern",
    "team_id": 17,
    "team_name": "Centurions",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 43,
    "name": "Robin Roberts",
    "corpus_username": "robin_roberts",
    "email": "robin_roberts@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "robin_roberts",
    "role": "intern",
    "team_id": 33,
    "team_name": "NEURAL NINJAS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 44,
    "name": "Sloan Phillips",
    "corpus_username": "sloan_phillips",
    "email": "sloan_phillips@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sloan_phillips",
    "role": "intern",
    "team_id": 39,
    "team_name": "Prism",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 45,
    "name": "Lennon Evans",
    "corpus_username": "lennon_evans",
    "email": "lennon_evans@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lennon_evans",
    "role": "intern",
    "team_id": 33,
    "team_name": "NEURAL NINJAS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 46,
    "name": "Phoenix Turner",
    "corpus_username": "phoenix_turner",
    "email": "phoenix_turner@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "phoenix_turner",
    "role": "intern",
    "team_id": 39,
    "team_name": "Prism",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 47,
    "name": "Rory Diaz",
    "corpus_username": "rory_diaz",
    "email": "rory_diaz@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "rory_diaz",
    "role": "intern",
    "team_id": 53,
    "team_name": "Techies",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 48,
    "name": "Oakley Parker",
    "corpus_username": "oakley_parker",
    "email": "oakley_parker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "oakley_parker",
    "role": "intern",
    "team_id": 42,
    "team_name": "Syncron",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 49,
    "name": "Arlo Cruz",
    "corpus_username": "arlo_cruz",
    "email": "arlo_cruz@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "arlo_cruz",
    "role": "intern",
    "team_id": 29,
    "team_name": "InTech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 50,
    "name": "Blake Edwards",
    "corpus_username": "blake_edwards",
    "email": "blake_edwards@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "blake_edwards",
    "role": "intern",
    "team_id": 36,
    "team_name": "NextGen Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 51,
    "name": "Liam Collins",
    "corpus_username": "liam_collins",
    "email": "liam_collins@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "liam_collins",
    "role": "intern",
    "team_id": 28,
    "team_name": "High fives",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 52,
    "name": "Noah Reyes",
    "corpus_username": "noah_reyes",
    "email": "noah_reyes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "noah_reyes",
    "role": "intern",
    "team_id": 45,
    "team_name": "Team Hybrid",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 53,
    "name": "Oliver Stewart",
    "corpus_username": "oliver_stewart",
    "email": "oliver_stewart@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "oliver_stewart",
    "role": "intern",
    "team_id": 23,
    "team_name": "FiveStack",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 54,
    "name": "James Morris",
    "corpus_username": "james_morris",
    "email": "james_morris@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "james_morris",
    "role": "intern",
    "team_id": 31,
    "team_name": "Knight shades",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 55,
    "name": "Elijah Morales",
    "corpus_username": "elijah_morales",
    "email": "elijah_morales@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "elijah_morales",
    "role": "intern",
    "team_id": 36,
    "team_name": "NextGen Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 56,
    "name": "William Murphy",
    "corpus_username": "william_murphy",
    "email": "william_murphy@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "william_murphy",
    "role": "intern",
    "team_id": 31,
    "team_name": "Knight shades",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 57,
    "name": "Henry Cook",
    "corpus_username": "henry_cook",
    "email": "henry_cook@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "henry_cook",
    "role": "intern",
    "team_id": 33,
    "team_name": "NEURAL NINJAS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 58,
    "name": "Lucas Rogers",
    "corpus_username": "lucas_rogers",
    "email": "lucas_rogers@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lucas_rogers",
    "role": "intern",
    "team_id": 17,
    "team_name": "Centurions",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 59,
    "name": "Benjamin Gutierrez",
    "corpus_username": "benjamin_gutierrez",
    "email": "benjamin_gutierrez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "benjamin_gutierrez",
    "role": "intern",
    "team_id": 33,
    "team_name": "NEURAL NINJAS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 60,
    "name": "Theodore Ortiz",
    "corpus_username": "theodore_ortiz",
    "email": "theodore_ortiz@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "theodore_ortiz",
    "role": "intern",
    "team_id": 37,
    "team_name": "OS5 (OPEN SOURCE FIVE",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 61,
    "name": "Jack Cooper",
    "corpus_username": "jack_cooper",
    "email": "jack_cooper@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jack_cooper",
    "role": "intern",
    "team_id": 48,
    "team_name": "Team Rashiphalalu",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 62,
    "name": "Levi Peterson",
    "corpus_username": "levi_peterson",
    "email": "levi_peterson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "levi_peterson",
    "role": "intern",
    "team_id": 18,
    "team_name": "Code titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 63,
    "name": "Alexander Bailey",
    "corpus_username": "alexander_bailey",
    "email": "alexander_bailey@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "alexander_bailey",
    "role": "intern",
    "team_id": 38,
    "team_name": "Pixel Pirates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 64,
    "name": "Jackson Reed",
    "corpus_username": "jackson_reed",
    "email": "jackson_reed@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jackson_reed",
    "role": "intern",
    "team_id": 25,
    "team_name": "Fusion5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 65,
    "name": "Mateo Kelly",
    "corpus_username": "mateo_kelly",
    "email": "mateo_kelly@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "mateo_kelly",
    "role": "intern",
    "team_id": 30,
    "team_name": "Intelli",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 66,
    "name": "Daniel Howard",
    "corpus_username": "daniel_howard",
    "email": "daniel_howard@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "daniel_howard",
    "role": "intern",
    "team_id": 17,
    "team_name": "Centurions",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 67,
    "name": "Michael Ramos",
    "corpus_username": "michael_ramos",
    "email": "michael_ramos@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "michael_ramos",
    "role": "intern",
    "team_id": 32,
    "team_name": "MP5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 68,
    "name": "Mason Kim",
    "corpus_username": "mason_kim",
    "email": "mason_kim@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "mason_kim",
    "role": "intern",
    "team_id": 17,
    "team_name": "Centurions",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 69,
    "name": "Sebastian Cox",
    "corpus_username": "sebastian_cox",
    "email": "sebastian_cox@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sebastian_cox",
    "role": "intern",
    "team_id": 33,
    "team_name": "NEURAL NINJAS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 70,
    "name": "Ethan Ward",
    "corpus_username": "ethan_ward",
    "email": "ethan_ward@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ethan_ward",
    "role": "intern",
    "team_id": 55,
    "team_name": "TechYuga",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 71,
    "name": "Emma Richardson",
    "corpus_username": "emma_richardson",
    "email": "emma_richardson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "emma_richardson",
    "role": "intern",
    "team_id": 17,
    "team_name": "Centurions",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 72,
    "name": "Olivia Watson",
    "corpus_username": "olivia_watson",
    "email": "olivia_watson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "olivia_watson",
    "role": "intern",
    "team_id": 38,
    "team_name": "Pixel Pirates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 73,
    "name": "Charlotte Chavez",
    "corpus_username": "charlotte_chavez",
    "email": "charlotte_chavez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "charlotte_chavez",
    "role": "intern",
    "team_id": 45,
    "team_name": "Team Hybrid",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 74,
    "name": "Amelia Wood",
    "corpus_username": "amelia_wood",
    "email": "amelia_wood@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "amelia_wood",
    "role": "intern",
    "team_id": 24,
    "team_name": "ForkD",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 75,
    "name": "Sophia James",
    "corpus_username": "sophia_james",
    "email": "sophia_james@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sophia_james",
    "role": "intern",
    "team_id": 23,
    "team_name": "FiveStack",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 76,
    "name": "Isabella Bennett",
    "corpus_username": "isabella_bennett",
    "email": "isabella_bennett@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "isabella_bennett",
    "role": "intern",
    "team_id": 39,
    "team_name": "Prism",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 77,
    "name": "Ava Gray",
    "corpus_username": "ava_gray",
    "email": "ava_gray@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ava_gray",
    "role": "intern",
    "team_id": 46,
    "team_name": "Team Infinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 78,
    "name": "Mia Mendoza",
    "corpus_username": "mia_mendoza",
    "email": "mia_mendoza@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "mia_mendoza",
    "role": "intern",
    "team_id": 25,
    "team_name": "Fusion5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 79,
    "name": "Evelyn Ruiz",
    "corpus_username": "evelyn_ruiz",
    "email": "evelyn_ruiz@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "evelyn_ruiz",
    "role": "intern",
    "team_id": 30,
    "team_name": "Intelli",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 80,
    "name": "Luna Hughes",
    "corpus_username": "luna_hughes",
    "email": "luna_hughes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "luna_hughes",
    "role": "intern",
    "team_id": 38,
    "team_name": "Pixel Pirates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 81,
    "name": "Camila Price",
    "corpus_username": "camila_price",
    "email": "camila_price@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "camila_price",
    "role": "intern",
    "team_id": 46,
    "team_name": "Team Infinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 82,
    "name": "Sofia Alvarez",
    "corpus_username": "sofia_alvarez",
    "email": "sofia_alvarez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sofia_alvarez",
    "role": "intern",
    "team_id": 18,
    "team_name": "Code titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 83,
    "name": "Aria Castillo",
    "corpus_username": "aria_castillo",
    "email": "aria_castillo@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "aria_castillo",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 84,
    "name": "Scarlett Sanders",
    "corpus_username": "scarlett_sanders",
    "email": "scarlett_sanders@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "scarlett_sanders",
    "role": "intern",
    "team_id": 18,
    "team_name": "Code titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 85,
    "name": "Victoria Myers",
    "corpus_username": "victoria_myers",
    "email": "victoria_myers@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "victoria_myers",
    "role": "intern",
    "team_id": 54,
    "team_name": "TechX",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 86,
    "name": "Madison Long",
    "corpus_username": "madison_long",
    "email": "madison_long@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "madison_long",
    "role": "intern",
    "team_id": null,
    "team_name": "",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 87,
    "name": "Eleanor Ross",
    "corpus_username": "eleanor_ross",
    "email": "eleanor_ross@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "eleanor_ross",
    "role": "intern",
    "team_id": 25,
    "team_name": "Fusion5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 88,
    "name": "Grace Foster",
    "corpus_username": "grace_foster",
    "email": "grace_foster@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "grace_foster",
    "role": "intern",
    "team_id": 29,
    "team_name": "InTech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 89,
    "name": "Chloe Jimenez",
    "corpus_username": "chloe_jimenez",
    "email": "chloe_jimenez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "chloe_jimenez",
    "role": "intern",
    "team_id": 27,
    "team_name": "GANTS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 90,
    "name": "Penelope Powell",
    "corpus_username": "penelope_powell",
    "email": "penelope_powell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "penelope_powell",
    "role": "intern",
    "team_id": 27,
    "team_name": "GANTS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 91,
    "name": "Layla Jenkins",
    "corpus_username": "layla_jenkins",
    "email": "layla_jenkins@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "layla_jenkins",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 92,
    "name": "Zoey Perry",
    "corpus_username": "zoey_perry",
    "email": "zoey_perry@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "zoey_perry",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 93,
    "name": "Nora Russell",
    "corpus_username": "nora_russell",
    "email": "nora_russell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "nora_russell",
    "role": "intern",
    "team_id": 20,
    "team_name": "Eclipse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 94,
    "name": "Lily Sullivan",
    "corpus_username": "lily_sullivan",
    "email": "lily_sullivan@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lily_sullivan",
    "role": "intern",
    "team_id": 56,
    "team_name": "Thunderbolts",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 95,
    "name": "Hannah Bell",
    "corpus_username": "hannah_bell",
    "email": "hannah_bell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hannah_bell",
    "role": "intern",
    "team_id": 16,
    "team_name": "Alpha circle",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 96,
    "name": "Lillian Coleman",
    "corpus_username": "lillian_coleman",
    "email": "lillian_coleman@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lillian_coleman",
    "role": "intern",
    "team_id": 49,
    "team_name": "Team semicolon",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 97,
    "name": "Addison Butler",
    "corpus_username": "addison_butler",
    "email": "addison_butler@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "addison_butler",
    "role": "intern",
    "team_id": 39,
    "team_name": "Prism",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 98,
    "name": "Aubrey Henderson",
    "corpus_username": "aubrey_henderson",
    "email": "aubrey_henderson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "aubrey_henderson",
    "role": "intern",
    "team_id": 49,
    "team_name": "Team semicolon",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 99,
    "name": "Ellie Barnes",
    "corpus_username": "ellie_barnes",
    "email": "ellie_barnes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ellie_barnes",
    "role": "intern",
    "team_id": 22,
    "team_name": "Five Pixels",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 100,
    "name": "Stella Gonzales",
    "corpus_username": "stella_gonzales",
    "email": "stella_gonzales@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "stella_gonzales",
    "role": "intern",
    "team_id": 29,
    "team_name": "InTech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 101,
    "name": "Natalie Fisher",
    "corpus_username": "natalie_fisher",
    "email": "natalie_fisher@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "natalie_fisher",
    "role": "intern",
    "team_id": 16,
    "team_name": "Alpha circle",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 102,
    "name": "Zoe Vasquez",
    "corpus_username": "zoe_vasquez",
    "email": "zoe_vasquez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "zoe_vasquez",
    "role": "intern",
    "team_id": 31,
    "team_name": "Knight shades",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 103,
    "name": "Leah Simmons",
    "corpus_username": "leah_simmons",
    "email": "leah_simmons@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "leah_simmons",
    "role": "intern",
    "team_id": 20,
    "team_name": "Eclipse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 104,
    "name": "Hazel Romero",
    "corpus_username": "hazel_romero",
    "email": "hazel_romero@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hazel_romero",
    "role": "intern",
    "team_id": 38,
    "team_name": "Pixel Pirates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 105,
    "name": "Violet Jordan",
    "corpus_username": "violet_jordan",
    "email": "violet_jordan@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "violet_jordan",
    "role": "intern",
    "team_id": 19,
    "team_name": "Echo Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 106,
    "name": "Aurora Patterson",
    "corpus_username": "aurora_patterson",
    "email": "aurora_patterson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "aurora_patterson",
    "role": "intern",
    "team_id": 43,
    "team_name": "Synergy",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 107,
    "name": "Savannah Alexander",
    "corpus_username": "savannah_alexander",
    "email": "savannah_alexander@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "savannah_alexander",
    "role": "intern",
    "team_id": 28,
    "team_name": "High fives",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 108,
    "name": "Audrey Hamilton",
    "corpus_username": "audrey_hamilton",
    "email": "audrey_hamilton@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "audrey_hamilton",
    "role": "intern",
    "team_id": 23,
    "team_name": "FiveStack",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 109,
    "name": "Brooklyn Graham",
    "corpus_username": "brooklyn_graham",
    "email": "brooklyn_graham@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "brooklyn_graham",
    "role": "intern",
    "team_id": 21,
    "team_name": "Five forks",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 110,
    "name": "Bella Reynolds",
    "corpus_username": "bella_reynolds",
    "email": "bella_reynolds@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "bella_reynolds",
    "role": "intern",
    "team_id": 44,
    "team_name": "Team alpha",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 111,
    "name": "Claire Griffin",
    "corpus_username": "claire_griffin",
    "email": "claire_griffin@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "claire_griffin",
    "role": "intern",
    "team_id": 47,
    "team_name": "Team MTSKV",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 112,
    "name": "Skylar Wallace",
    "corpus_username": "skylar_wallace",
    "email": "skylar_wallace@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "skylar_wallace",
    "role": "intern",
    "team_id": 20,
    "team_name": "Eclipse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 113,
    "name": "Lucy Moreno",
    "corpus_username": "lucy_moreno",
    "email": "lucy_moreno@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lucy_moreno",
    "role": "intern",
    "team_id": 48,
    "team_name": "Team Rashiphalalu",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 114,
    "name": "Paisley West",
    "corpus_username": "paisley_west",
    "email": "paisley_west@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "paisley_west",
    "role": "intern",
    "team_id": 42,
    "team_name": "Syncron",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 115,
    "name": "Everly Cole",
    "corpus_username": "everly_cole",
    "email": "everly_cole@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "everly_cole",
    "role": "intern",
    "team_id": 45,
    "team_name": "Team Hybrid",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 116,
    "name": "Anna Bryant",
    "corpus_username": "anna_bryant",
    "email": "anna_bryant@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "anna_bryant",
    "role": "intern",
    "team_id": null,
    "team_name": "",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 117,
    "name": "Caroline Herrera",
    "corpus_username": "caroline_herrera",
    "email": "caroline_herrera@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "caroline_herrera",
    "role": "intern",
    "team_id": 49,
    "team_name": "Team semicolon",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 118,
    "name": "Nova Gibson",
    "corpus_username": "nova_gibson",
    "email": "nova_gibson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "nova_gibson",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 119,
    "name": "Genesis Ellis",
    "corpus_username": "genesis_ellis",
    "email": "genesis_ellis@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "genesis_ellis",
    "role": "intern",
    "team_id": 55,
    "team_name": "TechYuga",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 120,
    "name": "Emilia Tran",
    "corpus_username": "emilia_tran",
    "email": "emilia_tran@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "emilia_tran",
    "role": "intern",
    "team_id": 48,
    "team_name": "Team Rashiphalalu",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 121,
    "name": "Kennedy Medina",
    "corpus_username": "kennedy_medina",
    "email": "kennedy_medina@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kennedy_medina",
    "role": "intern",
    "team_id": 44,
    "team_name": "Team alpha",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 122,
    "name": "Samantha Aguilar",
    "corpus_username": "samantha_aguilar",
    "email": "samantha_aguilar@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "samantha_aguilar",
    "role": "intern",
    "team_id": 28,
    "team_name": "High fives",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 123,
    "name": "Maya Stevens",
    "corpus_username": "maya_stevens",
    "email": "maya_stevens@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "maya_stevens",
    "role": "intern",
    "team_id": 18,
    "team_name": "Code titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 124,
    "name": "Willow Murray",
    "corpus_username": "willow_murray",
    "email": "willow_murray@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "willow_murray",
    "role": "intern",
    "team_id": 53,
    "team_name": "Techies",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 125,
    "name": "Kinsley Ford",
    "corpus_username": "kinsley_ford",
    "email": "kinsley_ford@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kinsley_ford",
    "role": "intern",
    "team_id": 45,
    "team_name": "Team Hybrid",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 126,
    "name": "Naomi Castro",
    "corpus_username": "naomi_castro",
    "email": "naomi_castro@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "naomi_castro",
    "role": "intern",
    "team_id": 25,
    "team_name": "Fusion5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 127,
    "name": "Aaliyah Marshall",
    "corpus_username": "aaliyah_marshall",
    "email": "aaliyah_marshall@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "aaliyah_marshall",
    "role": "intern",
    "team_id": 24,
    "team_name": "ForkD",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 128,
    "name": "Elena Owens",
    "corpus_username": "elena_owens",
    "email": "elena_owens@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "elena_owens",
    "role": "intern",
    "team_id": 26,
    "team_name": "Future tech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 129,
    "name": "Sarah Harrison",
    "corpus_username": "sarah_harrison",
    "email": "sarah_harrison@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sarah_harrison",
    "role": "intern",
    "team_id": 47,
    "team_name": "Team MTSKV",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 130,
    "name": "Ariana Fernandez",
    "corpus_username": "ariana_fernandez",
    "email": "ariana_fernandez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ariana_fernandez",
    "role": "intern",
    "team_id": 41,
    "team_name": "SKY",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 131,
    "name": "Allison McDonald",
    "corpus_username": "allison_mcdonald",
    "email": "allison_mcdonald@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "allison_mcdonald",
    "role": "intern",
    "team_id": 26,
    "team_name": "Future tech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 132,
    "name": "Gabriella Woods",
    "corpus_username": "gabriella_woods",
    "email": "gabriella_woods@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "gabriella_woods",
    "role": "intern",
    "team_id": 28,
    "team_name": "High fives",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 133,
    "name": "Alice Washington",
    "corpus_username": "alice_washington",
    "email": "alice_washington@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "alice_washington",
    "role": "intern",
    "team_id": 27,
    "team_name": "GANTS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 134,
    "name": "Madelyn Kennedy",
    "corpus_username": "madelyn_kennedy",
    "email": "madelyn_kennedy@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "madelyn_kennedy",
    "role": "intern",
    "team_id": 55,
    "team_name": "TechYuga",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 135,
    "name": "Cora Wells",
    "corpus_username": "cora_wells",
    "email": "cora_wells@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "cora_wells",
    "role": "intern",
    "team_id": 27,
    "team_name": "GANTS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 136,
    "name": "Ruby Vargas",
    "corpus_username": "ruby_vargas",
    "email": "ruby_vargas@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ruby_vargas",
    "role": "intern",
    "team_id": 29,
    "team_name": "InTech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 137,
    "name": "Eva Henry",
    "corpus_username": "eva_henry",
    "email": "eva_henry@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "eva_henry",
    "role": "intern",
    "team_id": 22,
    "team_name": "Five Pixels",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 138,
    "name": "Serenity Freeman",
    "corpus_username": "serenity_freeman",
    "email": "serenity_freeman@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "serenity_freeman",
    "role": "intern",
    "team_id": 31,
    "team_name": "Knight shades",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 139,
    "name": "Autumn Webb",
    "corpus_username": "autumn_webb",
    "email": "autumn_webb@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "autumn_webb",
    "role": "intern",
    "team_id": 43,
    "team_name": "Synergy",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 140,
    "name": "Adeline Tucker",
    "corpus_username": "adeline_tucker",
    "email": "adeline_tucker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "adeline_tucker",
    "role": "intern",
    "team_id": 20,
    "team_name": "Eclipse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 141,
    "name": "Hailey Guzman",
    "corpus_username": "hailey_guzman",
    "email": "hailey_guzman@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hailey_guzman",
    "role": "intern",
    "team_id": 36,
    "team_name": "NextGen Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 142,
    "name": "Gianna Burns",
    "corpus_username": "gianna_burns",
    "email": "gianna_burns@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "gianna_burns",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 143,
    "name": "Valentina Crawford",
    "corpus_username": "valentina_crawford",
    "email": "valentina_crawford@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "valentina_crawford",
    "role": "intern",
    "team_id": 38,
    "team_name": "Pixel Pirates",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 144,
    "name": "Isla Olson",
    "corpus_username": "isla_olson",
    "email": "isla_olson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "isla_olson",
    "role": "intern",
    "team_id": 41,
    "team_name": "SKY",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 145,
    "name": "Eliana Simpson",
    "corpus_username": "eliana_simpson",
    "email": "eliana_simpson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "eliana_simpson",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 146,
    "name": "Nevaeh Porter",
    "corpus_username": "nevaeh_porter",
    "email": "nevaeh_porter@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "nevaeh_porter",
    "role": "intern",
    "team_id": 47,
    "team_name": "Team MTSKV",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 147,
    "name": "Ivy Hunter",
    "corpus_username": "ivy_hunter",
    "email": "ivy_hunter@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ivy_hunter",
    "role": "intern",
    "team_id": 24,
    "team_name": "ForkD",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 148,
    "name": "Sadie Gordon",
    "corpus_username": "sadie_gordon",
    "email": "sadie_gordon@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sadie_gordon",
    "role": "intern",
    "team_id": 19,
    "team_name": "Echo Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 149,
    "name": "Piper Mendez",
    "corpus_username": "piper_mendez",
    "email": "piper_mendez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "piper_mendez",
    "role": "intern",
    "team_id": 44,
    "team_name": "Team alpha",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 150,
    "name": "Lydia Silva",
    "corpus_username": "lydia_silva",
    "email": "lydia_silva@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lydia_silva",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 151,
    "name": "Alexa Shaw",
    "corpus_username": "alexa_shaw",
    "email": "alexa_shaw@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "alexa_shaw",
    "role": "intern",
    "team_id": 44,
    "team_name": "Team alpha",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 152,
    "name": "Josephine Snyder",
    "corpus_username": "josephine_snyder",
    "email": "josephine_snyder@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "josephine_snyder",
    "role": "intern",
    "team_id": 42,
    "team_name": "Syncron",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 153,
    "name": "Emery Mason",
    "corpus_username": "emery_mason",
    "email": "emery_mason@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "emery_mason",
    "role": "intern",
    "team_id": 47,
    "team_name": "Team MTSKV",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 154,
    "name": "Julia Dixon",
    "corpus_username": "julia_dixon",
    "email": "julia_dixon@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "julia_dixon",
    "role": "intern",
    "team_id": 51,
    "team_name": "Tech storm",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 155,
    "name": "Delilah Munoz",
    "corpus_username": "delilah_munoz",
    "email": "delilah_munoz@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "delilah_munoz",
    "role": "intern",
    "team_id": 54,
    "team_name": "TechX",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 156,
    "name": "Arianna Hunt",
    "corpus_username": "arianna_hunt",
    "email": "arianna_hunt@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "arianna_hunt",
    "role": "intern",
    "team_id": 27,
    "team_name": "GANTS",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 157,
    "name": "Vivian Hicks",
    "corpus_username": "vivian_hicks",
    "email": "vivian_hicks@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "vivian_hicks",
    "role": "intern",
    "team_id": 16,
    "team_name": "Alpha circle",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 158,
    "name": "Kaylee Holmes",
    "corpus_username": "kaylee_holmes",
    "email": "kaylee_holmes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kaylee_holmes",
    "role": "intern",
    "team_id": 43,
    "team_name": "Synergy",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 159,
    "name": "Sophie Palmer",
    "corpus_username": "sophie_palmer",
    "email": "sophie_palmer@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sophie_palmer",
    "role": "intern",
    "team_id": 53,
    "team_name": "Techies",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 160,
    "name": "Brielle Wagner",
    "corpus_username": "brielle_wagner",
    "email": "brielle_wagner@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "brielle_wagner",
    "role": "intern",
    "team_id": 25,
    "team_name": "Fusion5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 161,
    "name": "Madeline Black",
    "corpus_username": "madeline_black",
    "email": "madeline_black@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "madeline_black",
    "role": "intern",
    "team_id": 32,
    "team_name": "MP5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 162,
    "name": "Rylee Robertson",
    "corpus_username": "rylee_robertson",
    "email": "rylee_robertson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "rylee_robertson",
    "role": "intern",
    "team_id": 51,
    "team_name": "Tech storm",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 163,
    "name": "Clara Boyd",
    "corpus_username": "clara_boyd",
    "email": "clara_boyd@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "clara_boyd",
    "role": "intern",
    "team_id": 24,
    "team_name": "ForkD",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 164,
    "name": "Hadley Rose",
    "corpus_username": "hadley_rose",
    "email": "hadley_rose@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hadley_rose",
    "role": "intern",
    "team_id": 22,
    "team_name": "Five Pixels",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 165,
    "name": "Melanie Stone",
    "corpus_username": "melanie_stone",
    "email": "melanie_stone@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "melanie_stone",
    "role": "intern",
    "team_id": 51,
    "team_name": "Tech storm",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 166,
    "name": "Mackenzie Salazar",
    "corpus_username": "mackenzie_salazar",
    "email": "mackenzie_salazar@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "mackenzie_salazar",
    "role": "intern",
    "team_id": 21,
    "team_name": "Five forks",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 167,
    "name": "Reagan Fox",
    "corpus_username": "reagan_fox",
    "email": "reagan_fox@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "reagan_fox",
    "role": "intern",
    "team_id": 56,
    "team_name": "Thunderbolts",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 168,
    "name": "Adalynn Warren",
    "corpus_username": "adalynn_warren",
    "email": "adalynn_warren@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "adalynn_warren",
    "role": "intern",
    "team_id": 54,
    "team_name": "TechX",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 169,
    "name": "Liliana Mills",
    "corpus_username": "liliana_mills",
    "email": "liliana_mills@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "liliana_mills",
    "role": "intern",
    "team_id": 39,
    "team_name": "Prism",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 170,
    "name": "Aubree Meyer",
    "corpus_username": "aubree_meyer",
    "email": "aubree_meyer@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "aubree_meyer",
    "role": "intern",
    "team_id": 42,
    "team_name": "Syncron",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 171,
    "name": "Jade Rice",
    "corpus_username": "jade_rice",
    "email": "jade_rice@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jade_rice",
    "role": "intern",
    "team_id": 32,
    "team_name": "MP5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 172,
    "name": "Katherine Schmidt",
    "corpus_username": "katherine_schmidt",
    "email": "katherine_schmidt@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "katherine_schmidt",
    "role": "intern",
    "team_id": 43,
    "team_name": "Synergy",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 173,
    "name": "Isabelle Garza",
    "corpus_username": "isabelle_garza",
    "email": "isabelle_garza@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "isabelle_garza",
    "role": "intern",
    "team_id": 46,
    "team_name": "Team Infinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 174,
    "name": "Natalia Daniels",
    "corpus_username": "natalia_daniels",
    "email": "natalia_daniels@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "natalia_daniels",
    "role": "intern",
    "team_id": 21,
    "team_name": "Five forks",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 175,
    "name": "Raelynn Ferguson",
    "corpus_username": "raelynn_ferguson",
    "email": "raelynn_ferguson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "raelynn_ferguson",
    "role": "intern",
    "team_id": 29,
    "team_name": "InTech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 176,
    "name": "Maria Nichols",
    "corpus_username": "maria_nichols",
    "email": "maria_nichols@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "maria_nichols",
    "role": "intern",
    "team_id": 26,
    "team_name": "Future tech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 177,
    "name": "Athena Stephens",
    "corpus_username": "athena_stephens",
    "email": "athena_stephens@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "athena_stephens",
    "role": "intern",
    "team_id": 16,
    "team_name": "Alpha circle",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 178,
    "name": "Ximena Soto",
    "corpus_username": "ximena_soto",
    "email": "ximena_soto@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ximena_soto",
    "role": "intern",
    "team_id": null,
    "team_name": "",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 179,
    "name": "Arya Weaver",
    "corpus_username": "arya_weaver",
    "email": "arya_weaver@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "arya_weaver",
    "role": "intern",
    "team_id": 55,
    "team_name": "TechYuga",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 180,
    "name": "Leilani Ryan",
    "corpus_username": "leilani_ryan",
    "email": "leilani_ryan@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "leilani_ryan",
    "role": "intern",
    "team_id": 23,
    "team_name": "FiveStack",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 181,
    "name": "Faith Gardner",
    "corpus_username": "faith_gardner",
    "email": "faith_gardner@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "faith_gardner",
    "role": "intern",
    "team_id": 48,
    "team_name": "Team Rashiphalalu",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 182,
    "name": "Rose Payne",
    "corpus_username": "rose_payne",
    "email": "rose_payne@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "rose_payne",
    "role": "intern",
    "team_id": 34,
    "team_name": "Nexola",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 183,
    "name": "Kylie Grant",
    "corpus_username": "kylie_grant",
    "email": "kylie_grant@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kylie_grant",
    "role": "intern",
    "team_id": 41,
    "team_name": "SKY",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 184,
    "name": "Alexandra Barker",
    "corpus_username": "alexandra_barker",
    "email": "alexandra_barker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "alexandra_barker",
    "role": "intern",
    "team_id": 21,
    "team_name": "Five forks",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 185,
    "name": "Mary Bradley",
    "corpus_username": "mary_bradley",
    "email": "mary_bradley@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "mary_bradley",
    "role": "intern",
    "team_id": 28,
    "team_name": "High fives",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 186,
    "name": "Margaret Cummings",
    "corpus_username": "margaret_cummings",
    "email": "margaret_cummings@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "margaret_cummings",
    "role": "intern",
    "team_id": 23,
    "team_name": "FiveStack",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 187,
    "name": "Lyla Hansen",
    "corpus_username": "lyla_hansen",
    "email": "lyla_hansen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lyla_hansen",
    "role": "intern",
    "team_id": 42,
    "team_name": "Syncron",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 188,
    "name": "Ashley Rhodes",
    "corpus_username": "ashley_rhodes",
    "email": "ashley_rhodes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ashley_rhodes",
    "role": "intern",
    "team_id": 26,
    "team_name": "Future tech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 189,
    "name": "Amaya Estrada",
    "corpus_username": "amaya_estrada",
    "email": "amaya_estrada@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "amaya_estrada",
    "role": "intern",
    "team_id": 15,
    "team_name": "Tech Titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 190,
    "name": "Eliza Webber",
    "corpus_username": "eliza_webber",
    "email": "eliza_webber@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "eliza_webber",
    "role": "intern",
    "team_id": 53,
    "team_name": "Techies",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 191,
    "name": "Brianna Fleming",
    "corpus_username": "brianna_fleming",
    "email": "brianna_fleming@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "brianna_fleming",
    "role": "intern",
    "team_id": 49,
    "team_name": "Team semicolon",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 192,
    "name": "Bailey Sharp",
    "corpus_username": "bailey_sharp",
    "email": "bailey_sharp@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "bailey_sharp",
    "role": "intern",
    "team_id": 22,
    "team_name": "Five Pixels",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 193,
    "name": "Andrea Bowers",
    "corpus_username": "andrea_bowers",
    "email": "andrea_bowers@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "andrea_bowers",
    "role": "intern",
    "team_id": 46,
    "team_name": "Team Infinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 194,
    "name": "Khloe Underwood",
    "corpus_username": "khloe_underwood",
    "email": "khloe_underwood@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "khloe_underwood",
    "role": "intern",
    "team_id": 56,
    "team_name": "Thunderbolts",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 195,
    "name": "Jasmine Vance",
    "corpus_username": "jasmine_vance",
    "email": "jasmine_vance@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jasmine_vance",
    "role": "intern",
    "team_id": 30,
    "team_name": "Intelli",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 196,
    "name": "Melody Ballard",
    "corpus_username": "melody_ballard",
    "email": "melody_ballard@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "melody_ballard",
    "role": "intern",
    "team_id": 37,
    "team_name": "OS5 (OPEN SOURCE FIVE",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 197,
    "name": "Iris Powers",
    "corpus_username": "iris_powers",
    "email": "iris_powers@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "iris_powers",
    "role": "intern",
    "team_id": 32,
    "team_name": "MP5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 198,
    "name": "Isabel Hines",
    "corpus_username": "isabel_hines",
    "email": "isabel_hines@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "isabel_hines",
    "role": "intern",
    "team_id": 55,
    "team_name": "TechYuga",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 199,
    "name": "Norah Glover",
    "corpus_username": "norah_glover",
    "email": "norah_glover@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "norah_glover",
    "role": "intern",
    "team_id": 32,
    "team_name": "MP5",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 200,
    "name": "Annabelle Todd",
    "corpus_username": "annabelle_todd",
    "email": "annabelle_todd@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "annabelle_todd",
    "role": "intern",
    "team_id": 19,
    "team_name": "Echo Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 201,
    "name": "Valeria Mckenzie",
    "corpus_username": "valeria_mckenzie",
    "email": "valeria_mckenzie@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "valeria_mckenzie",
    "role": "intern",
    "team_id": 48,
    "team_name": "Team Rashiphalalu",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 202,
    "name": "Sienna Hess",
    "corpus_username": "sienna_hess",
    "email": "sienna_hess@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "sienna_hess",
    "role": "intern",
    "team_id": 30,
    "team_name": "Intelli",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 203,
    "name": "Adalyn Beard",
    "corpus_username": "adalyn_beard",
    "email": "adalyn_beard@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "adalyn_beard",
    "role": "intern",
    "team_id": 18,
    "team_name": "Code titans",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 204,
    "name": "Kayla Roberson",
    "corpus_username": "kayla_roberson",
    "email": "kayla_roberson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "kayla_roberson",
    "role": "intern",
    "team_id": 36,
    "team_name": "NextGen Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 205,
    "name": "Julian Fletcher",
    "corpus_username": "julian_fletcher",
    "email": "julian_fletcher@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "julian_fletcher",
    "role": "intern",
    "team_id": 44,
    "team_name": "Team alpha",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 206,
    "name": "Leo Mullins",
    "corpus_username": "leo_mullins",
    "email": "leo_mullins@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "leo_mullins",
    "role": "intern",
    "team_id": 26,
    "team_name": "Future tech",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 207,
    "name": "Owen Rowe",
    "corpus_username": "owen_rowe",
    "email": "owen_rowe@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "owen_rowe",
    "role": "intern",
    "team_id": 54,
    "team_name": "TechX",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 208,
    "name": "Ezra Garrett",
    "corpus_username": "ezra_garrett",
    "email": "ezra_garrett@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ezra_garrett",
    "role": "intern",
    "team_id": 31,
    "team_name": "Knight shades",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 209,
    "name": "John Browning",
    "corpus_username": "john_browning",
    "email": "john_browning@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "john_browning",
    "role": "intern",
    "team_id": 49,
    "team_name": "Team semicolon",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 210,
    "name": "Wyatt Walsh",
    "corpus_username": "wyatt_walsh",
    "email": "wyatt_walsh@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "wyatt_walsh",
    "role": "intern",
    "team_id": 36,
    "team_name": "NextGen Minds",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 211,
    "name": "David Rivera",
    "corpus_username": "david_rivera",
    "email": "david_rivera@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "david_rivera",
    "role": "intern",
    "team_id": 22,
    "team_name": "Five Pixels",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 212,
    "name": "Josiah Lee",
    "corpus_username": "josiah_lee",
    "email": "josiah_lee@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "josiah_lee",
    "role": "intern",
    "team_id": 21,
    "team_name": "Five forks",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 213,
    "name": "Luke Morgan",
    "corpus_username": "luke_morgan",
    "email": "luke_morgan@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "luke_morgan",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 214,
    "name": "Asher Chen",
    "corpus_username": "asher_chen",
    "email": "asher_chen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "asher_chen",
    "role": "intern",
    "team_id": 16,
    "team_name": "Alpha circle",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 215,
    "name": "Carter Taylor",
    "corpus_username": "carter_taylor",
    "email": "carter_taylor@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "carter_taylor",
    "role": "intern",
    "team_id": 54,
    "team_name": "TechX",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 216,
    "name": "Julian Patel",
    "corpus_username": "julian_patel",
    "email": "julian_patel@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "julian_patel",
    "role": "intern",
    "team_id": 47,
    "team_name": "Team MTSKV",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 217,
    "name": "Grayson Brooks",
    "corpus_username": "grayson_brooks",
    "email": "grayson_brooks@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "grayson_brooks",
    "role": "intern",
    "team_id": 46,
    "team_name": "Team Infinity",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 218,
    "name": "Leo Hayes",
    "corpus_username": "leo_hayes",
    "email": "leo_hayes@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "leo_hayes",
    "role": "intern",
    "team_id": 53,
    "team_name": "Techies",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 219,
    "name": "Jayden Carter",
    "corpus_username": "jayden_carter",
    "email": "jayden_carter@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jayden_carter",
    "role": "intern",
    "team_id": 53,
    "team_name": "Techies",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 220,
    "name": "Gabriel Davis",
    "corpus_username": "gabriel_davis",
    "email": "gabriel_davis@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "gabriel_davis",
    "role": "intern",
    "team_id": 20,
    "team_name": "Eclipse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 221,
    "name": "Isaac Miller",
    "corpus_username": "isaac_miller",
    "email": "isaac_miller@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "isaac_miller",
    "role": "intern",
    "team_id": 41,
    "team_name": "SKY",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 222,
    "name": "Lincoln Wilson",
    "corpus_username": "lincoln_wilson",
    "email": "lincoln_wilson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "lincoln_wilson",
    "role": "intern",
    "team_id": 24,
    "team_name": "ForkD",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 223,
    "name": "Anthony Anderson",
    "corpus_username": "anthony_anderson",
    "email": "anthony_anderson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "anthony_anderson",
    "role": "intern",
    "team_id": 45,
    "team_name": "Team Hybrid",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 224,
    "name": "Hudson Thomas",
    "corpus_username": "hudson_thomas",
    "email": "hudson_thomas@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hudson_thomas",
    "role": "intern",
    "team_id": 57,
    "team_name": "ECHOVERSE",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 225,
    "name": "Dylan Jackson",
    "corpus_username": "dylan_jackson",
    "email": "dylan_jackson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "dylan_jackson",
    "role": "intern",
    "team_id": 58,
    "team_name": "SYNTRA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 226,
    "name": "Ezra White",
    "corpus_username": "ezra_white",
    "email": "ezra_white@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ezra_white",
    "role": "intern",
    "team_id": 59,
    "team_name": "Algnite elite",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 227,
    "name": "Thomas Harris",
    "corpus_username": "thomas_harris",
    "email": "thomas_harris@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "thomas_harris",
    "role": "intern",
    "team_id": 60,
    "team_name": "OUTLIER X",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 228,
    "name": "Charles Martin",
    "corpus_username": "charles_martin",
    "email": "charles_martin@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "charles_martin",
    "role": "intern",
    "team_id": 57,
    "team_name": "ECHOVERSE",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 229,
    "name": "Christopher Thompson",
    "corpus_username": "christopher_thompson",
    "email": "christopher_thompson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "christopher_thompson",
    "role": "intern",
    "team_id": 61,
    "team_name": "SANKALP",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 230,
    "name": "Jaxon Garcia",
    "corpus_username": "jaxon_garcia",
    "email": "jaxon_garcia@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jaxon_garcia",
    "role": "intern",
    "team_id": 60,
    "team_name": "OUTLIER X",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 231,
    "name": "Maverick Martinez",
    "corpus_username": "maverick_martinez",
    "email": "maverick_martinez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "maverick_martinez",
    "role": "intern",
    "team_id": 60,
    "team_name": "OUTLIER X",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 232,
    "name": "Josiah Robinson",
    "corpus_username": "josiah_robinson",
    "email": "josiah_robinson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "josiah_robinson",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 233,
    "name": "Isaiah Clark",
    "corpus_username": "isaiah_clark",
    "email": "isaiah_clark@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "isaiah_clark",
    "role": "intern",
    "team_id": 59,
    "team_name": "Algnite elite",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 234,
    "name": "Andrew Rodriguez",
    "corpus_username": "andrew_rodriguez",
    "email": "andrew_rodriguez@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "andrew_rodriguez",
    "role": "intern",
    "team_id": 61,
    "team_name": "SANKALP",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 235,
    "name": "Elias Lewis",
    "corpus_username": "elias_lewis",
    "email": "elias_lewis@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "elias_lewis",
    "role": "intern",
    "team_id": 58,
    "team_name": "SYNTRA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 236,
    "name": "Joshua Walker",
    "corpus_username": "joshua_walker",
    "email": "joshua_walker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "joshua_walker",
    "role": "intern",
    "team_id": 62,
    "team_name": "ALPHABET",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 237,
    "name": "Nathan Hall",
    "corpus_username": "nathan_hall",
    "email": "nathan_hall@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "nathan_hall",
    "role": "intern",
    "team_id": 63,
    "team_name": "Promptify",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 238,
    "name": "Caleb Allen",
    "corpus_username": "caleb_allen",
    "email": "caleb_allen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "caleb_allen",
    "role": "intern",
    "team_id": 61,
    "team_name": "SANKALP",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 239,
    "name": "Ryan Young",
    "corpus_username": "ryan_young",
    "email": "ryan_young@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ryan_young",
    "role": "intern",
    "team_id": 58,
    "team_name": "SYNTRA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 240,
    "name": "Adrian King",
    "corpus_username": "adrian_king",
    "email": "adrian_king@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "adrian_king",
    "role": "intern",
    "team_id": 64,
    "team_name": "Datapulse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 241,
    "name": "Miles Wright",
    "corpus_username": "miles_wright",
    "email": "miles_wright@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "miles_wright",
    "role": "intern",
    "team_id": 62,
    "team_name": "ALPHABET",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 242,
    "name": "Eli Scott",
    "corpus_username": "eli_scott",
    "email": "eli_scott@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "eli_scott",
    "role": "intern",
    "team_id": 65,
    "team_name": "DEEPTHINK",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 243,
    "name": "Nolan Torres",
    "corpus_username": "nolan_torres",
    "email": "nolan_torres@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "nolan_torres",
    "role": "intern",
    "team_id": 64,
    "team_name": "Datapulse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 244,
    "name": "Christian Nguyen",
    "corpus_username": "christian_nguyen",
    "email": "christian_nguyen@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "christian_nguyen",
    "role": "intern",
    "team_id": 64,
    "team_name": "Datapulse",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 245,
    "name": "Aaron Hill",
    "corpus_username": "aaron_hill",
    "email": "aaron_hill@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "aaron_hill",
    "role": "intern",
    "team_id": 62,
    "team_name": "ALPHABET",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 246,
    "name": "Cameron Flores",
    "corpus_username": "cameron_flores",
    "email": "cameron_flores@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "cameron_flores",
    "role": "intern",
    "team_id": 65,
    "team_name": "DEEPTHINK",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 247,
    "name": "Ezekiel Green",
    "corpus_username": "ezekiel_green",
    "email": "ezekiel_green@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "ezekiel_green",
    "role": "intern",
    "team_id": 59,
    "team_name": "Algnite elite",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 248,
    "name": "Colton Adams",
    "corpus_username": "colton_adams",
    "email": "colton_adams@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "colton_adams",
    "role": "intern",
    "team_id": 63,
    "team_name": "Promptify",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 249,
    "name": "Luca Nelson",
    "corpus_username": "luca_nelson",
    "email": "luca_nelson@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "luca_nelson",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 250,
    "name": "Landon Baker",
    "corpus_username": "landon_baker",
    "email": "landon_baker@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "landon_baker",
    "role": "intern",
    "team_id": 63,
    "team_name": "Promptify",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 251,
    "name": "Hunter Campbell",
    "corpus_username": "hunter_campbell",
    "email": "hunter_campbell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "hunter_campbell",
    "role": "intern",
    "team_id": 65,
    "team_name": "DEEPTHINK",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  },
  {
    "id": 252,
    "name": "Jonathan Mitchell",
    "corpus_username": "jonathan_mitchell",
    "email": "jonathan_mitchell@swecha.org",
    "institution_id": "1",
    "institution_name": "Swecha Academy",
    "gitlab_username": "jonathan_mitchell",
    "role": "intern",
    "team_id": 35,
    "team_name": "NEXORA",
    "batch_id": 1,
    "batch_name": "Summer Internship 2026"
  }
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDeterministicMockAudios(
  username: string
): InternAudioMetadata[] {
  const audios: InternAudioMetadata[] = [];
  const complianceRating = hashString(username) % 100;
  const now = new Date();

  // 4 time slots defined in IST:
  // S1: 09:00 - 09:30 (Late cutoff 10:00) -> UTC 03:30 - 04:00 (Late cutoff 04:30)
  // S2: 12:00 - 12:30 (Late cutoff 13:00) -> UTC 06:30 - 07:00 (Late cutoff 07:30)
  // S3: 14:00 - 14:30 (Late cutoff 15:00) -> UTC 08:30 - 09:00 (Late cutoff 09:30)
  // S4: 16:30 - 17:00 (Late cutoff 17:30) -> UTC 11:00 - 11:30 (Late cutoff 12:00)
  const slots = [
    { id: 'S1', good: '03:45:00.000Z', late: '04:15:00.000Z' },
    { id: 'S2', good: '06:45:00.000Z', late: '07:15:00.000Z' },
    { id: 'S3', good: '08:45:00.000Z', late: '09:15:00.000Z' },
    { id: 'S4', good: '11:15:00.000Z', late: '11:45:00.000Z' },
  ];

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];

    for (const slot of slots) {
      const randVal =
        (hashString(`${username}-${dateKey}-${slot.id}`) % 100) / 100.0;

      let goodProb = 0.75;
      let lateProb = 0.15;
      if (complianceRating >= 85) {
        goodProb = 0.95;
        lateProb = 0.04;
      } else if (complianceRating < 40 && complianceRating >= 10) {
        goodProb = 0.5;
        lateProb = 0.25;
      } else if (complianceRating < 10) {
        goodProb = 0.2;
        lateProb = 0.3;
      }

      if (randVal < goodProb) {
        audios.push({
          id: `${username}-${dateKey}-${slot.id}`,
          category: 'standup',
          tag: 'internship',
          labels: ['standup', 'internship'],
          uploadedAt: `${dateKey}T${slot.good}`,
          audioUrl:
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        });
      } else if (randVal < goodProb + lateProb) {
        audios.push({
          id: `${username}-${dateKey}-${slot.id}`,
          category: 'standup',
          tag: 'internship',
          labels: ['standup', 'internship'],
          uploadedAt: `${dateKey}T${slot.late}`,
          audioUrl:
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        });
      }
    }
  }

  // Include any local recordings uploaded during this session
  try {
    const localSaved = localStorage.getItem(`mock_uploads_${username}`);
    if (localSaved) {
      const records = JSON.parse(localSaved);
      if (Array.isArray(records)) {
        audios.unshift(...records);
      }
    }
  } catch {
    // Ignore localStorage read errors
  }

  return audios;
}

export function getMockStandupWorkspace(): StandupWorkspaceResponse {
  const teamRecords: TeamRecord[] = DEFAULT_MOCK_TEAMS.map((t) => {
    const members = DEFAULT_MOCK_MEMBERS.filter((m) => m.teamSlug === t.slug);
    return {
      id: t.id,
      name: t.name,
      batch_id: 1,
      batch_name: 'Summer Internship 2026',
      start_date: '2026-05-01',
      is_active: true,
      member_count: members.length,
    };
  });

  const userRecords: UserRecord[] = ALL_MOCK_USERS;

  return {
    data: {
      scope: 'mentor',
      dashboard: {
        teams: teamRecords.map((t) => {
          const tSlug = DEFAULT_MOCK_TEAMS.find((team) => team.id === t.id)?.slug || '';
          const members = DEFAULT_MOCK_MEMBERS.filter((m) => m.teamSlug === tSlug);
          return {
            id: t.id,
            name: t.name,
            batch_id: 1,
            batch_name: 'Summer Internship 2026',
            member_count: members.length,
            members: members.map((m, idx) => ({
              id: 100 + idx,
              name: m.name,
              corpus_username: m.internId,
              gitlab_username: m.internId,
            })),
          };
        }),
        summary: {
          team_count: teamRecords.length,
          member_count: DEFAULT_MOCK_MEMBERS.length,
        },
      },
      analytics: {
        scope: 'mentor',
        team_count: teamRecords.length,
        batch_breakdown: [
          { batch_name: 'Summer Internship 2026', team_count: teamRecords.length },
        ],
      },
      team: teamRecords[0] || null,
      teams: teamRecords,
      users: userRecords,
    },
  };
}

export function getMockAuthUser(identifier?: string): MockUserSession {
  const idStr = (identifier || '').trim().toLowerCase();
  
  if (idStr) {
    // Look up in ALL_MOCK_USERS by corpus_username or phone
    const found = ALL_MOCK_USERS.find(
      (u) => u.corpus_username.toLowerCase() === idStr || (u as any).phone === idStr
    );
    if (found) {
      return {
        id: found.id,
        corpus_username: found.corpus_username,
        name: found.name,
        role: found.role || 'mentor',
        phone: idStr.length === 10 ? idStr : '9876543210',
        email: found.email || `${found.corpus_username}@swecha.org`,
        institution_id: found.institution_id || '1',
        institution_name: found.institution_name || 'Swecha Academy',
        gitlab_username: found.gitlab_username || found.corpus_username,
        team_id: found.team_id || 1,
        team_name: found.team_name || 'Dev 3',
        batch_id: 1,
        batch_name: 'Summer Internship 2026',
      };
    }
  }

  // Default mentor account with access to all 65 teams
  return {
    id: 1,
    corpus_username: 'lead_mentor',
    name: 'Lead Mentor',
    role: 'mentor',
    phone: idStr || '9876543210',
    email: 'mentor@swecha.org',
    institution_id: '1',
    institution_name: 'Swecha Learning Center',
    gitlab_username: 'lead_mentor',
    team_id: 1,
    team_name: 'Dev 3',
    batch_id: 1,
    batch_name: 'Summer Internship 2026',
  };
}

export function searchMockInterns(query: string): InternSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_MOCK_USERS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.corpus_username.toLowerCase().includes(q)
  ).map((m) => ({
    id: m.corpus_username,
    name: m.name,
    username: m.corpus_username,
    email: m.email || `${m.corpus_username}@swecha.org`,
  }));
}

export function getMockBatches(): BatchRecord[] {
  return [
    {
      id: 1,
      name: 'Summer Internship 2026',
      start_date: '2026-05-01',
      end_date: '2026-07-31',
      team_count: DEFAULT_MOCK_TEAMS.length,
      member_count: DEFAULT_MOCK_MEMBERS.length,
    },
  ];
}

export function getMockRosterTeams(activeOnly = false): TeamRecord[] {
  return DEFAULT_MOCK_TEAMS.map((t) => {
    const members = DEFAULT_MOCK_MEMBERS.filter((m) => m.teamSlug === t.slug);
    return {
      id: t.id,
      name: t.name,
      batch_id: 1,
      batch_name: 'Summer Internship 2026',
      start_date: '2026-05-01',
      is_active: true,
      member_count: members.length,
    };
  });
}

export function getMockTeamDetail(teamId: number): TeamDetailRecord {
  const team = DEFAULT_MOCK_TEAMS.find((t) => t.id === teamId) || DEFAULT_MOCK_TEAMS[0];
  const members = ALL_MOCK_USERS.filter((u) => u.team_id === team.id);
  return {
    id: team.id,
    name: team.name,
    batch_id: 1,
    batch_name: 'Summer Internship 2026',
    start_date: '2026-05-01',
    end_date: '',
    is_active: true,
    member_count: members.length,
    users: members,
    history: [],
  };
}

export function getMockLeaderboardTeams(): Team[] {
  return DEFAULT_MOCK_TEAMS.map((t) => {
    const members = DEFAULT_MOCK_MEMBERS.filter((m) => m.teamSlug === t.slug);
    return {
      team_name: t.name,
      project_name: t.slug,
      members: members.map((m) => ({ username: m.internId })),
      scope: 'batch',
    };
  });
}

export function getMockLeaderboardResults(teams?: Team[]): TeamResult[] {
  const targetTeams = teams && teams.length > 0 ? teams : getMockLeaderboardTeams();
  return targetTeams.map((t, idx) => {
    const memberRows = t.members.map((m) => {
      const h = hashString(m.username);
      const commits = 20 + (h % 50);
      const morning = Math.floor(commits * 0.6);
      const afternoon = commits - morning;
      const mrCreated = 2 + (h % 8);
      const mrMerged = Math.max(1, mrCreated - 1);
      const issues = 3 + (h % 6);
      const score = Math.round(commits * 1.5 + mrMerged * 5 + issues * 2);
      return {
        username: m.username,
        status: 'active',
        total_commits: commits,
        morning_commits: morning,
        afternoon_commits: afternoon,
        mr_created: mrCreated,
        mr_merged: mrMerged,
        mr_open: 1,
        mr_closed: 0,
        mr_assigned: mrCreated,
        issues_raised: issues,
        issues_closed: issues - 1,
        issues_assigned: issues,
        groups: 1,
        score,
      };
    });

    const totals = memberRows.reduce(
      (acc, cur) => ({
        total_commits: acc.total_commits + cur.total_commits,
        morning_commits: acc.morning_commits + cur.morning_commits,
        afternoon_commits: acc.afternoon_commits + cur.afternoon_commits,
        mr_created: acc.mr_created + cur.mr_created,
        mr_merged: acc.mr_merged + cur.mr_merged,
        mr_open: acc.mr_open + cur.mr_open,
        mr_closed: acc.mr_closed + cur.mr_closed,
        mr_assigned: acc.mr_assigned + cur.mr_assigned,
        issues_raised: acc.issues_raised + cur.issues_raised,
        issues_closed: acc.issues_closed + cur.issues_closed,
        issues_assigned: acc.issues_assigned + cur.issues_assigned,
        team_score: acc.team_score + cur.score,
      }),
      {
        total_commits: 0,
        morning_commits: 0,
        afternoon_commits: 0,
        mr_created: 0,
        mr_merged: 0,
        mr_open: 0,
        mr_closed: 0,
        mr_assigned: 0,
        issues_raised: 0,
        issues_closed: 0,
        issues_assigned: 0,
        team_score: 0,
      }
    );

    return {
      team_name: t.team_name,
      project_name: t.project_name,
      members: memberRows,
      totals,
    };
  }).sort((a, b) => b.totals.team_score - a.totals.team_score);
}

export function getMockWeeklyPerformance(params: {
  start_date: string;
  end_date: string;
  username?: string;
}): WeeklyActivity {
  const u = params.username || 'alex_rivera';
  const found = ALL_MOCK_USERS.find((usr) => usr.corpus_username === u);
  const internName = found ? found.name : 'Alex Rivera';

  const daily_data: Record<string, any> = {};
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];
    daily_data[dateKey] = {
      gitlab: {
        mrs: 1 + (i % 2),
        issues: 1,
        commits: 3 + (i % 4),
        time_spent_seconds: 14400,
        mrs_open_time: 120,
        mrs_merged_time: 300,
        issues_open_time: 60,
        issues_closed_time: 180,
        active_hours: [9, 10, 11, 14, 15, 16],
        activity_timestamps: [`${dateKey}T09:30:00Z`, `${dateKey}T14:15:00Z`],
        events_by_hour: {},
      },
      corpus: { audio_urls: [] },
    };
  }

  return {
    intern_name: internName,
    gitlab_username: u,
    corpus_uid: u,
    daily_data,
    total_weekly_time: 100800,
    audio_fetched: true,
    commits: [
      {
        project_name: 'activity-tracker',
        message: 'feat: implement daily standup updates and tests',
        date: new Date().toISOString().split('T')[0],
        time: '10:30 AM',
        slot: 'S1',
        sha: 'abc1234',
        author_name: internName,
      },
    ],
  };
}

export function getMockComplianceProfile(username: string): UserProfileData {
  const found = ALL_MOCK_USERS.find((u) => u.corpus_username === username);
  const name = found ? found.name : 'Alex Rivera';

  return {
    status: 'success',
    username,
    data: {
      user: {
        id: found ? found.id : 1,
        username,
        name,
        email: `${username}@swecha.org`,
      },
      projects: {
        personal: [],
        contributed: [
          {
            id: 1,
            name: 'activity-tracker',
            name_with_namespace: 'swecha/activity-tracker',
            web_url: 'https://code.swecha.org/swecha/activity-tracker',
          },
        ],
        all: [],
      },
      commits: [
        {
          project_name: 'activity-tracker',
          message: 'feat: add intern standup logs and verification',
          date: new Date().toISOString().split('T')[0],
          time: '11:00 AM',
          slot: 'S1',
          sha: 'b8192ca',
          author_name: name,
        },
      ],
      commit_stats: {
        total: 42,
        morning_commits: 26,
        afternoon_commits: 16,
        morning_pct: 62,
        afternoon_pct: 38,
      },
      groups: [],
      mrs: [
        {
          title: 'Implement standup audio pipeline',
          description: 'Adds recorder and verification slots',
          project_id: 1,
          iid: 12,
          state: 'merged',
          created_at: new Date().toISOString(),
          merged_at: new Date().toISOString(),
          role: 'Author',
          upvotes: 2,
        },
      ],
      mr_stats: {
        total: 5,
        merged: 4,
        opened: 1,
        closed: 0,
      },
      mr_quality: {
        good: 4,
        needs_improvement: 1,
      },
      issues: [
        {
          title: 'Verify standup slots on dashboard',
          state: 'closed',
          created_at: new Date().toISOString(),
          role: 'Assignee',
          labels: ['standup', 'qa'],
        },
      ],
      issue_stats: {
        total: 4,
        closed: 3,
      },
      issue_quality: {
        good: 3,
      },
      profile_readme: {
        exists: true,
      },
    },
  };
}

export function getMockUserCommits(username: string): UserCommitsResponse {
  const found = ALL_MOCK_USERS.find((u) => u.corpus_username === username);
  const name = found ? found.name : username;
  return {
    username,
    status: 'success',
    error: null,
    commits: [
      {
        project_name: 'activity-tracker',
        message: 'feat: add audio playback and standup validation',
        date: new Date().toISOString().split('T')[0],
        time: '10:15 AM',
        slot: 'S1',
        sha: '9f81a7b',
        author_name: name,
      },
    ],
    commit_stats: {
      total: 35,
      morning_commits: 22,
      afternoon_commits: 13,
      morning_pct: 63,
      afternoon_pct: 37,
    },
  };
}

export function createCorpusMockFetcher(realBaseUrl?: string) {
  return async (url: string, init?: RequestInit) => {
    // If real backend is accessible, try it first
    if (realBaseUrl && !url.includes('soundhelix')) {
      try {
        const res = await fetch(url, init);
        if (res.ok) return res;
      } catch {
        // Backend offline, fallback to mock response
      }
    }

    if (url.includes('/api/v1/categories')) {
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'c81f5d73-9090-453e-bb08-c2f46453e0bd',
            name: 'standup',
            title: 'Standup',
            approved: true,
          },
          {
            id: '4dd053f4-6323-43d4-87a3-ce1816bd9459',
            name: 'internship',
            title: 'Internship',
            approved: true,
          },
        ],
      };
    }

    if (url.includes('/api/v1/users/search')) {
      const parsed = new URL(url, 'http://localhost');
      const q = parsed.searchParams.get('query') || '';
      return {
        ok: true,
        status: 200,
        json: async () => searchMockInterns(q),
      };
    }

    if (url.includes('/contributions/audio')) {
      const match = url.match(/\/users\/([^/]+)\/contributions\/audio/);
      const userId = match ? decodeURIComponent(match[1]) : 'user';
      return {
        ok: true,
        status: 200,
        json: async () => getDeterministicMockAudios(userId),
      };
    }

    if (url.includes('/record-url')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        }),
      };
    }

    if (url.includes('/api/v1/users/')) {
      const match = url.match(/\/users\/([^/?]+)/);
      const userId = match ? decodeURIComponent(match[1]) : 'user';
      const found = ALL_MOCK_USERS.find((m) => m.corpus_username === userId);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: userId,
          username: userId,
          name: found ? found.name : userId,
          email: `${userId}@swecha.org`,
          phone: '9876543210',
          institution_id: '1',
          college_name: 'Swecha Academy',
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  };
}
