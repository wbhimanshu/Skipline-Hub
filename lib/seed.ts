import type { DatabaseSync } from "node:sqlite";
import { hashPasswordSync } from "./password";
import { todayKey } from "./utils";

type OrgSeed = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  services: string;
  emergency: boolean;
  ownerId: string;
  status?: "approved" | "pending";
  counters: string[];
  prefix: string;
};

type UserSeed = {
  id: string;
  name: string;
  email: string;
  role: "user" | "org" | "admin";
  orgId?: string;
  password: string;
};

const ORGS: OrgSeed[] = [
  {
    id: "org_sunrise",
    name: "Sunrise Multispeciality Hospital",
    slug: "sunrise-multispeciality-hospital",
    category: "hospital",
    description:
      "Multi-speciality hospital with 24×7 emergency care, outpatient departments and digital queue management. Emergency triage is always assessed by qualified medical staff.",
    address: "Zone-II, MP Nagar",
    city: "Bhopal",
    pincode: "462011",
    lat: 23.2335,
    lng: 77.4343,
    phone: "+91 755 4100 2200",
    email: "care@sunrisehospital.example",
    openTime: "08:00",
    closeTime: "22:00",
    services: "General Medicine, Orthopaedics, Cardiology, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_sunrise",
    counters: ["OPD Counter 1", "OPD Counter 2", "OPD Counter 3"],
    prefix: "S",
  },
  {
    id: "org_clearview",
    name: "ClearView Diagnostics",
    slug: "clearview-diagnostics",
    category: "diagnostic",
    description:
      "NABL-accredited pathology and radiology centre offering blood tests, scans and preventive health packages with slot-based check-in.",
    address: "E-7, Arera Colony",
    city: "Bhopal",
    pincode: "462016",
    lat: 23.2115,
    lng: 77.4310,
    phone: "+91 755 4100 3311",
    email: "book@clearviewdx.example",
    openTime: "07:30",
    closeTime: "20:00",
    services: "Pathology, Radiology, Health Checkups, Home Collection",
    emergency: false,
    ownerId: "usr_owner_clearview",
    counters: ["Sample Collection A", "Sample Collection B"],
    prefix: "C",
  },
  {
    id: "org_sahyadri_bank",
    name: "Sahyadri Community Bank",
    slug: "sahyadri-community-bank",
    category: "bank",
    description:
      "Neighbourhood bank branch for deposits, loans, KYC updates and account services. Walk-in queues and prior appointments supported.",
    address: "New Market, TT Nagar",
    city: "Bhopal",
    pincode: "462003",
    lat: 23.2330,
    lng: 77.4010,
    phone: "+91 755 4100 4422",
    email: "branch.camp@sahyadribank.example",
    openTime: "10:00",
    closeTime: "16:00",
    services: "Account Services, Loans, Deposits, KYC",
    emergency: false,
    ownerId: "usr_owner_bank",
    counters: ["Teller 1", "Teller 2", "Relationship Desk"],
    prefix: "B",
  },
  {
    id: "org_district",
    name: "District Service Centre",
    slug: "district-service-centre",
    category: "government",
    description:
      "Single-window citizen service centre for certificates, licences, land records and public grievances.",
    address: "Collectorate Campus, Arera Colony",
    city: "Bhopal",
    pincode: "462003",
    lat: 23.2140,
    lng: 77.4250,
    phone: "+91 755 4100 5500",
    email: "helpdesk@districtservices.example",
    openTime: "09:30",
    closeTime: "17:30",
    services: "Certificates, Land Records, Licences, Grievances",
    emergency: false,
    ownerId: "usr_owner_district",
    counters: ["Window 1", "Window 2", "Window 3"],
    prefix: "D",
  },
  {
    id: "org_arogya",
    name: "Arogya Family Clinic",
    slug: "arogya-family-clinic",
    category: "clinic",
    description:
      "Family medicine clinic for general consultations, vaccination and child care. Friendly, low-wait appointments.",
    address: "Kolar Road, Chunabhatti",
    city: "Bhopal",
    pincode: "462016",
    lat: 23.1900,
    lng: 77.4300,
    phone: "+91 755 4100 6611",
    email: "frontdesk@arogyaclinic.example",
    openTime: "09:00",
    closeTime: "20:00",
    services: "General Consultation, Vaccination, Child Care",
    emergency: false,
    ownerId: "usr_owner_arogya",
    counters: ["Consulting Room 1", "Consulting Room 2"],
    prefix: "A",
  },
  {
    id: "org_metro",
    name: "Metro Citizen Service Hub",
    slug: "metro-citizen-service-hub",
    category: "service",
    description:
      "Everyday citizen services — bill payments, forms, printing and documentation — with transparent token queues.",
    address: "Hoshangabad Road, Misrod",
    city: "Bhopal",
    pincode: "462026",
    lat: 23.1550,
    lng: 77.4600,
    phone: "+91 755 4100 7722",
    email: "hello@metrocitizen.example",
    openTime: "09:00",
    closeTime: "19:00",
    services: "Bill Payments, Form Filling, Printing, Documentation",
    emergency: false,
    ownerId: "usr_owner_metro",
    counters: ["Service Desk 1", "Service Desk 2"],
    prefix: "M",
  },
  {
    id: "org_novacare",
    name: "NovaCare Polyclinic",
    slug: "novacare-polyclinic",
    category: "clinic",
    description:
      "New polyclinic in Kothrud applying to join Skipline Hub for appointment and walk-in queue management.",
    address: "Ayodhya Bypass, Govindpura",
    city: "Bhopal",
    pincode: "462023",
    lat: 23.2700,
    lng: 77.4600,
    phone: "+91 755 4100 8833",
    email: "apply@novacare.example",
    openTime: "09:00",
    closeTime: "18:00",
    services: "General Medicine, Physiotherapy",
    emergency: false,
    ownerId: "usr_owner_novacare",
    status: "pending",
    counters: ["Consulting Room 1"],
    prefix: "N",
  },
];

const REAL_CENTRES: OrgSeed[] = [
  {
    id: "org_aiims_bhopal",
    name: "AIIMS Bhopal",
    slug: "aiims-bhopal",
    category: "hospital",
    description:
      "All India Institute of Medical Sciences (AIIMS) Bhopal — a premier government tertiary-care and teaching hospital offering super-speciality OPDs, emergency and trauma care.",
    address: "Saket Nagar, AIIMS Campus",
    city: "Bhopal",
    pincode: "462020",
    lat: 23.2098361,
    lng: 77.4560275,
    phone: "+91 755 2672 222",
    email: "info@aiimsbhopal.example",
    openTime: "08:00",
    closeTime: "20:00",
    services: "General Medicine, Cardiology, Neurology, Oncology, Emergency Care, Trauma",
    emergency: true,
    ownerId: "usr_owner_aiims",
    counters: ["OPD Counter 1", "OPD Counter 2", "OPD Counter 3", "Emergency Desk"],
    prefix: "AB",
  },
  {
    id: "org_hamidia",
    name: "Hamidia Hospital",
    slug: "hamidia-hospital",
    category: "hospital",
    description:
      "Government teaching hospital attached to Gandhi Medical College, providing general surgery, orthopaedics, paediatrics, obstetrics and 24×7 emergency services.",
    address: "Gandhi Medical College Campus, Royal Market",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2592198,
    lng: 77.3921163,
    phone: "+91 755 2540 222",
    email: "info@hamidiahospital.example",
    openTime: "08:00",
    closeTime: "22:00",
    services: "General Surgery, Orthopaedics, Paediatrics, Obstetrics, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_hamidia",
    counters: ["OPD Counter 1", "OPD Counter 2", "Emergency Desk"],
    prefix: "H",
  },
  {
    id: "org_bansal",
    name: "Bansal Hospital",
    slug: "bansal-hospital",
    category: "hospital",
    description:
      "Multi-speciality private hospital in Shahpura with advanced cardiac, neuro and orthopaedic care plus a 24×7 emergency department.",
    address: "C-Sector, Shahpura",
    city: "Bhopal",
    pincode: "462039",
    lat: 23.1795,
    lng: 77.433,
    phone: "+91 755 4086 000",
    email: "care@bansalhospital.example",
    openTime: "00:00",
    closeTime: "23:59",
    services: "Cardiology, Cardiac Surgery, Neurology, Orthopaedics, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_bansal",
    counters: ["OPD Counter 1", "OPD Counter 2", "Emergency Desk"],
    prefix: "BH",
  },
  {
    id: "org_chirayu",
    name: "Chirayu Medical College & Hospital",
    slug: "chirayu-medical-college-hospital",
    category: "hospital",
    description:
      "Teaching hospital on the Bhopal–Indore Road offering general medicine, paediatrics, orthopaedics and emergency care to the wider Bhopal region.",
    address: "Bhainsakhedi, Bhopal–Indore Road",
    city: "Bhopal",
    pincode: "462033",
    lat: 23.09,
    lng: 77.52,
    phone: "+91 755 6733 000",
    email: "info@chirayuhospital.example",
    openTime: "08:00",
    closeTime: "20:00",
    services: "General Medicine, Paediatrics, Orthopaedics, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_chirayu",
    counters: ["OPD Counter 1", "OPD Counter 2", "Emergency Desk"],
    prefix: "CM",
  },
  {
    id: "org_bmhrc",
    name: "Bhopal Memorial Hospital & Research Centre",
    slug: "bhopal-memorial-hospital-research-centre",
    category: "hospital",
    description:
      "BMHRC is a government research hospital in Karond offering cardiology, pulmonology, nephrology, oncology and emergency care.",
    address: "Karond, Raisen Road",
    city: "Bhopal",
    pincode: "462038",
    lat: 23.3003492,
    lng: 77.4166846,
    phone: "+91 755 2742 220",
    email: "info@bmhrc.example",
    openTime: "08:00",
    closeTime: "20:00",
    services: "Cardiology, Pulmonology, Nephrology, Oncology, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_bmhrc",
    counters: ["OPD Counter 1", "OPD Counter 2", "Emergency Desk"],
    prefix: "BM",
  },
  {
    id: "org_sultania",
    name: "Sultania Zanana Hospital",
    slug: "sultania-zanana-hospital",
    category: "hospital",
    description:
      "Government women's hospital near Hamidia Hospital specialising in obstetrics, gynaecology, paediatrics and neonatal care.",
    address: "Sultania Road, Near Hamidia Hospital",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2564415,
    lng: 77.4094609,
    phone: "+91 755 2540 222",
    email: "info@sultaniahospital.example",
    openTime: "08:00",
    closeTime: "20:00",
    services: "Obstetrics, Gynaecology, Paediatrics, Neonatal Care",
    emergency: true,
    ownerId: "usr_owner_sultania",
    counters: ["OPD Counter 1", "OPD Counter 2"],
    prefix: "SZ",
  },
  {
    id: "org_narmada",
    name: "Narmada Hospital",
    slug: "narmada-hospital",
    category: "hospital",
    description:
      "Neighbourhood hospital on Hoshangabad Road offering general medicine, orthopaedics, maternity and emergency care.",
    address: "Hoshangabad Road, Misrod",
    city: "Bhopal",
    pincode: "462026",
    lat: 23.17,
    lng: 77.45,
    phone: "+91 755 4000 000",
    email: "care@narmadahospital.example",
    openTime: "08:00",
    closeTime: "22:00",
    services: "General Medicine, Orthopaedics, Maternity, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_narmada",
    counters: ["OPD Counter 1", "OPD Counter 2"],
    prefix: "NH",
  },
  {
    id: "org_aurobindo",
    name: "Aurobindo Hospital",
    slug: "aurobindo-hospital-bhopal",
    category: "hospital",
    description:
      "Multi-speciality hospital in Bawadia Kalan providing cardiology, orthopaedics, neurology and emergency care.",
    address: "Bawadia Kalan, Hoshangabad Road",
    city: "Bhopal",
    pincode: "462039",
    lat: 23.162,
    lng: 77.436,
    phone: "+91 755 4000 111",
    email: "care@aurobindohospital.example",
    openTime: "08:00",
    closeTime: "22:00",
    services: "Cardiology, Orthopaedics, Neurology, Emergency Care",
    emergency: true,
    ownerId: "usr_owner_aurobindo",
    counters: ["OPD Counter 1", "OPD Counter 2", "Emergency Desk"],
    prefix: "AU",
  },
  {
    id: "org_bmc",
    name: "Bhopal Municipal Corporation",
    slug: "bhopal-municipal-corporation",
    category: "government",
    description:
      "Civic body office for property tax, birth and death certificates, trade licences and public grievances.",
    address: "Link Road 2, Ishwar Nagar",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2243225,
    lng: 77.4028462,
    phone: "+91 755 2540 300",
    email: "info@bmcbhopal.example",
    openTime: "10:00",
    closeTime: "17:00",
    services: "Property Tax, Birth & Death Certificates, Trade Licences, Grievances",
    emergency: false,
    ownerId: "usr_owner_bmc",
    counters: ["Window 1", "Window 2", "Window 3"],
    prefix: "BMC",
  },
  {
    id: "org_rto",
    name: "Regional Transport Office (RTO) Bhopal",
    slug: "rto-bhopal",
    category: "government",
    description:
      "Regional Transport Office for driving licences, vehicle registration, permits and fitness certification.",
    address: "Arera Colony, Near MD3115",
    city: "Bhopal",
    pincode: "462016",
    lat: 23.2237266,
    lng: 77.4354908,
    phone: "+91 755 2460 000",
    email: "rto@bhopal.example",
    openTime: "10:00",
    closeTime: "17:00",
    services: "Driving Licence, Vehicle Registration, Permits, Fitness",
    emergency: false,
    ownerId: "usr_owner_rto",
    counters: ["Counter 1", "Counter 2", "Counter 3"],
    prefix: "RTO",
  },
  {
    id: "org_district_court",
    name: "District Court Bhopal",
    slug: "district-court-bhopal",
    category: "government",
    description:
      "District and sessions court complex for civil, criminal and certified-copy services.",
    address: "Jail Road, Arera Hills",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.240221,
    lng: 77.4237608,
    phone: "+91 755 2550 000",
    email: "court@bhopal.example",
    openTime: "10:00",
    closeTime: "17:00",
    services: "Civil Cases, Criminal Cases, Notary, Certified Copies",
    emergency: false,
    ownerId: "usr_owner_court",
    counters: ["Counter 1", "Counter 2"],
    prefix: "DC",
  },
  {
    id: "org_police_hq",
    name: "Bhopal Police Headquarters",
    slug: "bhopal-police-headquarters",
    category: "government",
    description:
      "District police headquarters for complaints, verification and public assistance.",
    address: "Police Radio Colony, Jahangirabad",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2268792,
    lng: 77.38671,
    phone: "+91 755 2444 100",
    email: "police@bhopal.example",
    openTime: "00:00",
    closeTime: "23:59",
    services: "FIR, Verification, Passport Verification, Complaints",
    emergency: false,
    ownerId: "usr_owner_police",
    counters: ["Help Desk"],
    prefix: "PH",
  },
  {
    id: "org_bda",
    name: "Bhopal Development Authority (BDA)",
    slug: "bhopal-development-authority",
    category: "government",
    description:
      "Urban development authority for plot allotment, building permission and land records.",
    address: "BDA Colony, Shivaji Nagar",
    city: "Bhopal",
    pincode: "462016",
    lat: 23.2774176,
    lng: 77.3940787,
    phone: "+91 755 2555 000",
    email: "bda@bhopal.example",
    openTime: "10:00",
    closeTime: "17:00",
    services: "Plot Allotment, Building Permission, Land Records",
    emergency: false,
    ownerId: "usr_owner_bda",
    counters: ["Counter 1", "Counter 2"],
    prefix: "BDA",
  },
  {
    id: "org_sbi",
    name: "State Bank of India - Bhopal Main Branch",
    slug: "state-bank-of-india-bhopal",
    category: "bank",
    description:
      "Public sector bank branch for accounts, deposits, loans, pension and KYC services.",
    address: "80 Feet Road, Bhopal",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2587673,
    lng: 77.431715,
    phone: "+91 755 2570 000",
    email: "sbi@bhopal.example",
    openTime: "10:00",
    closeTime: "16:00",
    services: "Account Services, Loans, Deposits, KYC, Pension",
    emergency: false,
    ownerId: "usr_owner_sbi",
    counters: ["Teller 1", "Teller 2", "Relationship Desk"],
    prefix: "SBI",
  },
  {
    id: "org_pnb",
    name: "Punjab National Bank - Arera Hills",
    slug: "punjab-national-bank-arera-hills",
    category: "bank",
    description:
      "Public sector bank branch for accounts, deposits, loans and KYC updates.",
    address: "Jail Road, Arera Hills",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2423962,
    lng: 77.4233902,
    phone: "+91 755 2571 000",
    email: "pnb@bhopal.example",
    openTime: "10:00",
    closeTime: "16:00",
    services: "Account Services, Loans, Deposits, KYC",
    emergency: false,
    ownerId: "usr_owner_pnb",
    counters: ["Teller 1", "Teller 2"],
    prefix: "PNB",
  },
  {
    id: "org_boi",
    name: "Bank of India - Police Radio Colony",
    slug: "bank-of-india-bhopal",
    category: "bank",
    description:
      "Public sector bank branch for savings, deposits, loans and KYC services.",
    address: "Subhash Yadav Marg, Police Radio Colony",
    city: "Bhopal",
    pincode: "462001",
    lat: 23.2345984,
    lng: 77.4011924,
    phone: "+91 755 2572 000",
    email: "boi@bhopal.example",
    openTime: "10:00",
    closeTime: "16:00",
    services: "Account Services, Loans, Deposits, KYC",
    emergency: false,
    ownerId: "usr_owner_boi",
    counters: ["Teller 1", "Teller 2"],
    prefix: "BOI",
  },
  {
    id: "org_ubi",
    name: "Union Bank of India - TT Nagar",
    slug: "union-bank-of-india-tt-nagar",
    category: "bank",
    description:
      "Public sector bank branch for accounts, deposits, loans and KYC updates.",
    address: "Bhadbhada Road, TT Nagar",
    city: "Bhopal",
    pincode: "462003",
    lat: 23.2360212,
    lng: 77.399482,
    phone: "+91 755 2573 000",
    email: "ubi@bhopal.example",
    openTime: "10:00",
    closeTime: "16:00",
    services: "Account Services, Loans, Deposits, KYC",
    emergency: false,
    ownerId: "usr_owner_ubi",
    counters: ["Teller 1", "Teller 2"],
    prefix: "UBI",
  },
  {
    id: "org_post_office",
    name: "Nehru Nagar Post Office",
    slug: "nehru-nagar-post-office-bhopal",
    category: "service",
    description:
      "India Post branch for speed post, registered post, savings schemes and money orders.",
    address: "Gomti Colony, Nehru Nagar",
    city: "Bhopal",
    pincode: "462003",
    lat: 23.2129562,
    lng: 77.3927618,
    phone: "+91 755 2574 000",
    email: "post@bhopal.example",
    openTime: "09:00",
    closeTime: "17:00",
    services: "Speed Post, Registered Post, Savings, Money Order",
    emergency: false,
    ownerId: "usr_owner_post",
    counters: ["Counter 1", "Counter 2"],
    prefix: "PO",
  },
];

const OWNER_NAMES: Record<string, string> = {
  usr_owner_sunrise: "Dr. Kavita Deshmukh",
  usr_owner_clearview: "Nikhil Joshi",
  usr_owner_bank: "Sneha Kulkarni",
  usr_owner_district: "Ravindra Patil",
  usr_owner_arogya: "Dr. Farah Khan",
  usr_owner_metro: "Omkar Shinde",
  usr_owner_novacare: "Dr. Pooja Mehta",
  usr_owner_aiims: "Dr. AIIMS Bhopal",
  usr_owner_hamidia: "Hamidia Hospital",
  usr_owner_bansal: "Bansal Hospital",
  usr_owner_chirayu: "Chirayu Hospital",
  usr_owner_bmhrc: "BMHRC",
  usr_owner_sultania: "Sultania Hospital",
  usr_owner_narmada: "Narmada Hospital",
  usr_owner_aurobindo: "Aurobindo Hospital",
  usr_owner_bmc: "Bhopal Municipal Corporation",
  usr_owner_rto: "RTO Bhopal",
  usr_owner_court: "District Court Bhopal",
  usr_owner_police: "Bhopal Police",
  usr_owner_bda: "Bhopal Development Authority",
  usr_owner_sbi: "State Bank of India",
  usr_owner_pnb: "Punjab National Bank",
  usr_owner_boi: "Bank of India",
  usr_owner_ubi: "Union Bank of India",
  usr_owner_post: "India Post",
};

const CUSTOMERS: UserSeed[] = [
  { id: "usr_demo", name: "Aarav Sharma", email: "user@example.com", role: "user", password: "User@12345" },
  { id: "usr_priya", name: "Priya Nair", email: "priya@example.com", role: "user", password: "User@12345" },
  { id: "usr_rohan", name: "Rohan Mehta", email: "rohan@example.com", role: "user", password: "User@12345" },
  { id: "usr_meera", name: "Meera Iyer", email: "meera@example.com", role: "user", password: "User@12345" },
  { id: "usr_kabir", name: "Kabir Singh", email: "kabir@example.com", role: "user", password: "User@12345" },
  { id: "usr_ananya", name: "Ananya Rao", email: "ananya@example.com", role: "user", password: "User@12345" },
  { id: "usr_vikram", name: "Vikram Kale", email: "vikram@example.com", role: "user", password: "User@12345" },
  { id: "usr_isha", name: "Isha Kulkarni", email: "isha@example.com", role: "user", password: "User@12345" },
  { id: "usr_neha", name: "Neha Bhosale", email: "neha@example.com", role: "user", password: "User@12345" },
];

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedInitialData(db: DatabaseSync) {
  const settingsDefaults: Array<[string, string]> = [
    ["cancellation_threshold_count", "3"],
    ["cancellation_window_days", "30"],
    ["restriction_days", "7"],
    ["prediction_history_days", "45"],
    ["prediction_min_samples", "8"],
    ["demo_data", "true"],
  ];
  const settingStmt = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
  );
  for (const [key, value] of settingsDefaults) settingStmt.run(key, value);

  const userCount = (
    db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }
  ).c;
  if (userCount > 0) return;

  const demoEnabled = (process.env.SEED_DEMO_DATA ?? "true") !== "false";
  const now = new Date();
  const nowIso = now.toISOString();

  const adminId = "usr_admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@skiplinehub.app").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.ADMIN_NAME || "Skipline Administrator";

  const insertUser = db.prepare(
    `INSERT INTO users
      (id, name, email, password_hash, role, org_id, phone, email_verified_at, language, large_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en', 0, ?)`,
  );
  const insertOrg = db.prepare(
    `INSERT INTO organizations
      (id, name, slug, category, description, address, city, state, pincode, lat, lng, phone, email,
       open_time, close_time, slot_minutes, status, owner_user_id, priority_policy, cancellation_policy,
       emergency_enabled, services, created_at, approved_at, status_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Madhya Pradesh', ?, ?, ?, ?, ?, ?, ?, 15, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertCounter = db.prepare(
    "INSERT INTO counters (id, org_id, name, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
  );
  const insertTicket = db.prepare(
    `INSERT INTO tickets
      (id, org_id, user_id, token_no, kind, status, priority, priority_reason, scheduled_for,
       counter_id, checked_in_at, called_at, completed_at, cancelled_at, cancel_reason, cancel_category,
       service_seconds, queue_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertNotification = db.prepare(
    "INSERT INTO notifications (id, user_id, type, title, body, ticket_id, read_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertAudit = db.prepare(
    "INSERT INTO audit_logs (id, actor_id, actor_role, org_id, action, entity, entity_id, details, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );

  db.exec("BEGIN IMMEDIATE");
  try {
    insertUser.run(
      adminId,
      adminName,
      adminEmail,
      hashPasswordSync(adminPassword),
      "admin",
      null,
      "",
      nowIso,
      nowIso,
    );

    if (!demoEnabled) {
      db.exec("COMMIT");
      return;
    }

    const orgStmt = db.prepare("SELECT COUNT(*) as c FROM organizations");
    if ((orgStmt.get() as { c: number }).c === 0) {
      for (const org of ORGS) {
        const ownerEmail = `${org.slug}@skiplinehub.app`;
        const pending = org.status === "pending";
        insertOrg.run(
          org.id,
          org.name,
          org.slug,
          org.category,
          org.description,
          org.address,
          org.city,
          org.pincode,
          org.lat,
          org.lng,
          org.phone,
          org.email,
          org.openTime,
          org.closeTime,
          pending ? "pending" : "approved",
          org.ownerId,
          "Priority is verified by staff for senior citizens, persons with disabilities and approved medical emergencies. Emergency care is never conditional on payment.",
          "Please cancel at least 30 minutes before your slot. Three unexplained late cancellations within 30 days may temporarily limit new bookings. Cancellations caused by centre closures, provider changes, system issues or verified emergencies are excluded.",
          org.emergency ? 1 : 0,
          org.services,
          nowIso,
          pending ? null : nowIso,
          pending ? "Awaiting verification of registration details." : null,
        );
        insertUser.run(
          org.ownerId,
          OWNER_NAMES[org.ownerId] ?? "Organization Owner",
          ownerEmail,
          hashPasswordSync("Org@12345"),
          "org",
          org.id,
          org.phone,
          nowIso,
          nowIso,
        );
        org.counters.forEach((name, index) => {
          insertCounter.run(
            `counter_${org.id}_${index + 1}`,
            org.id,
            name,
            nowIso,
          );
        });
      }
    }

    const customerStmt = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'");
    if ((customerStmt.get() as { c: number }).c === 0) {
      for (const customer of CUSTOMERS) {
        insertUser.run(
          customer.id,
          customer.name,
          customer.email,
          hashPasswordSync(customer.password),
          "user",
          null,
          "",
          nowIso,
          nowIso,
        );
      }
    }

    const random = mulberry32(20261029);
    const hourPool = [9, 10, 10, 11, 11, 11, 12, 12, 15, 16, 17, 17, 18, 18, 19];
    const customerIds = CUSTOMERS.map((c) => c.id);
    const today = todayKey(now);

    for (const org of ORGS) {
      if (org.status === "pending") continue;
      for (let daysAgo = 1; daysAgo <= 28; daysAgo += 1) {
        const day = new Date(now);
        day.setDate(day.getDate() - daysAgo);
        const queueDate = todayKey(day);
        const volume = 8 + Math.floor(random() * 11);
        const tokensToday: string[] = [];
        for (let n = 1; n <= volume; n += 1) {
          const token = `${org.prefix}-${String(n).padStart(3, "0")}`;
          tokensToday.push(token);
          const created = new Date(day);
          const hour = hourPool[Math.floor(random() * hourPool.length)];
          created.setHours(hour, Math.floor(random() * 60), 0, 0);
          const waitMinutes = 4 + Math.floor(random() * 46);
          const serviceSeconds = 210 + Math.floor(random() * 720);
          const completed = new Date(created.getTime() + waitMinutes * 60_000);
          const roll = random();
          let status: string = "completed";
          let cancelledAt: string | null = null;
          let cancelReason: string | null = null;
          let cancelCategory: string | null = null;
          let completedAt: string | null = completed.toISOString();
          let serviceSecs: number | null = serviceSeconds;
          if (roll > 0.86) {
            status = "cancelled";
            completedAt = null;
            serviceSecs = null;
            cancelledAt = new Date(created.getTime() + 10 * 60_000).toISOString();
            cancelCategory = random() > 0.55 ? "late_user" : "centre_closure";
            cancelReason =
              cancelCategory === "late_user"
                ? "Could not reach the centre in time"
                : "Centre closed a counter due to staffing";
          } else if (roll > 0.83) {
            status = "no_show";
            completedAt = null;
            serviceSecs = null;
          }
          const userId = customerIds[Math.floor(random() * customerIds.length)];
          insertTicket.run(
            `hist_${org.id}_${daysAgo}_${n}`,
            org.id,
            userId,
            token,
            random() > 0.8 ? "appointment" : "queue",
            status,
            random() > 0.9 ? "senior" : "normal",
            "",
            null,
            `counter_${org.id}_${1 + Math.floor(random() * org.counters.length)}`,
            created.toISOString(),
            created.toISOString(),
            completedAt,
            cancelledAt,
            cancelReason,
            cancelCategory,
            serviceSecs,
            queueDate,
            created.toISOString(),
            completedAt ?? cancelledAt ?? created.toISOString(),
          );
        }
      }
    }

    const at = (minutesAgo: number) =>
      new Date(now.getTime() - minutesAgo * 60_000).toISOString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 30, 0, 0);

    const activeTickets: Array<[string, string, string, string, string, string, string | null, string | null, string]> = [
      // id, org, user, token, status, priority, scheduled_for, called_at, createdAt
      ["tkt_live_sunrise_1", "org_sunrise", "usr_isha", "S-013", "serving", "normal", null, at(6), at(26)],
      ["tkt_live_sunrise_2", "org_sunrise", "usr_meera", "S-014", "waiting", "senior", null, null, at(22)],
      ["tkt_live_sunrise_3", "org_sunrise", "usr_demo", "S-015", "waiting", "normal", null, null, at(10)],
      ["tkt_live_sunrise_4", "org_sunrise", "usr_kabir", "S-016", "waiting", "normal", null, null, at(8)],
      ["tkt_live_sunrise_5", "org_sunrise", "usr_ananya", "S-017", "waiting", "normal", null, null, at(4)],
      ["tkt_live_clearview_1", "org_clearview", "usr_rohan", "C-021", "serving", "normal", null, at(9), at(36)],
      ["tkt_live_clearview_2", "org_clearview", "usr_vikram", "C-022", "waiting", "normal", null, null, at(28)],
      ["tkt_live_clearview_3", "org_clearview", "usr_priya", "C-023", "waiting", "normal", null, null, at(18)],
      ["tkt_live_bank_1", "org_sahyadri_bank", "usr_ananya", "B-018", "serving", "normal", null, at(12), at(44)],
      ["tkt_live_bank_2", "org_sahyadri_bank", "usr_kabir", "B-019", "waiting", "normal", null, null, at(16)],
      ["tkt_live_bank_3", "org_sahyadri_bank", "usr_priya", "B-020", "waiting", "disability", null, null, at(6)],
      ["tkt_live_district_1", "org_district", "usr_vikram", "D-031", "waiting", "normal", null, null, at(12)],
      ["tkt_live_metro_1", "org_metro", "usr_rohan", "M-009", "waiting", "normal", null, null, at(14)],
      ["tkt_live_arogya_1", "org_arogya", "usr_isha", "A-006", "serving", "normal", null, at(5), at(20)],
    ];

    for (const [id, orgId, userId, token, status, priority, scheduled, calledAt, createdAt] of activeTickets) {
      insertTicket.run(
        id,
        orgId,
        userId,
        token,
        "queue",
        status,
        priority,
        priority === "senior" ? "Senior citizen — verified at reception" : priority === "disability" ? "Accessibility priority — verified at reception" : "",
        scheduled,
        null,
        status === "serving" ? calledAt : null,
        calledAt,
        null,
        null,
        null,
        null,
        null,
        today,
        createdAt,
        calledAt ?? createdAt,
      );
    }

    insertTicket.run(
      "tkt_demo_booking_clearview",
      "org_clearview",
      "usr_demo",
      "C-041",
      "appointment",
      "booked",
      "normal",
      "",
      tomorrow.toISOString(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      todayKey(tomorrow),
      at(180),
      at(180),
    );

    insertNotification.run(
      "notif_demo_1",
      "usr_demo",
      "turn_alert",
      "Your turn is getting closer",
      "Only 2 customers ahead of you at Sunrise Multispeciality Hospital. Estimated turn in 12–20 minutes.",
      "tkt_live_sunrise_3",
      null,
      at(4),
    );
    insertNotification.run(
      "notif_demo_2",
      "usr_demo",
      "booking",
      "Appointment confirmed",
      "Your diagnostic appointment at ClearView Diagnostics is confirmed for tomorrow at 10:30 AM.",
      "tkt_demo_booking_clearview",
      null,
      at(180),
    );
    insertNotification.run(
      "notif_demo_3",
      "usr_demo",
      "queue",
      "You joined the queue",
      "Token S-015 created at Sunrise Multispeciality Hospital. We will alert you as your turn approaches.",
      "tkt_live_sunrise_3",
      at(9),
      at(10),
    );

    const meeraEmergencyId = "emg_seed_1";
    db.prepare(
      `INSERT INTO emergency_requests (id, ticket_id, org_id, user_id, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    ).run(
      meeraEmergencyId,
      "tkt_live_sunrise_2",
      "org_sunrise",
      "usr_meera",
      "Patient reports severe chest discomfort and is waiting with a wheelchair. Triage requested.",
      at(6),
    );

    db.prepare(
      `INSERT INTO restrictions
        (id, user_id, reason, detail, status, starts_at, ends_at, created_by, created_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
    ).run(
      "rst_seed_1",
      "usr_neha",
      "Three unexplained late cancellations within 30 days",
      "Late cancellations on 3 appointments at ClearView Diagnostics. Booking is limited while this case is reviewed.",
      at(2 * 24 * 60),
      new Date(now.getTime() + 5 * 86_400_000).toISOString(),
      adminId,
      at(2 * 24 * 60),
    );

    db.prepare(
      `INSERT INTO appeals (id, restriction_id, user_id, message, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
    ).run(
      "apl_seed_1",
      "rst_seed_1",
      "usr_neha",
      "One cancellation was due to a family medical emergency and the centre was informed by phone. Please review.",
      at(24 * 60),
    );

    db.prepare(
      `INSERT INTO reports (id, user_id, org_id, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    ).run(
      "rpt_seed_1",
      "usr_demo",
      "org_district",
      "Queue screen not updating",
      "The counter display at District Service Centre showed the same token for several minutes. Staff were helpful but the screen appeared frozen.",
      at(20 * 60),
    );

    const auditRows: Array<
      [string, string, string, string | null, string, string, string, string, string]
    > = [
      ["aud_seed_1", adminId, "admin", null, "organization.approved", "organization", "org_sunrise", JSON.stringify({ name: "Sunrise Multispeciality Hospital" }), at(30 * 24 * 60)],
      ["aud_seed_2", adminId, "admin", null, "organization.approved", "organization", "org_clearview", JSON.stringify({ name: "ClearView Diagnostics" }), at(30 * 24 * 60)],
      ["aud_seed_3", "usr_owner_sunrise", "org", "org_sunrise", "ticket.called", "ticket", "tkt_live_sunrise_1", JSON.stringify({ token: "S-013" }), at(6)],
      ["aud_seed_4", "usr_owner_sunrise", "org", "org_sunrise", "priority.granted", "ticket", "tkt_live_sunrise_2", JSON.stringify({ priority: "senior", verified: true }), at(18)],
      ["aud_seed_5", adminId, "admin", null, "restriction.created", "user", "usr_neha", JSON.stringify({ reason: "Repeated late cancellations" }), at(2 * 24 * 60)],
    ];
    for (const row of auditRows) {
      insertAudit.run(
        row[0],
        row[1],
        row[2],
        row[3],
        row[4],
        row[5],
        row[6],
        row[7],
        "127.0.0.1",
        row[8],
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function seedRealCentres(db: DatabaseSync) {
  const nowIso = new Date().toISOString();
  const insertOrg = db.prepare(
    `INSERT OR IGNORE INTO organizations
      (id, name, slug, category, description, address, city, state, pincode, lat, lng, phone, email,
       open_time, close_time, slot_minutes, status, owner_user_id, priority_policy, cancellation_policy,
       emergency_enabled, services, created_at, approved_at, status_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Madhya Pradesh', ?, ?, ?, ?, ?, ?, ?, 15, 'approved', ?, ?, ?, ?, ?, ?, ?, NULL)`,
  );
  const insertUser = db.prepare(
    `INSERT OR IGNORE INTO users
      (id, name, email, password_hash, role, org_id, phone, email_verified_at, language, large_text, created_at)
     VALUES (?, ?, ?, ?, 'org', ?, ?, ?, 'en', 0, ?)`,
  );
  const insertCounter = db.prepare(
    "INSERT OR IGNORE INTO counters (id, org_id, name, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
  );
  const updateLocation = db.prepare(
    "UPDATE organizations SET lat = ?, lng = ?, address = ?, pincode = ?, phone = ? WHERE id = ?",
  );

  db.exec("BEGIN IMMEDIATE");
  try {
    for (const org of REAL_CENTRES) {
      insertOrg.run(
        org.id,
        org.name,
        org.slug,
        org.category,
        org.description,
        org.address,
        org.city,
        org.pincode,
        org.lat,
        org.lng,
        org.phone,
        org.email,
        org.openTime,
        org.closeTime,
        org.ownerId,
        "Priority is verified by staff for senior citizens, persons with disabilities and approved medical emergencies. Emergency care is never conditional on payment.",
        "Please cancel at least 30 minutes before your slot. Three unexplained late cancellations within 30 days may temporarily limit new bookings. Cancellations caused by centre closures, provider changes, system issues or verified emergencies are excluded.",
        org.emergency ? 1 : 0,
        org.services,
        nowIso,
        nowIso,
      );
      updateLocation.run(
        org.lat,
        org.lng,
        org.address,
        org.pincode,
        org.phone,
        org.id,
      );
      insertUser.run(
        org.ownerId,
        OWNER_NAMES[org.ownerId] ?? "Organization Owner",
        `${org.slug}@skiplinehub.app`,
        hashPasswordSync("Org@12345"),
        org.id,
        org.phone,
        nowIso,
        nowIso,
      );
      org.counters.forEach((name, index) => {
        insertCounter.run(
          `counter_${org.id}_${index + 1}`,
          org.id,
          name,
          nowIso,
        );
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
