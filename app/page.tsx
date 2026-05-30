'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Search, Menu, X, Globe, Sun, Moon, CheckCircle2, Phone, 
  MapPin, Clock, Mail, FileText, Award, Users, Check, 
  Briefcase, Calendar, Shield, Star, Upload, Sparkles, 
  ChevronDown, PhoneCall, ArrowUp, Send, Trash2, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Firebase Integrations
import { auth, db, handleFirestoreError, OperationType, validateConnection } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';


// Static SEO Schema
const schemaJSON = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "OM ONLINE WORKS (ओम ऑनलाइन वर्क्स)",
  "image": "https://picsum.photos/seed/om-online/800/600",
  "@id": "https://om-online-works.vercel.app",
  "url": "https://om-online-works.vercel.app",
  "telephone": "+919058609674",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Unnamed Road, Ankit Vihar, Navin Nagar",
    "addressLocality": "Saharanpur",
    "addressRegion": "Uttar Pradesh",
    "postalCode": "247001",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "29.9674",
    "longitude": "77.5512"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ],
    "opens": "08:30",
    "closes": "21:30"
  },
  "sameAs": [
    "https://maps.google.com/?cid=1231231231"
  ]
};

// Types & Data Declarations
type Lang = 'en' | 'hi';

interface Service {
  id: number;
  nameEn: string;
  nameHi: string;
  category: 'certificates' | 'tax' | 'career' | 'banking' | 'other';
  descEn: string;
  descHi: string;
  documentsEn: string[];
  documentsHi: string[];
}

const SERVICES_DATA: Service[] = [
  {
    id: 1,
    nameEn: "Income Certificate",
    nameHi: "आय प्रमाण पत्र",
    category: "certificates",
    descEn: "Official government document certifying the annual income of an individual or family.",
    descHi: "व्यक्ति या परिवार की वार्षिक आय को प्रमाणित करने वाला आधिकारिक सरकारी दस्तावेज।",
    documentsEn: ["Aadhaar Card", "Recent Passport Photo", "Mobile Number linked with Aadhaar", "Self-Declaration Form"],
    documentsHi: ["आधार कार्ड", "नवीनतम पासपोर्ट फोटो", "आधार से लिंक मोबाइल नंबर", "स्व-घोषणा पत्र"]
  },
  {
    id: 2,
    nameEn: "Caste Certificate",
    nameHi: "जाति प्रमाण पत्र",
    category: "certificates",
    descEn: "Official certificate verifying an individual's reserved category status under state records.",
    descHi: "राज्य के अभिलेखों के तहत किसी व्यक्ति की आरक्षित श्रेणी की स्थिति को सत्यापित करने वाला प्रमाण पत्र।",
    documentsEn: ["Aadhaar Card", "Recent Passport Photo", "Family Members Detail / Old Caste Proof", "Resident verification"],
    documentsHi: ["आधार कार्ड", "नवीनतम पासपोर्ट फोटो", "परिवार के सदस्यों का विवरण / पुराना जाति प्रमाण", "निवासी सत्यापन"]
  },
  {
    id: 3,
    nameEn: "Residence Certificate",
    nameHi: "निवास प्रमाण पत्र",
    category: "certificates",
    descEn: "Domicile proof showing that an individual resides permanently in the state of Uttar Pradesh.",
    descHi: "उत्तर प्रदेश राज्य में स्थायी रूप से रहने का प्रमाण देने वाला मूल निवास पत्र।",
    documentsEn: ["Aadhaar Card", "Recent Passport Photo", "Address Proof (Electricity Bill/Ration Card)", "Self-Declaration"],
    documentsHi: ["आधार कार्ड", "नवीनतम पासपोर्ट फोटो", "पते का प्रमाण (बिजली बिल/राशन कार्ड)", "स्व-घोषणा"]
  },
  {
    id: 4,
    nameEn: "Marriage Grant Application",
    nameHi: "विवाह अनुदान आवेदन",
    category: "certificates",
    descEn: "Government financial assistance application for marriages of daughters from eligible families.",
    descHi: "पात्र परिवारों की बेटियों के विवाह के लिए सरकारी वित्तीय सहायता आवेदन।",
    documentsEn: ["Daughter & Groom Aadhaar Cards", "Wedding Card", "Income Certificate", "Caste Certificate", "Bank Passbook", "Photos"],
    documentsHi: ["पुत्री और दूल्हे का आधार कार्ड", "शादी का कार्ड", "आय प्रमाण पत्र", "जाति प्रमाण पत्र", "बैंक पासबुक", "फोटो"]
  },
  {
    id: 5,
    nameEn: "Income Tax Return (ITR)",
    nameHi: "आयकर रिटर्न (ITR)",
    category: "tax",
    descEn: "E-filing of annual income returns, tax calculations and submission to the IT Department.",
    descHi: "वार्षिक आयकर रिटर्न की ई-फाइलिंग, टैक्स गणना और आईटी विभाग को जमा करना।",
    documentsEn: ["PAN Card", "Aadhaar Card", "Form 16 (if employed)", "Bank Account Statement (Full Year)", "Details of extra income"],
    documentsHi: ["पैन कार्ड", "आधार कार्ड", "फॉर्म 16 (यदि कार्यरत हैं)", "बैंक खाता विवरण (पूरे वर्ष का)", "अतिरिक्त आय का विवरण"]
  },
  {
    id: 6,
    nameEn: "Ration Card Services",
    nameHi: "राशन कार्ड सेवाएं",
    category: "certificates",
    descEn: "Applying for new ration cards, adding details, correcting names, or unit transfers.",
    descHi: "नया राशन कार्ड बनाना, विवरण जोड़ना, नाम सुधारना या यूनिट ट्रांसफर करना।",
    documentsEn: ["Aadhaar of All Family Members", "HOD Female Passbook & Photo", "Income Certificate", "Mobile Number"],
    documentsHi: ["परिवार के सभी सदस्यों का आधार", "घर की महिला मुखिया की पासबुक और फोटो", "आय प्रमाण पत्र", "मोबाइल नंबर"]
  },
  {
    id: 7,
    nameEn: "Identity Card Services",
    nameHi: "पहचान पत्र (Voter Card)",
    category: "other",
    descEn: "New Voter Registration, voter ID corrections, linking Aadhaar, or downloading digital e-EPIC.",
    descHi: "नया मतदाता पंजीकरण, मतदाता पहचान पत्र में सुधार, आधार लिंक करना या डिजिटल ई-एपिक डाउनलोड।",
    documentsEn: ["Aadhaar Card", "Passport Sized Photo", "Age Proof (10th mark sheet or Birth Certificate)", "Address Proof"],
    documentsHi: ["आधार कार्ड", "पासपोर्ट साइज फोटो", "आयु का प्रमाण (10वीं की मार्कशीट या जन्म प्रमाण पत्र)", "पते का प्रमाण"]
  },
  {
    id: 8,
    nameEn: "PF Withdrawal & Claims",
    nameHi: "पीएफ निकासी और दावा",
    category: "banking",
    descEn: "Online EPFO Provident Fund withdrawal, pension claims, and KYC linking on UAN portal.",
    descHi: "EPFO भविष्य निधि निकासी, पेंशन दावे और UAN पोर्टल पर KYC लिंकिंग ऑनलाइन।",
    documentsEn: ["UAN Number", "Aadhaar with linked active Mobile No.", "Bank Passbook/Cancelled Cheque showing bank details"],
    documentsHi: ["UAN नंबर", "आधार से लिंक सक्रिय मोबाइल नंबर", "बैंक पासबुक/रद्द चेक जिसमें बैंक विवरण दर्ज हो"]
  },
  {
    id: 9,
    nameEn: "Online Government Form Filling",
    nameHi: "ऑनलाइन फॉर्म भरना",
    category: "career",
    descEn: "Filling and submission of recruitment forms, scholarship forms, exam applications cleanly.",
    descHi: "भर्ती फॉर्म, छात्रवृत्ति फॉर्म, परीक्षा आवेदनों को बिल्कुल सही भरना व जमा करना।",
    documentsEn: ["Qualification Marksheets", "Aadhaar Card", "Passport Photo & Signature scans", "Category Certificate (if applicable)"],
    documentsHi: ["शैक्षणिक मार्कशीट", "आधार कार्ड", "पासपोर्ट फोटो और हस्ताक्षर", "श्रेणी प्रमाण पत्र (यदि लागू हो)"]
  },
  {
    id: 10,
    nameEn: "Passport Services",
    nameHi: "पासपोर्ट सेवाएं",
    category: "other",
    descEn: "Fresh passport application filing, renewal applications, booking slot schedules at Seva Kendra.",
    descHi: "नया पासपोर्ट आवेदन भरना, नवीनीकरण आवेदन, सेवा केंद्र पर स्लॉट समय बुक करना।",
    documentsEn: ["Aadhaar Card", "10th Qualification Certificate", "Address Proof", "PAN Card/Voter ID (optional)"],
    documentsHi: ["आधार कार्ड", "10वीं का योग्यता प्रमाण पत्र", "पते का प्रमाण", "पैन कार्ड/वोटर आईडी (वैकल्पिक)"]
  },
  {
    id: 11,
    nameEn: "Employment Registration",
    nameHi: "रोजगार पंजीकरण (SewaYojan)",
    category: "career",
    descEn: "Registering on UP Sewayojan Employment Portal to receive job updates and career resources.",
    descHi: "नौकरी के अपडेट और करियर संसाधन प्राप्त करने के लिए यूपी सेवायोजन रोजगार पोर्टल पर पंजीकरण।",
    documentsEn: ["All Qualification Marksheets", "Aadhaar Card", "Caste Certificate (if reserved)", "Mobile & Email"],
    documentsHi: ["सभी शैक्षणिक मार्कशीट", "आधार कार्ड", "जाति प्रमाण पत्र", "मोबाइल नंबर और ईमेल"]
  },
  {
    id: 12,
    nameEn: "Udyam Registration",
    nameHi: "उद्योग (Udyam) पंजीकरण",
    category: "tax",
    descEn: "Get central MSME benefits, loan preferences, and official registration certificates for your business.",
    descHi: "अपने व्यवसाय के लिए एमएसएमई लाभ, ऋण प्राथमिकताएं और आधिकारिक पंजीकरण प्रमाण पत्र प्राप्त करें।",
    documentsEn: ["Aadhaar Card of Owner", "PAN Card (Owner/Business)", "Bank Passbook with Account Details", "Business Name & Address"],
    documentsHi: ["मालिक का आधार कार्ड", "पैन कार्ड (मालिक/व्यवसाय)", "खाता विवरण के साथ बैंक पासबुक", "व्यवसाय का नाम और पता"]
  },
  {
    id: 13,
    nameEn: "Food License (FSSAI)",
    nameHi: "खाद्य लाइसेंस (FSSAI)",
    category: "tax",
    descEn: "Mandatory safety license or registration for small food businesses, dhabas, shops, or processing units.",
    descHi: "छोटे खाद्य व्यवसायों, ढाबों, दुकानों या प्रसंस्करण इकाइयों के लिए सुरक्षा लाइसेंस या पंजीकरण।",
    documentsEn: ["Passport Photo of Owner", "Aadhaar Card / ID Proof", "Business Address Proof", "Business Name details"],
    documentsHi: ["मालिक का पासपोर्ट फोटो", "आधार कार्ड / पहचान प्रमाण", "व्यापार पते का प्रमाण", "व्यापार का नाम विवरण"]
  },
  {
    id: 14,
    nameEn: "Lamination Services",
    nameHi: "दस्तावेज लैमिनेशन",
    category: "other",
    descEn: "High-grade premium lamination to protect your vital certificates from moisture and wear.",
    descHi: "नमी और घिसावट से आपके महत्वपूर्ण प्रमाण पत्रों की सुरक्षा के लिए उच्च श्रेणी का लैमिनेशन।",
    documentsEn: ["Physical documents/certificates brought in person"],
    documentsHi: ["व्यक्तिगत रूप से लाए गए भौतिक दस्तावेज/प्रमाण पत्र"]
  },
  {
    id: 15,
    nameEn: "Labour Registration",
    nameHi: "श्रम पंजीकरण (BOCW)",
    category: "career",
    descEn: "Enrolling with Building & Construction Board to claim official direct-benefit schemes.",
    descHi: "लाभांवित योजनाओं के सीधे लाभ का दावा करने के लिए भवन और निर्माण कल्याण बोर्ड में पंजीकरण।",
    documentsEn: ["Aadhaar Card", "Bank Account Details", "Passport Photo", "Work Experience Declaration"],
    documentsHi: ["आधार कार्ड", "बैंक खाता विवरण", "पासपोर्ट आकार की फोटो", "कार्य अनुभव घोषणा"]
  },
  {
    id: 16,
    nameEn: "Admit Card Download",
    nameHi: "प्रवेश पत्र डाउनलोड",
    category: "career",
    descEn: "Speedy printing of upcoming competitive, board, and academic exams hall tickets.",
    descHi: "आने वाली प्रतियोगी, बोर्ड और शैक्षणिक परीक्षाओं के प्रवेश पत्र की त्वरित प्रिंटिंग।",
    documentsEn: ["Application Number / Registration ID", "Date of Birth / Password"],
    documentsHi: ["आवेदन संख्या / पंजीकरण आईडी", "जन्म तिथि / पासवर्ड"]
  },
  {
    id: 17,
    nameEn: "Result Printing",
    nameHi: "परीक्षा परिणाम प्रिंटिंग",
    category: "career",
    descEn: "Laser printing of board exams, sarkari naukri exams, university results on clean paper.",
    descHi: "साफ कागज पर बोर्ड परीक्षा, सरकारी नौकरी परीक्षा, विश्वविद्यालय के परिणामों की लेजर प्रिंटिंग।",
    documentsEn: ["Roll Number / Roll Code", "Exam Name or Board details"],
    documentsHi: ["रोल नंबर / रोल कोड", "परीक्षा का नाम या बोर्ड विवरण"]
  },
  {
    id: 18,
    nameEn: "Hindi Typing",
    nameHi: "हिंदी हस्तलेखन एवं टाइपिंग",
    category: "other",
    descEn: "Accurate typing service in clean Hindi fonts for legal, academic drafts, and formal letters.",
    descHi: "कानूनी, शैक्षणिक ड्राफ्ट और औपचारिक पत्रों के लिए स्वच्छ हिंदी फोंट में सटीक टाइपिंग सेवा।",
    documentsEn: ["Draft copy / handwriting or oral dictation"],
    documentsHi: ["ड्राफ्ट प्रति / हस्तलेखन या मौखिक भाषण"]
  },
  {
    id: 19,
    nameEn: "English Typing",
    nameHi: "अंग्रेजी टाइपिंग सेवा",
    category: "other",
    descEn: "Professional layout typing for applications, certificates, books and documentation work.",
    descHi: "आवेदनों, प्रमाण पत्रों, पुस्तकों और प्रलेखन कार्यों के लिए पेशेवर लेआउट टाइपिंग।",
    documentsEn: ["Handwritten notebook draft or clear scan file"],
    documentsHi: ["हस्तलिखित नोटबुक ड्राफ्ट या स्पष्ट स्कैन फ़ाइल"]
  },
  {
    id: 20,
    nameEn: "GST Registration",
    nameHi: "जीएसटी पंजीकरण",
    category: "tax",
    descEn: "New GST Identification Number registration, monthly/quarterly returns filing easily.",
    descHi: "नया जीएसटी नंबर पंजीकरण, आसानी से मासिक/त्रैमासिक रिटर्न दाखिल करना।",
    documentsEn: ["PAN Card of Business", "Aadhaar Card", "Electricity Bill & Rent Deed (Office)", "Cancel Cheque", "Photo"],
    documentsHi: ["व्यवसाय का पैन कार्ड", "आधार कार्ड", "कार्यालय का बिजली बिल और किरायानामा", "रद्द चेक", "फोटो"]
  },
  {
    id: 21,
    nameEn: "Aadhaar Related Assistance",
    nameHi: "आधार संबंधी सहायता",
    category: "banking",
    descEn: "Assisting inside online corrections, PVC card ordering, status tracking, linking mobile update advice.",
    descHi: "ऑनलाइन सुधार, पीवीसी कार्ड ऑर्डर करने, स्थिति को ट्रैक करने, मोबाइल लिंकिंग सलाह में सहायता।",
    documentsEn: ["Aadhaar Card copy", "Registered Mobile Number for OTP validation"],
    documentsHi: ["आधार कार्ड की प्रति", "ओटीपी सत्यापन के लिए पंजीकृत मोबाइल नंबर"]
  },
  {
    id: 22,
    nameEn: "Money Transfer Services",
    nameHi: "मनी ट्रांसफर (DMT)",
    category: "banking",
    descEn: "Secure, immediate instant credit of money transfers to any bank account in India 24/7.",
    descHi: "भारत के किसी भी बैंक खाते में 24/7 पैसे के तत्काल और सुरक्षित ट्रांसफर की सुविधा।",
    documentsEn: ["Receiver Bank Name & Account Number", "Receiver IFSC Code", "Sender Contact Number"],
    documentsHi: ["प्राप्तकर्ता बैंक का नाम और खाता संख्या", "प्राप्तकर्ता बैंक का IFSC कोड", "प्रेषक का संपर्क नंबर"]
  },
  {
    id: 23,
    nameEn: "Vehicle Insurance",
    nameHi: "वाहन बीमा (2w/4w Insurance)",
    category: "other",
    descEn: "Third-party or comprehensive motor insurance policies instantly with digital premium slips.",
    descHi: "डिजिटल प्रीमियम पर्चियों के साथ तुरंत थर्ड-पार्टी या व्यापक मोटर बीमा पॉलिसियां।",
    documentsEn: ["RC (Registration Certificate) Book / Card", "Previous Insurance copy (if any)", "Owner ID Aadhaar"],
    documentsHi: ["वाहन आरसी बुक / कार्ड", "पिछला बीमा प्रपत्र (यदि हो)", "मालिक का आधार कार्ड"]
  },
  {
    id: 24,
    nameEn: "Online Banking Services",
    nameHi: "ऑनलाइन बैंकिंग सेवाएं (AEPS)",
    category: "banking",
    descEn: "Cash withdrawal through Aadhaar Biometric, balance inquiry, mini statement of accounts.",
    descHi: "आधार बायोमेट्रिक के माध्यम से नकद निकासी, शेष राशि की जांच, खातों का मिनी स्टेटमेंट।",
    documentsEn: ["Aadhaar Number", "Aadhaar linked Bank name", "Physical presence of account holder for fingerprints"],
    documentsHi: ["आधार नंबर", "आधार लिंक बैंक का नाम", "फिंगरप्रिंट के लिए खाताधारक की भौतिक उपस्थिति"]
  },
  {
    id: 25,
    nameEn: "Redeem Code Services",
    nameHi: "गूगल प्ले रिडीम कोड सेवाएं",
    category: "other",
    descEn: "Instant creation of Google Play Redeem Codes, game vouchers, and utility coupons.",
    descHi: "गूगल प्ले रिडीम कोड, गेम वाउचर और उपयोगिता कूपन का तत्काल निर्माण।",
    documentsEn: ["Desired Amount", "Email/Mobile Number for delivery"],
    documentsHi: ["वांछित राशि", "डिलिवरी के लिए ईमेल/मोबाइल नंबर"]
  }
];

const FAQS_DATA = [
  {
    qEn: "What are the timings of OM ONLINE WORKS?",
    qHi: "ओम ऑनलाइन वर्क्स का समय क्या है?",
    aEn: "We are open daily from 8:30 AM and close at 9:30 PM. Feel free to book an appointment online or call us directly.",
    aHi: "हम प्रतिदिन सुबह 8:30 बजे से रात 9:30 बजे तक खुले रहते हैं। निसंकोच ऑनलाइन अपॉइंटमेंट बुक करें या हमें कॉल करें।"
  },
  {
    qEn: "How long does it take to get an Income or Caste Certificate?",
    qHi: "आय या जाति प्रमाण पत्र बनने में कितना समय लगता है?",
    aEn: "Usually, government departments verify and release Income, Caste, or Residence Certificates within 10 to 15 working days.",
    aHi: "आमतौर पर, संबंधित सरकारी विभाग 10 से 15 कार्य दिवसों के भीतर आय, जाति या निवास प्रमाण पत्र सत्यापित कर जारी कर देते हैं।"
  },
  {
    qEn: "Can I submit my documents via WhatsApp for preparation?",
    qHi: "क्या मैं काम शुरू करने के लिए अपने दस्तावेज व्हाट्सएप पर भेज सकता हूं?",
    aEn: "Yes! Using our system, you can select a service, fill in your details, drag and upload scans, and submit. It automatically compiles a neat brief and sends it to our operator on WhatsApp for seamless start.",
    aHi: "हाँ! हमारे सिस्टम का उपयोग करके, आप अपनी पसंद की सेवा चुन सकते हैं, अपने विवरण भर सकते हैं, दस्तावेज़ अपलोड करके सबमिट कर सकते हैं। यह स्वतः विवरण तैयार कर हमारे ऑपरेटर को सीधे व्हाट्सएप पर भेज देता है।"
  },
  {
    qEn: "Do you have options to retrieve PF / EPF amount online?",
    qHi: "क्या आपके पास पीएफ / ईपीएफ राशि निकालने का विकल्प उपलब्ध है?",
    aEn: "Yes, we specialize in EPFO services including KYC update, Form 31 Advance claim, Form 19/10C full settlement, and UAN activation.",
    aHi: "हाँ, हम केवाईसी अपडेट, फॉर्म 31 एडवांस निकासी, फॉर्म 19/10C पूर्ण निपटान और यूएएन एक्टिवेशन सहित ईपीएफओ सेवाओं में माहिर हैं।"
  },
  {
    qEn: "Where is the shop located in Saharanpur?",
    qHi: "सहारनपुर में दुकान की स्थिति कहाँ है?",
    aEn: "We are located at Navin Nagar, Ankit Vihar, near Unnamed Road, Saharanpur, Uttar Pradesh - 247001. Check the Google Maps embed on our page for absolute visual directions.",
    aHi: "हम नवीन नगर, अंकित विहार, सहारनपुर, उत्तर प्रदेश - 247001 पर स्थित हैं। सटीक विज़ुअल दिशा-निर्देशों के लिए हमारे पेज पर दिए गए गूगल मैप्स एम्बेड को देखें।"
  },
  {
    qEn: "How can I track the status of my appointment or form?",
    qHi: "मैं अपने अपॉइंटमेंट या फॉर्म की स्थिति कैसे ट्रैक कर सकता हूँ?",
    aEn: "Our website offers a dedicated 'Appointment Tracking UI' locally where your active bookings are listed. You can also query us directly via WhatsApp with your tracking ID or registered mobile.",
    aHi: "हमारी वेबसाइट स्थानीय रूप से एक समर्पित 'अपॉइंटमेंट ट्रैकिंग यूआई' प्रदान करती है जहां आपकी सक्रिय बुकिंग सूचीबद्ध होती हैं। आप अपने मोबाइल नंबर के साथ सीधे हमें व्हाट्सएप भी कर सकते हैं।"
  }
];

export default function HomePage() {
  // Localization state
  const [lang, setLang] = useState<Lang>('en');
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // Sticky scroll visual navbar state
  const [scrolled, setScrolled] = useState<boolean>(false);
  // Mobile menu control toggles
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Search and categories filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Active Section navigation tracker
  const [activeSection, setActiveSection] = useState<string>('home');
  
  // Lightbox for Gallery
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);
  
  // Appointment Popup State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  
  // Drag and drop simulated file upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingStatus, setUploadingStatus] = useState<boolean>(false);

  // File Payload Base64 mapping for durable Firestore syncing
  interface FilePayload {
    name: string;
    type: string;
    base64: string;
  }
  const [filePayloads, setFilePayloads] = useState<FilePayload[]>([]);

  // Firebase Auth states
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  
  // Local storage & Firestore synchronized appointment tracking
  interface Booking {
    id: string;
    serviceName: string;
    customerName: string;
    phone: string;
    email?: string;
    date: string;
    status: 'Pending Review' | 'Processing' | 'Documents Verified' | 'Completed';
    files: string[];
    fileObjects?: FilePayload[];
    notes: string;
    userId?: string | null;
    createdAtTS?: number;
  }
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Back to Top button visibility
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Sound cue feedback or micro interaction toggles
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Business Open status tracker
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  // Generate responsive visual refs
  const headerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for downloading files from Admin Portal
  const downloadBase64File = (base64Data: string, fileName: string) => {
    try {
      const link = document.createElement("a");
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed download file", e);
      alert("Download failed. The file format might be corrupted.");
    }
  };

  // Admin and Client status tracking updates
  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      const docRef = doc(db, "appointments", id);
      await updateDoc(docRef, { 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      alert(lang === 'en' ? "Status updated successfully!" : "अपॉइंटमेंट की स्थिति सफलतापूर्वक बदल दी गई!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  // Admin delete bookings
  const deleteBookingAdmin = async (id: string) => {
    if (confirm(lang === 'en' ? "Are you sure you want to delete this appointment?" : "क्या आप वाकई इस अपॉइंटमेंट को डेटाबेस से हटाना चाहते हैं?")) {
      try {
        await deleteDoc(doc(db, "appointments", id));
        alert(lang === 'en' ? "Appointment deleted successfully" : "अपॉइंटमेंट सफलता पूर्वक रद्द किया गया");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
      }
    }
  };

  useEffect(() => {
    // Scroll triggers
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);

      // Simple active section highlights
      const sections = ['home', 'about', 'services', 'why-us', 'reviews', 'gallery', 'contact', 'location', 'tracker'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);

    // Business Hour calculation
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getUTCHours() + 5.5; // Simple Indian Standard Time correction
      const localTimeMinutes = (currentHour % 24) * 60 + now.getUTCMinutes();
      if (localTimeMinutes >= 510 && localTimeMinutes <= 1290) { // 8:30 AM to 9:30 PM (930 minutes)
        setIsOpenNow(true);
      } else {
        setIsOpenNow(false);
      }
    }, 10000);

    // Initial checks and loads decoupled from synchronous mount
    setTimeout(() => {
      const nowCheck = new Date();
      const currentHourCheck = nowCheck.getUTCHours() + 5.5;
      const localTimeMinutesCheck = (currentHourCheck % 24) * 60 + nowCheck.getUTCMinutes();
      setIsOpenNow(localTimeMinutesCheck >= 510 && localTimeMinutesCheck <= 1290);
    }, 0);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  // Google Login and Firestore synchronization effect
  useEffect(() => {
    validateConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const email = currentUser.email?.toLowerCase() || '';
        const admins = [
          "satyamvermag3@gmail.com",
          "dsoni4715@gmail.com",
          "dsoni4715@gmai.com",
          "satyammasterofai@gmail.com"
        ];
        setIsAdminUser(admins.includes(email));
      } else {
        setIsAdminUser(false);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Realtime Booking Syncer
  useEffect(() => {
    if (loadingAuth) return;

    let unsubscribeBookings = () => {};

    if (isAdminUser) {
      // Admins pull all appointments
      const appointmentsRef = collection(db, "appointments");
      unsubscribeBookings = onSnapshot(appointmentsRef, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            serviceName: data.serviceName,
            customerName: data.customerName,
            phone: data.phone,
            email: data.email || '',
            date: data.date,
            status: data.status,
            files: data.files?.map((f: any) => f.name) || [],
            fileObjects: data.files || [],
            notes: data.notes || '',
            userId: data.userId || null,
            createdAtTS: data.createdAtTS || 0
          });
        });
        // Sort locally by creation ts
        list.sort((a, b) => (b.createdAtTS || 0) - (a.createdAtTS || 0));
        setMyBookings(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "appointments");
      });
    } else if (user) {
      // Normal logged-in user pulls their own appointments
      const appointmentsRef = collection(db, "appointments");
      const q = query(appointmentsRef, where("userId", "==", user.uid));
      unsubscribeBookings = onSnapshot(q, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            serviceName: data.serviceName,
            customerName: data.customerName,
            phone: data.phone,
            email: data.email || '',
            date: data.date,
            status: data.status,
            files: data.files?.map((f: any) => f.name) || [],
            fileObjects: data.files || [],
            notes: data.notes || '',
            userId: data.userId || null,
            createdAtTS: data.createdAtTS || 0
          });
        });
        // Sort locally by creation ts
        list.sort((a, b) => (b.createdAtTS || 0) - (a.createdAtTS || 0));
        setMyBookings(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "appointments");
      });
    } else {
      // Logged out visitor pulls from localStorage asynchronously
      setTimeout(() => {
        const stored = localStorage.getItem('om_online_bookings');
        if (stored) {
          try {
            setMyBookings(JSON.parse(stored));
          } catch (e) {
            console.error("Failed loading stored bookings", e);
          }
        } else {
          setMyBookings([]);
        }
      }, 0);
    }

    return () => unsubscribeBookings();
  }, [user, isAdminUser, loadingAuth]);

  // Dark Mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (filesList: File[]) => {
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const filteredFiles = filesList.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && validExtensions.includes(ext);
    });

    if (filteredFiles.length === 0) return;

    setUploadingStatus(true);
    setUploadedFiles(prev => [...prev, ...filteredFiles]);

    // Track state progression and read files as base64 payloads to save in Firestore
    filteredFiles.forEach(file => {
      if (file.size > 800 * 1024) {
        alert(lang === 'en' 
          ? `File "${file.name}" is larger than 800KB. To protect cloud database quotas, kindly upload compressed copies.`
          : `फ़ाइल "${file.name}" 800KB से बड़ी है। डेटाबेस कोटा सुरक्षित रखने के लिए कृपया संकुचित फ़ाइल चुनें।`
        );
        return;
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({ ...prev, [file.name]: percentage }));
        }
      };
      
      reader.onloadend = () => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        setFilePayloads(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/octet-stream',
            base64: reader.result as string
          }
        ]);
      };

      reader.onerror = () => {
        console.error("Failed to read file", file.name);
      };

      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      setUploadingStatus(false);
    }, 1200);
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    setFilePayloads(prev => prev.filter(p => p.name !== fileName));
    const newProgress = { ...uploadProgress };
    delete newProgress[fileName];
    setUploadProgress(newProgress);
  };

  // Submit Appointment Handler
  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedService || !userName || !userPhone) {
      alert("Name and Phone are highly required.");
      return;
    }

    const docId = "OM-" + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN');
    const fileNames = uploadedFiles.map(f => f.name);

    // Save into Firestore Datastore
    const firebasePayload = {
      id: docId,
      serviceName: lang === 'en' ? selectedService.nameEn : selectedService.nameHi,
      customerName: userName,
      phone: userPhone,
      email: userEmail || (user?.email || ''),
      date: dateStr,
      status: 'Pending Review',
      files: filePayloads, // Stores { name, type, base64 } objects
      notes: userNotes,
      userId: user?.uid || 'anonymous',
      createdAtTS: Date.now()
    };

    try {
      await setDoc(doc(db, "appointments", docId), firebasePayload);
    } catch (error) {
      console.error("Firebase submit error:", error);
      // Fallback or alert
    }

    // Save into tracking list locally (hybrid fallback for instant validation/offline lookup)
    const localNewBooking: Booking = {
      id: docId,
      serviceName: lang === 'en' ? selectedService.nameEn : selectedService.nameHi,
      customerName: userName,
      phone: userPhone,
      email: userEmail || (user?.email || ''),
      date: dateStr,
      status: 'Pending Review',
      files: fileNames,
      fileObjects: filePayloads,
      notes: userNotes,
      userId: user?.uid || null,
      createdAtTS: Date.now()
    };

    const updatedBookings = [localNewBooking, ...myBookings];
    if (!user) {
      // Offline visitors persist their bookings session in localStorage
      localStorage.setItem('om_online_bookings', JSON.stringify(updatedBookings));
      setMyBookings(updatedBookings);
    }

    // Construct the WhatsApp compiled API prompt message
    const lineBreak = "%0A";
    const boldDelimiter = "*";

    const customText = 
      `Hello OM ONLINE WORKS,` + lineBreak + lineBreak +
      `I would like to book an appointment.` + lineBreak + lineBreak +
      `${boldDelimiter}Appointment ID:${boldDelimiter} ${docId}` + lineBreak +
      `${boldDelimiter}Name:${boldDelimiter} ${userName}` + lineBreak +
      `${boldDelimiter}Mobile:${boldDelimiter} ${userPhone}` + lineBreak +
      `${boldDelimiter}Email:${boldDelimiter} ${userEmail || (user?.email || 'N/A')}` + lineBreak +
      `${boldDelimiter}Service:${boldDelimiter} ${lang === 'en' ? selectedService.nameEn : selectedService.nameHi}` + lineBreak + lineBreak +
      `${boldDelimiter}Uploaded Documents:${boldDelimiter}` + lineBreak +
      (fileNames.length > 0 ? fileNames.map((name, i) => `${i + 1}. ${name}`).join(lineBreak) : 'No documents uploaded yet (will bring physically)') + lineBreak + lineBreak +
      `${boldDelimiter}Notes:${boldDelimiter} ${userNotes || 'None'}` + lineBreak + lineBreak +
      `Please confirm my appointment.`;

    // WhatsApp link builder (Primary WhatsApp number mentioned: 9456411569)
    const whatsappLink = `https://wa.me/919456411569?text=${customText}`;

    // Clean states and transition
    setFormSuccessMessage(lang === 'en' ? "Successfully generated details! Redirecting you to Operator WhatsApp..." : "विवरण सफलतापूर्वक तैयार! ऑपरेटर व्हाट्सएप पर रीडायरेक्ट हो रहा है...");
    
    setTimeout(() => {
      window.open(whatsappLink, '_blank');
      setSelectedService(null);
      setUserName('');
      setUserPhone('');
      setUserEmail('');
      setUserNotes('');
      setUploadedFiles([]);
      setFilePayloads([]);
      setFormSuccessMessage(null);
    }, 1800);
  };

  // Delete local tracked appointment
  const cancelTrackedBooking = (id: string) => {
    if (confirm(lang === 'en' ? "Are you sure you want to remove this booking from your browser history?" : "क्या आप वाकई इस बुकिंग को अपने ब्राउज़र इतिहास से हटाना चाहते हैं?")) {
      const filtered = myBookings.filter(b => b.id !== id);
      setMyBookings(filtered);
      localStorage.setItem('om_online_bookings', JSON.stringify(filtered));
    }
  };

  // Filter Services Logic
  const filteredServices = SERVICES_DATA.filter(srv => {
    const matchesCategory = activeCategory === 'all' || srv.category === activeCategory;
    const matchesQuery = 
      srv.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.nameHi.includes(searchQuery) ||
      srv.descEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.descHi.includes(searchQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className={cn("min-h-screen font-sans", darkMode ? "bg-slate-950 text-gray-100" : "bg-gray-50 text-gray-900")}>
      
      {/* Local schema injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJSON) }}
      />

      {/* Floating VisionOS styled center Navbar */}
      <header className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className={cn(
          "w-full max-w-5xl rounded-full flex items-center justify-between py-3 px-6 md:px-8 transition-all duration-300 border shadow-lg",
          scrolled ? "scale-[0.98]" : "",
          darkMode 
            ? "bg-slate-900 border-white/10 text-white" 
            : "bg-white border-slate-200/80 text-slate-900"
        )}>
          {/* Logo Brand Accent */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 via-white/50 to-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 duration-500">
              <span className="font-bold text-slate-950 font-mono text-sm">OM</span>
            </div>
            <div>
              <div className={cn("font-extrabold tracking-tight flex items-center text-sm md:text-base transition-colors duration-200", darkMode ? "text-white" : "text-slate-900")}>
                <span>OM ONLINE WORKS</span>
              </div>
              <span className="text-[10px] font-semibold text-orange-400 block -mt-1 tracking-widest font-mono">
                ओम ऑनलाइन वर्क्स
              </span>
            </div>
          </a>

          {/* Quick Config Actions Bar */}
          <div className="flex items-center gap-2">
            {/* Live status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-mono">
              <span className={cn("w-2 h-2 rounded-full inline-block animate-pulse", isOpenNow ? "bg-emerald-400" : "bg-rose-400")}></span>
              <span>{isOpenNow ? (lang === 'en' ? 'Open Now' : 'खुला है') : (lang === 'en' ? 'Closed' : 'बंद है')}</span>
            </div>

            {/* Language Selector Button */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className={cn(
                "p-2 rounded-full active:scale-95 transition-all relative group",
                darkMode ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-slate-800"
              )}
              title="Change Language / भाषा बदलें"
              id="langToggleBtn"
            >
              <Globe className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-black text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap transition-all duration-200">
                {lang === 'en' ? 'हिन्दी' : 'English'}
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-2 rounded-full active:scale-95 transition-all",
                darkMode ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-slate-800"
              )}
              id="darkModeToggleBtn"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Direct Urgent Call Now CTA desktop */}
            <a 
              href="tel:+919058609674"
              className={cn(
                "hidden sm:flex items-center gap-1.5 font-bold text-xs py-2 px-4 rounded-full transition-all active:scale-95 border-2",
                darkMode 
                  ? "border-blue-500 text-blue-400 hover:bg-blue-500/10" 
                  : "border-blue-600 text-blue-600 hover:bg-blue-600/5"
              )}
            >
              <Phone className="w-3 h-3" />
              <span>Call operator</span>
            </a>

            {/* Hamburger Icon Mobile & Desktop Menu Bar */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "p-2 rounded-full transition-all",
                darkMode ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-slate-800"
              )}
              id="mobileMenuBtn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile & Desktop Glass Drawer Overlay Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 md:left-auto md:right-10 md:w-80 z-40 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-4 text-white"
          >
            <div className="flex flex-col gap-2">
              {[
                { id: 'home', en: 'Home', hi: 'मुख्य पृष्ठ' },
                { id: 'about', en: 'About OM ONLINE WORKS', hi: 'हमारे बारे में' },
                { id: 'services', en: 'Our Government Services', hi: 'सरकारी सेवाएं' },
                { id: 'why-us', en: 'Why Choose OM ONLINE', hi: 'हमें क्यों चुनें' },
                { id: 'tracker', en: 'Appointment Tracker', hi: 'बुकिंग ट्रैकर' },
                { id: 'reviews', en: 'Customer Testimonials', hi: 'समीक्षाएं' },
                { id: 'gallery', en: 'Shop Gallery', hi: 'गैलरी' },
                { id: 'contact', en: 'Contact & Support', hi: 'सम्पर्क करें' }
              ].map((tab) => (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    activeSection === tab.id ? "bg-orange-500 text-white font-bold" : "hover:bg-white/5 text-gray-300"
                  )}
                >
                  {lang === 'en' ? tab.en : tab.hi}
                </a>
              ))}
            </div>

            <hr className="border-white/10" />

            {/* Google Authentication Block inside Drawer */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
              {loadingAuth ? (
                <div className="text-xs text-slate-400 font-mono animate-pulse">Checking credentials...</div>
              ) : user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-8 h-8 rounded-full border border-white/20" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate text-white">{user.displayName || 'Authorized User'}</span>
                      <span className="text-[10px] text-slate-400 truncate font-mono">{user.email}</span>
                    </div>
                  </div>
                  {isAdminUser ? (
                    <span className="text-[10px] font-extrabold tracking-widest uppercase font-mono px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded self-start">
                      SYSTEM ADMIN
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold tracking-widest uppercase font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded self-start">
                      CLIENT MEMBER
                    </span>
                  )}
                  <button 
                    onClick={async () => {
                      await signOut(auth);
                      setMobileMenuOpen(false);
                    }}
                    className="mt-1 w-full py-1.5 rounded bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[11px] font-bold text-white uppercase tracking-wider font-mono text-center cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-300 font-medium leading-normal">
                    {lang === 'en' ? 'Sign in to sync your bookings and unlock updates' : 'अपनी बुकिंग सिंक करने के लिए लॉगिन करें'}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        const provider = new GoogleAuthProvider();
                        await signInWithPopup(auth, provider);
                      } catch (err) {
                        console.error(err);
                        alert("Google Sign-In failed.");
                      }
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-400 active:scale-95 transition-all text-xs font-bold text-white uppercase tracking-wide shrink-0 shadow-sm cursor-pointer"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>Login with Google</span>
                  </button>
                </div>
              )}
            </div>

            <hr className="border-white/10" />

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-mono">SUPPORT PHONE</span>
                <a href="tel:+919058609674" className="text-sm font-bold text-orange-400 hover:underline">+91 9058609674</a>
              </div>
              <a 
                href="tel:+919058609674"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-400"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* HERO SECTION - Video Background with Overlay */}
      <section 
        id="home" 
        className={cn(
          "relative z-0 w-full overflow-hidden transition-colors duration-300 min-h-[100dvh] md:min-h-0 md:aspect-video flex items-center justify-center pt-24 pb-12 md:py-0",
          darkMode ? "text-white" : "text-slate-900"
        )}
      >
        <div className="absolute inset-0 w-full h-full -z-20">
          {/* Video element block - drives the height of the section maintaining intrinsic aspect ratio */}
          <video
            src="https://res.cloudinary.com/dcv4uwpkt/video/upload/q_auto/f_auto/v1780146692/om_online_works_fpifnw.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Transparent dual-mode glass tint overlay for peak readability */}
          <div className={cn(
            "absolute inset-0 transition-all duration-300 backdrop-blur-[2px]",
            darkMode ? "bg-slate-950/45" : "bg-white/45"
          )}></div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl -z-10"></div>

        {/* Content container */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-center">
              
              {/* Centered Content Column */}
              <div className="lg:col-span-12 flex flex-col items-center text-center z-10 scale-90 sm:scale-100">
              
              {/* Google Ratings Trust Tag */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "inline-flex items-center gap-2 border rounded-full py-1.5 px-4 mb-6 shadow-sm",
                  darkMode 
                    ? "bg-white/5 border-white/10 text-white" 
                    : "bg-orange-50/40 border-orange-200/60 text-amber-900"
                )}
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className={cn("text-xs font-bold font-mono", darkMode ? "text-amber-400" : "text-amber-900")}>5.0 Google Rating</span>
                <span className="text-gray-300 font-normal">|</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">
                  {lang === 'en' ? 'Saharanpur\'s Finest' : 'सहारनपुर का सर्वश्रेष्ठ'}
                </span>
              </motion.div>

              {/* Title & Slogans */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="space-y-4 flex flex-col items-center"
              >
                <span className="text-xs md:text-sm font-bold tracking-widest text-blue-600 uppercase block font-mono text-center">
                  {lang === 'en' ? '✦ TRUSTED JAN SEVA KENDRA & CYBER CAFE ✦' : '✦ विश्वसनीय जन सेवा केंद्र एवं साइबर कैफे ✦'}
                </span>
                
                <h1 className={cn("text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none transition-colors duration-200 text-center max-w-4xl", darkMode ? "text-white" : "text-slate-900")}>
                  OM ONLINE WORKS <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-rose-500 to-blue-600">
                    ओम ऑनलाइन वर्क्स
                  </span>
                </h1>

                <p className={cn("text-base sm:text-lg lg:text-xl max-w-2xl font-normal mt-4 transition-colors duration-200 text-center", darkMode ? "text-slate-200" : "text-slate-700")}>
                  {lang === 'en' 
                    ? 'Government Services, Online Applications, Banking Services, Aadhaar Assistance, Passport Services, Income Tax filing, and more — All Under One Trustworthy Roof.'
                    : 'सरकारी सेवाएं, ऑनलाइन आवेदन, बैंकिंग सेवाएं, आधार सहायता, पासपोर्ट आवेदन, आयकर और जीएसटी सेवाएं — सब कुछ एक ही छत के नीचे बिल्कुल सुरक्षित रूप से।'
                  }
                </p>
              </motion.div>

              {/* Grid Features Checklist */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 my-8 w-full max-w-3xl place-items-center"
              >
                {[
                  { labelEn: "Trusted Service", labelHi: "विश्वसनीय सेवा" },
                  { labelEn: "Quick Processing", labelHi: "त्वरित प्रक्रिया" },
                  { labelEn: "Expert Operators", labelHi: "अनुभवी ऑपरेटर" },
                  { labelEn: "100% Satisfaction", labelHi: "पूर्ण संतुष्टि" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className={cn("text-xs md:text-sm font-semibold transition-colors duration-200 text-center", darkMode ? "text-slate-200" : "text-slate-700")}>
                      {lang === 'en' ? item.labelEn : item.labelHi}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Action Trigger Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4"
              >
                <a
                  href="#services"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 bg-transparent px-8 py-4 rounded-xl text-sm font-bold border-2 active:scale-[0.98] transition-all duration-300 w-full sm:w-auto",
                    darkMode 
                      ? "border-orange-500 text-orange-400 hover:bg-orange-500/10 shadow-lg shadow-orange-500/5" 
                      : "border-orange-600 text-orange-600 hover:bg-orange-600/5 shadow-lg shadow-orange-600/5"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Book Service Appointment' : 'अपॉइंटमेंट बुक करें'}</span>
                </a>

                <a
                  href="https://wa.me/919456411569"
                  target="_blank"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 bg-transparent font-bold text-sm px-8 py-4 rounded-xl border-2 active:scale-[0.98] transition-all duration-300 w-full sm:w-auto",
                    darkMode 
                      ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 shadow-lg shadow-emerald-500/5" 
                      : "border-emerald-600 text-emerald-600 hover:bg-emerald-600/5 shadow-lg shadow-emerald-600/5"
                  )}
                >
                  <Send className={cn("w-4 h-4", darkMode ? "text-emerald-400" : "text-emerald-600")} />
                  <span>{lang === 'en' ? 'Query on WhatsApp' : 'व्हाट्सएप पर पूछें'}</span>
                </a>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section 
        id="about" 
        className={cn(
          "py-20 border-y transition-colors duration-300", 
          darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-gray-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Statistics Bento Side Left */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                { count: "5.0", labelEn: "Google Rating", labelHi: "गूगल रेटिंग", icon: <Star className="w-6 h-6 fill-amber-400 text-amber-400" /> },
                { count: "6+", labelEn: "Verified Reviews", labelHi: "विश्वसनीय समीक्षाएं", icon: <Users className="w-6 h-6 text-blue-500" /> },
                { count: "20+", labelEn: "Digital Services", labelHi: "विभिन्न सेवाएं", icon: <Briefcase className="w-6 h-6 text-orange-500" /> },
                { count: "1000+", labelEn: "Happy Clients", labelHi: "संतुष्ट ग्राहक", icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> }
              ].map((stat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  key={i}
                  className={cn(
                    "p-6 rounded-2xl flex flex-col items-start gap-3 shadow-sm transition-all duration-300",
                    darkMode ? "dark-card-glass border border-white/10 hover:border-saffron/20" : "card-glass border border-orange-200/50 hover:border-saffron/40"
                  )}
                >
                  <div className="p-2.5 rounded-xl bg-orange-500/10 dark:bg-orange-500/5">{stat.icon}</div>
                  <div>
                    <h3 className={cn("text-2xl font-black tracking-tight font-mono", darkMode ? "text-white" : "text-slate-900")}>{stat.count}</h3>
                    <p className={cn("text-xs font-semibold mt-1", darkMode ? "text-slate-400" : "text-slate-600")}>
                      {lang === 'en' ? stat.labelEn : stat.labelHi}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* About Narrative Text Right */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                {lang === 'en' ? 'WELCOME TO OM ONLINE' : 'ओम ऑनलाइन में आपका स्वागत है'}
              </span>
              
              <h2 className={cn("text-3xl sm:text-4xl font-black tracking-tight leading-tight", darkMode ? "text-white" : "text-slate-900")}>
                {lang === 'en' ? 'About OM ONLINE WORKS (ओम ऑनलाइन वर्क्स)' : 'दुकान का पूरा परिचय'}
              </h2>

              <div className={cn("space-y-4 text-sm md:text-base leading-relaxed font-medium", darkMode ? "text-slate-200" : "text-slate-700")}>
                <p>
                  {lang === 'en'
                    ? "OM ONLINE WORKS is a trusted Jan Seva Kendra and Cyber Cafe located in Navin Nagar, Saharanpur. We provide a wide range of government, documentation, online application, taxation, banking and digital administrative services with fast processing and customer-focused, honest assistance."
                    : "ओम ऑनलाइन वर्क्स सहारनपुर के नवीन नगर (अंकित विहार) क्षेत्र में स्थित एक अत्यंत विश्वसनीय जन सेवा केंद्र और डिजिटल साइबर कैफे है। हम त्वरित प्रक्रिया और ग्राहक-केंद्रित सेवा के साथ सरकारी प्रमाण पत्र, ऑनलाइन फॉर्म, आयकर फाइलिंग, बैंक निकासी और विभिन्न डिजिटल प्रशासनिक सेवाएं प्रदान करते हैं।"
                  }
                </p>
                <p>
                  {lang === 'en'
                    ? "With years of practical experience and excellent Google rating customer reviews, we stand dedicated to helping citizens complete their diverse online works conveniently, securely and layout-perfectly without errors."
                    : "फर्जी दावों से इतर, हम प्रत्येक दस्तावेज की बारीकी से जांच कर त्रुटि रहित आवेदन सुनिश्चित करते हैं। सहारनपुर के नागरिकों के बीच हमारी गुणवत्ता और त्वरित प्रसंस्करण के कारण बेहतरीन साख है।"
                  }
                </p>
              </div>

              {/* Highlight point indicators */}
              <div className="space-y-3 pt-2">
                {[
                  { en: "Exact processing without form rejection risks", hi: "सटीक डेटा फीडिंग - फॉर्म रिजेक्ट होने का कोई खतरा नहीं।" },
                  { en: "High-grade laser printing and lamination safeguards", hi: "उत्कृष्ट लेजर प्रिंटिंग और दस्तावेज़ लेमिनेशन सुरक्षा।" },
                  { en: "Transparent charges & friendly computer operators", hi: "पारदर्शी शुल्क एवं बेहद मिलनसार कंप्यूटर ऑपरेटर।" }
                ].map((pt, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className={cn("text-xs md:text-sm font-semibold", darkMode ? "text-slate-200" : "text-slate-800")}>{lang === 'en' ? pt.en : pt.hi}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SERVICES AREA SECTION (With Live Search & Live Document checks) */}
      <section 
        id="services" 
        className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Headline Heading */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">
              {lang === 'en' ? 'Digital India Ecosystem' : 'डिजिटल सुविधा क्षेत्र'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {lang === 'en' ? 'Our Official CSC & Online Services' : 'हमारी प्रमुख सरकारी एवं साइबर सेवाएं'}
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              {lang === 'en'
                ? "Browse our catalogue of certified services. Filter by category or search below to see exactly what documents are required."
                : "हमारी प्रमाणित सेवाओं की सूची देखें। आवश्यक दस्तावेजों की जांच करें और एक क्लिक के साथ अपॉइंटमेंट बुक करें।"
              }
            </p>
          </div>

          {/* Interactive Live Search Block + Filter Categories (Advanced Feature) */}
          <div className="mb-10 max-w-4xl mx-auto space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={lang === 'en' ? "Search services (e.g. Income certificate, PF, Passport, ITR)..." : "सेवाएं खोजें (जैसे: आय प्रमाण पत्र, पीएफ, वाहन बीमा, जीएसटी)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base font-medium transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter buttons pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'all', en: 'All 25 Services', hi: 'सभी 25 सेवाएं' },
                { id: 'certificates', en: 'Certificates & Ration', hi: 'प्रमाणपत्र और राशन' },
                { id: 'tax', en: 'Tax, GST & FSSAI', hi: 'टैक्स, जीएसटी और लाइसेंस' },
                { id: 'career', en: 'Careers & Forms', hi: 'सरकारी नौकरी व फॉर्म' },
                { id: 'banking', en: 'Banking & PF', hi: 'बैंकिंग और पीएफ' },
                { id: 'other', en: 'Other Typing & Misc', hi: 'अन्य टाइपिंग व विविध' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all border",
                    activeCategory === category.id 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900" 
                      : "bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 text-slate-700 dark:text-gray-300 border-transparent"
                  )}
                >
                  {lang === 'en' ? category.en : category.hi}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Services Results */}
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  key={service.id}
                  className={cn(
                    "flex flex-col rounded-2xl overflow-hidden p-6 hover:shadow-xl relative group shadow-sm justify-between transition-all duration-300",
                    darkMode ? "dark-card-glass border border-white/5 hover:border-saffron/30" : "card-glass border border-white/40 hover:border-saffron/50"
                  )}
                >
                  {/* Category Accent Stripe */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1.5",
                    service.category === 'certificates' ? "bg-orange-500" :
                    service.category === 'tax' ? "bg-blue-600" :
                    service.category === 'career' ? "bg-violet-600" :
                    service.category === 'banking' ? "bg-emerald-500" : "bg-gray-400"
                  )}></div>

                  <div className="space-y-4">
                    {/* Header Name & Translation */}
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {service.nameEn}
                      </h3>
                      <p className="text-xs font-bold text-orange-600 font-hindi mt-0.5">
                        {service.nameHi}
                      </p>
                    </div>

                    {/* Desc */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {lang === 'en' ? service.descEn : service.descHi}
                    </p>

                    {/* Required documents section */}
                    <div className="bg-gray-50 dark:bg-slate-950/80 rounded-xl p-3 border border-gray-100 dark:border-slate-800/60">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono block mb-2">
                        📋 {lang === 'en' ? 'Required Documents:' : 'आवश्यक दस्तावेज:'}
                      </span>
                      <ul className="space-y-1.5">
                        {(lang === 'en' ? service.documentsEn : service.documentsHi).map((doc, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/80 shrink-0 mt-1.5"></span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Booking Trigger Trigger */}
                  <div className="pt-6 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase py-1 px-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {service.category}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setUploadedFiles([]);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>{lang === 'en' ? 'Book Appointment' : 'आवेदन भरें'}</span>
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Zero Results Handle */}
            {filteredServices.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-base font-bold">{lang === 'en' ? 'No Service Found' : 'कोई सेवा नहीं मिली'}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en' ? 'Try checking spelling or choose the "All" filter.' : 'कृपया वर्तनी की जांच करें या "सभी" फ़िल्टर चुनें।'}
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  {lang === 'en' ? 'Reset Filters' : 'फ़िल्टर रीसेट करें'}
                </button>
              </div>
            )}
          </motion.div>

        </div>
      </section>


      {/* WHY CHOOSE US SECTION */}
      <section 
        id="why-us" 
        className={cn(
          "py-20 border-y transition-colors duration-300",
          darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-100 border-gray-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Descriptive Content Left */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                {lang === 'en' ? 'Core Qualities' : 'हमारी विशेषता और साख'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {lang === 'en' ? 'Why Saharanpur Trusts OM ONLINE WORKS' : 'सहारनपुर के नागरिक हमें ही क्यों चुनते हैं?'}
              </h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-gray-300 font-normal">
                {lang === 'en'
                  ? "We don't just fill forms. We manage documents securely, review application details comprehensively with the client, and charge honestly as per government guidelines."
                  : "हम सिर्फ फॉर्म नहीं भरते, बल्कि प्रत्येक नागरिक की जरूरतों को समझकर उन्हें सही सरकारी सहायता और त्रुटि रहित सेवा सुनिश्चित करते हैं।"
                }
              </p>

              <div className="pt-4">
                <a 
                  href="tel:+919058609674"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-950 font-bold text-xs py-3.5 px-6 rounded-xl transition-all"
                >
                  <Phone className="w-3.5 h-3.5 animate-bounce" />
                  <span>{lang === 'en' ? 'Talk to Deepak Soni (Owner)' : 'मालिक दीपक सोनी से बात करें'}</span>
                </a>
              </div>
            </div>

            {/* Core Pillars grid right */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { tEn: "Fast Processing", tHi: "त्वरित प्रक्रिया", dEn: "Instant form filing and certificate registrations keeping timelines ahead.", dHi: "त्वरित फॉर्म सबमिशन और कम से कम समय में कार्य पूरा करना।", ic: <Clock className="w-5 h-5 text-orange-500" /> },
                { tEn: "Affordable Charges", tHi: "किफायती शुल्क", dEn: "Honest nominal fee list tailored with government standards. No hidden markup.", dHi: "सरकारी मानकों के अनुसार बिल्कुल पारदर्शी और नाममात्र सेवा शुल्क।", ic: <Award className="w-5 h-5 text-blue-500" /> },
                { tEn: "Government Expertise", tHi: "सरकारी सेवा निपुणता", dEn: "Profound understanding of e-District UP, CSC portals, FSSAI rules, ITR filing.", dHi: "ई-डिस्ट्रिक्ट यूपी, केंद्रीय और उत्तर प्रदेश सरकार के सभी पोर्टल्स का व्यापक ज्ञान।", ic: <Shield className="w-5 h-5 text-emerald-500" /> },
                { tEn: "Secure Documentation", tHi: "सुरक्षित दस्तावेज", dEn: "Complete privacy constraints for personal Aadhaar, family income logs, and PAN.", dHi: "व्यक्तिगत आधार, महत्वपूर्ण फाइलों और पासवर्ड्स की पूर्ण गोपनीयता और सुरक्षा।", ic: <LockIcon className="w-5 h-5 text-violet-500" /> }
              ].map((item, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-6 rounded-xl transition-all hover:translate-x-1 transition-all duration-300 border",
                    darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
                  )}
                >
                  <div className="p-2 w-9 h-9 rounded-lg bg-orange-500/10 mb-4 flex items-center justify-center">{item.ic}</div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'en' ? item.tEn : item.tHi}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {lang === 'en' ? item.dEn : item.dHi}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* CUSTOMER PORTAL APPOINTMENT TRACKER SECTION (Advanced Feature) */}
      <section 
        id="tracker" 
        className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
              {isAdminUser ? 'Admin Portal Dashboard' : (lang === 'en' ? 'Client Area' : 'सैकड़ों ग्राहकों का भरोसा')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isAdminUser 
                ? (lang === 'en' ? 'System Client Database' : 'प्रणाली ग्राहक डेटाबेस (प्रशासक)')
                : (lang === 'en' ? 'Interactive Appointment Status' : 'सक्रिय अपॉइंटमेंट ट्रैकर')}
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-normal">
              {isAdminUser 
                ? (lang === 'en' 
                    ? `You are signed in as deep-level system administrator. Managing ${myBookings.length} total cloud bookings and customer uploaded records.`
                    : `आप व्यवस्थापक के रूप में लॉग इन हैं। कुल ${myBookings.length} अपॉइंटमेंट्स और क्लाइंट फाइलों का डेटाबेस।`)
                : (lang === 'en'
                    ? "Locally saved list of appointments submitted during this browser session or synced from your account. Helps query status from our team."
                    : "इस ब्राउज़र में या आपके खाते से सिंक किए गए आवेदनों की स्थिति। इसका उपयोग हमारे केंद्र पर सत्यापन के लिए करें।"
                  )}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <div 
                    key={b.id} 
                    className={cn(
                      "p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm transition-all duration-300 border",
                      darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-extrabold tracking-mono px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded">
                          ID: {b.id}
                        </span>
                        <span className="text-xs text-gray-500">{b.date}</span>
                        {b.email && (
                          <span className="text-xs font-mono text-gray-400 truncate max-w-[200px]" title={b.email}>
                            {b.email}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">{b.serviceName}</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-450 mt-1 font-semibold">
                        {lang === 'en' ? 'Client' : 'आवेदक'}: {b.customerName} | <a href={`tel:${b.phone}`} className="text-orange-500 hover:underline">{b.phone}</a>
                      </p>
                      
                      {/* Document Download & view row for Admins vs standard clients */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 font-mono tracking-wider block mb-1">
                          {lang === 'en' ? 'PROVIDED DOCUMENTS' : 'दिए गए दस्तावेज'}
                        </span>
                        {b.fileObjects && b.fileObjects.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {b.fileObjects.map((f, index) => (
                              <button
                                key={index}
                                onClick={() => downloadBase64File(f.base64, f.name)}
                                className="text-[10px] uppercase font-bold tracking-wider font-mono bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 py-1.5 px-3 rounded-lg border border-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                title={lang === 'en' ? "Click to download document" : "दस्तावेज डाउनलोड करें"}
                              >
                                <Upload className="w-3.5 h-3.5 shrink-0 rotate-180 text-orange-500" />
                                {f.name}
                              </button>
                            ))}
                          </div>
                        ) : b.files && b.files.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {b.files.map((f, index) => (
                              <span key={index} className="text-[10px] bg-gray-200/60 dark:bg-slate-800 py-0.5 px-2 rounded flex items-center gap-1">
                                <FileText className="w-3 h-3 text-gray-500" />
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 dark:text-slate-550 italic">
                            {lang === 'en' ? 'No custom attachments provided.' : 'कोई अटैचमेंट प्रदान नहीं किया गया।'}
                          </p>
                        )}
                      </div>

                      {b.notes && (
                        <div className="mt-2.5 p-2 rounded bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            <strong>{lang === 'en' ? 'Notes' : 'टिप्पणी'}:</strong> {b.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                      {isAdminUser ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 font-mono tracking-wider uppercase">CHANGE STATUS</span>
                          <select
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                            className={cn(
                              "text-xs px-2 py-1.5 rounded border bg-transparent font-bold cursor-pointer font-sans focus:outline-none focus:ring-1 focus:ring-orange-500",
                              darkMode ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                            )}
                          >
                            <option value="Pending Review">Pending Review</option>
                            <option value="Processing">Processing</option>
                            <option value="Documents Verified">Documents Verified</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Status Indicator</span>
                          <span className={cn(
                            "text-xs font-extrabold py-1 px-3 rounded-full inline-block mt-1 font-mono",
                            b.status === 'Completed' ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
                            b.status === 'Processing' ? "text-blue-600 dark:text-blue-400 bg-blue-500/10" :
                            b.status === 'Documents Verified' ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" :
                            "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                          )}>
                            {b.status}
                          </span>
                        </div>
                      )}
                      
                      {isAdminUser ? (
                        <button 
                          onClick={() => deleteBookingAdmin(b.id)}
                          className="p-2.5 rounded-full text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all text-xs cursor-pointer" 
                          title="Delete Permanent Database Entry"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => cancelTrackedBooking(b.id)}
                          className="p-2.5 rounded-full text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all text-xs cursor-pointer" 
                          title="Remove tracking"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-6">
                <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  {lang === 'en' ? 'No Active Session Bookings Found' : 'हाल के अपॉइंटमेंट्स नहीं मिले।'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  {lang === 'en'
                    ? "Book an appointment for any service up above! They will be tracked here in real-time."
                    : "ऊपर दी गई किसी सेवा के लिए अपॉइंटमेंट बुक करें! आपके आवेदन यहां वास्तविक समय में सहेज लिए जाएंगे।"
                  }
                </p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* TEAM SECTION */}
      <section 
        id="team" 
        className={cn(
          "py-20 border-y transition-colors duration-300",
          darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-100 border-gray-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">
              {lang === 'en' ? 'Our Expert Operators' : 'हमारे कुशल कंप्यूटर ऑपरेटर'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {lang === 'en' ? 'Meet Our Skilled Team' : 'सहारनपुर के अनुभवी आईटी ऑपरेटर'}
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              {lang === 'en'
                ? "Qualified, friendly desk operators ready to help download, type, verify, and submit your official files."
                : "आपकी हिंदी एवं अंग्रेजी टाइपिंग, आधार, पीएफ और सरकारी ऑनलाइन फॉर्म्स के त्वरित सबमिशन के लिए समर्पित टीम।"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Owner - Deepak Soni */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className={cn(
                "p-6 rounded-2xl text-center relative overflow-hidden group shadow-md transition-all duration-300 border",
                darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-rose-500"></div>
              
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full mx-auto flex items-center justify-center font-bold text-xl mb-4 shadow border border-orange-200 dark:border-orange-500/10">
                DS
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deepak Soni</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mt-1">Founder / Owner</p>
              
              <p className="text-xs text-slate-500 mt-4 leading-relaxed font-normal">
                {lang === 'en' 
                  ? "Main supervisor handling premium registrations, banking authorizations and local compliance." 
                  : "मुख्य संचालक - सभी बड़ी ऑनलाइन बैंकिंग, टैक्स, और सरकारी योजनाओं के सत्यापन कर्ता।"
                }
              </p>

              <hr className="my-5 border-gray-100 dark:border-slate-800" />
              
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">CONTACT</span>
                <a href="tel:+919058609674" className="text-xs font-extrabold flex items-center gap-1 hover:underline text-blue-600 dark:text-blue-400">
                  <Phone className="w-3.5 h-3.5" />
                  +91 9058609674
                </a>
              </div>
            </motion.div>

            {/* Operator 1 - Vinay Soni */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className={cn(
                "p-6 rounded-2xl text-center relative overflow-hidden group shadow-md transition-all duration-300 border",
                darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>
              
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full mx-auto flex items-center justify-center font-bold text-xl mb-4 shadow border border-blue-200 dark:border-blue-500/10">
                VS
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vinay Soni</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-1">Computer Operator</p>
              
              <p className="text-xs text-slate-500 mt-4 leading-relaxed font-normal">
                {lang === 'en' 
                  ? "IT specialist centered on fast job registrations, results printing, exam forms and PDF downloads." 
                  : "आईटी विशेषज्ञ - विभिन्न परीक्षा फॉर्म भर्ती, एडमिट कार्ड डाउनलोड और तेज़ प्रिंटिंग सेवाएं।"
                }
              </p>

              <hr className="my-5 border-gray-100 dark:border-slate-800" />
              
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">CONTACT</span>
                <a href="tel:+917037084000" className="text-xs font-extrabold flex items-center gap-1 hover:underline text-blue-600 dark:text-blue-400">
                  <Phone className="w-3.5 h-3.5" />
                  +91 7037084000
                </a>
              </div>
            </motion.div>

            {/* Operator 2 - Satyam Verma */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className={cn(
                "p-6 rounded-2xl text-center relative overflow-hidden group shadow-md transition-all duration-300 border",
                darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-violet-600"></div>
              
              <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-full mx-auto flex items-center justify-center font-bold text-xl mb-4 shadow border border-violet-200 dark:border-violet-500/10">
                SV
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Satyam Verma</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mt-1">Computer Operator</p>
              
              <p className="text-xs text-slate-500 mt-4 leading-relaxed font-normal">
                {lang === 'en' 
                  ? "Lead Hindi & English typing editor, passport documentation and secure PF settlement support." 
                  : "क्वालिटी टाइपिस्ट - दस्तावेजों के हिंदी/अंग्रेजी अनुवाद, पासपोर्ट और पीएफ निकासी सलाहकार।"
                }
              </p>

              <hr className="my-5 border-gray-100 dark:border-slate-800" />
              
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">CONTACT</span>
                <a href="tel:+919456411569" className="text-xs font-extrabold flex items-center gap-1 hover:underline text-blue-600 dark:text-blue-400">
                  <Phone className="w-3.5 h-3.5" />
                  +91 9456411569
                </a>
              </div>
            </motion.div>

          </div>

        </div>
      </section>


      {/* REVIEWS SECTION - Google rating style slide transition */}
      <section 
        id="reviews" 
        className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                {lang === 'en' ? 'Satisfied Citizens' : 'संतुष्ट ग्राहकों की बातें'}
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                {lang === 'en' ? 'Overall 5.0 Rating — 6 Verified Reviews' : 'कुल रेटिंग 5.0 — 6 प्रामाणिक समीक्षाएं'}
              </h2>
            </div>

            {/* Total Badge Scorecard */}
            <div className="bg-amber-500/10 border border-amber-500/20 py-3 px-6 rounded-2xl flex items-center gap-2">
              <span className="text-3xl font-black text-amber-500 font-mono">5.0</span>
              <div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">Verified Google Profile</span>
              </div>
            </div>
          </div>

          {/* Testimonial Cards Layout - Side-by-Side Scrolling Flex */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Mahesh Soni",
                text: "“GREAT WORK AND CUSTOMER SATISFACTION”",
                date: "Verified Reviewer"
              },
              {
                name: "Abhishek Bhardwaj",
                text: "“Very helpful as they review and double check every document before final submit. Recomended.”",
                date: "Local Resident"
              },
              {
                name: "Sitesh Kumar",
                text: "“Online forms best service in saharanpur area with reasonable price.”",
                date: "Student Customer"
              }
            ].map((usr, i) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={i}
                className={cn(
                  "p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 border",
                  darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
                )}
              >
                <div>
                  <div className="flex text-amber-400 gap-0.5 mb-4">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-sm italic text-gray-700 dark:text-gray-300">
                    {usr.text}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-slate-800/80">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 flex items-center justify-center font-extrabold text-sm">
                    {usr.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{usr.name}</h4>
                    <span className="text-[10px] text-gray-400">{usr.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* GALLERY SECTION */}
      <section 
        id="gallery" 
        className={cn(
          "py-20 border-y transition-colors duration-300",
          darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-gray-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
              {lang === 'en' ? 'Photos & Infrastructure' : 'गैलरी और इंफ्रास्ट्रक्चर'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {lang === 'en' ? 'Our Shop & Workstation Gallery' : 'हमारे केंद्र की वास्तविक झलक'}
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400">
              {lang === 'en'
                ? "See real visual insights of OM ONLINE WORKS including our service zones."
                : "हमारे सहारनपुर केंद्र की वास्तविक तस्वीरें, फ्रंट व्यू एवं आधुनिक कंप्यूटर डेस्क की झलक देखें।"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                titleEn: "Shop Front View",
                titleHi: "दुकान का मुख्य द्वार",
                path: "/src/assets/images/shop_front_view_1780151941685.png",
                cat: "Exterior"
              },
              {
                titleEn: "Service Board",
                titleHi: "सेवा सूची बोर्ड",
                path: "/src/assets/images/service_board_view_1780152000905.png",
                cat: "Catalog Sign"
              },
              {
                titleEn: "Office Interior",
                titleHi: "कार्यालय आंतरिक कक्ष",
                path: "/src/assets/images/office_interior_view_1780151960409.png",
                cat: "Working Desks"
              },
              {
                titleEn: "Customer Service Area",
                titleHi: "ग्राहक सेवा क्षेत्र",
                path: "/src/assets/images/customer_service_view_1780151980979.png",
                cat: "Lounge Area"
              }
            ].map((img, idx) => (
              <motion.div
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                  setLightboxImage(img.path);
                  setLightboxTitle(lang === 'en' ? img.titleEn : img.titleHi);
                }}
                key={idx}
                className={cn(
                  "rounded-2xl overflow-hidden border p-3 cursor-zoom-in group shadow-sm bg-white dark:bg-slate-900",
                  darkMode ? "border-slate-800" : "border-gray-200"
                )}
              >
                <div className="h-48 rounded-xl overflow-hidden relative">
                  <Image
                    src={img.path}
                    alt={img.titleEn}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-slate-900/80 text-white rounded-full text-[9px] font-bold font-mono tracking-wider">
                    {img.cat}
                  </div>
                </div>
                <div className="pt-3 px-1">
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">{lang === 'en' ? img.titleEn : img.titleHi}</h4>
                  <span className="text-[10px] text-gray-500 font-mono">Verified Center Asset</span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* LIGHTBOX MODAL CONTAINER */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setLightboxImage(null); setLightboxTitle(null); }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button className="absolute top-5 right-5 text-white/70 hover:text-white p-2.5 bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl w-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-h-[75vh] rounded-xl overflow-hidden">
                <Image
                  src={lightboxImage}
                  alt={lightboxTitle || "Gallery Fullscreen"}
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              {lightboxTitle && (
                <span className="text-white text-base font-extrabold tracking-wide tracking-tight">
                  {lightboxTitle}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* FAQ ACCORDION SECTION */}
      <section className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">
              {lang === 'en' ? 'Information Hub' : 'आम पूछे जाने वाले प्रश्न'}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {lang === 'en' ? 'Frequently Asked Questions' : 'संशय दूर करें - ज़रूरी सवाल'}
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS_DATA.map((faq, i) => (
              <FaqAccordionItem 
                key={i} 
                q={lang === 'en' ? faq.qEn : faq.qHi} 
                a={lang === 'en' ? faq.aEn : faq.aHi} 
                darkMode={darkMode}
              />
            ))}
          </div>

        </div>
      </section>


      {/* CONTACT DETAILS SECTION */}
      <section 
        id="contact" 
        className={cn(
          "py-20 border-t transition-colors duration-300",
          darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Action Cards Left */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-mono">
                  {lang === 'en' ? 'Get in Touch' : 'संपर्क सूची'}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  {lang === 'en' ? 'OM ONLINE WORKS Contact Desk' : 'हमसे सीधा संपर्क करें'}
                </h2>
              </div>

              <div className="space-y-4">
                
                {/* Office Info card */}
                <div className={cn("p-5 rounded-2xl flex gap-4 shadow-sm transition-all duration-300 border", darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40")}>
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xs md:text-sm font-extrabold text-gray-500 uppercase tracking-wider font-mono">Address</h4>
                    <p className="text-sm font-semibold mt-1">
                      Unnamed Road, Ankit Vihar,<br />
                      Navin Nagar, Saharanpur,<br />
                      Uttar Pradesh - 247001
                    </p>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 block mt-1.5 font-mono">
                      Plus Code: XG2J+PX Saharanpur
                    </span>
                  </div>
                </div>

                {/* Direct Dial Cards */}
                <div className={cn("p-5 rounded-2xl flex gap-4 shadow-sm transition-all duration-300 border", darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40")}>
                  <Phone className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xs md:text-sm font-extrabold text-gray-500 uppercase tracking-wider font-mono">CALL SUPPORT</h4>
                    <p className="text-sm font-bold mt-1 text-slate-900 dark:text-white">
                      <a href="tel:+919058609674" className="hover:underline">+91 9058609674</a> (Deepak Soni)
                    </p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-gray-400 mt-1">
                      Vinay Soni: <a href="tel:+917037084000" className="hover:underline">+91 7037084000</a>
                    </p>
                  </div>
                </div>

                {/* Email Support Card */}
                <div className={cn("p-5 rounded-2xl flex gap-4 shadow-sm transition-all duration-300 border", darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40")}>
                  <Mail className="w-5 h-5 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xs md:text-sm font-extrabold text-gray-500 uppercase tracking-wider font-mono">EMAIL ADDRESS</h4>
                    <p className="text-sm font-semibold mt-1">
                      <a href="mailto:dsoni4715@gmail.com" className="hover:underline text-blue-600 dark:text-blue-400 font-mono">dsoni4715@gmail.com</a>
                    </p>
                  </div>
                </div>

                {/* Core buttons actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <a 
                    href="tel:+919058609674"
                    className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                  
                  <a 
                    href="https://wa.me/919456411569"
                    target="_blank"
                    className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4 fill-white text-emerald-600" />
                    <span>WhatsApp Now</span>
                  </a>

                  <a 
                    href="https://maps.google.com/?q=29.9674,77.5512"
                    target="_blank"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-950 font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Get GPS Directions</span>
                  </a>
                </div>

              </div>
            </div>

            {/* Embedded Google Maps right side */}
            <div id="location" className="lg:col-span-7 w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-xl relative">
              <iframe
                title="OM ONLINE WORKS GPS Location Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3455.5123984029272!2s77.5512!3d29.9674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390eeede0ee1130d%3A0xe54d6df1b3a3224b!2sSaharanpur%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1780151941"
                className="absolute inset-0 w-full h-full border-0 grayscale dark:invert"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

          </div>
        </div>
      </section>

      
      {/* SMART APPOINTMENT FORM POPUP MODAL (Highly Featured popup for every service) */}
      <AnimatePresence>
        {selectedService && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-xl rounded-2xl border shadow-2xl p-6 relative overflow-hidden flex flex-col gap-4 my-8 max-h-[90vh]",
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-gray-200 text-slate-900"
              )}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between border-b pb-4 border-gray-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 font-mono">
                    {lang === 'en' ? 'Smart CSC Booking' : 'सुसज्जित डिजिटल अपॉइंटमेंट'}
                  </span>
                  <h3 className="text-lg md:text-xl font-extrabold tracking-tight mt-1">
                    {lang === 'en' ? 'Book Appointment' : 'नया आवेदन विवरण भरें'}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs font-bold bg-blue-500/15 text-blue-600 py-0.5 px-2.5 rounded">
                      {selectedService.nameEn}
                    </span>
                    <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                      {selectedService.nameHi}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedService(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic documents hint */}
              <div className="bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl">
                <span className="text-xs font-extrabold text-orange-600 flex items-center gap-1 mb-1">
                  📋 {lang === 'en' ? 'Required Documents for verification:' : 'सत्यापन के लिए अनिवार्य दस्तावेज:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {(lang === 'en' ? selectedService.documentsEn : selectedService.documentsHi).map((doc, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-gray-100 dark:bg-slate-950 py-1 px-2.5 rounded border border-gray-200/50 dark:border-slate-800/50">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Success state info */}
              {formSuccessMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 font-bold text-xs text-center flex flex-col gap-1 items-center animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {/* Booking Scrollable form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {lang === 'en' ? 'YOUR FULL NAME' : 'आपका पूरा नाम'} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={lang === 'en' ? "e.g. Ramesh Kumar" : "उदा. रमेश कुमार"}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {lang === 'en' ? 'MOBILE PHONE NUMBER' : 'मोबाइल नंबर'} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder={lang === 'en' ? "e.g. +91 9058609674" : "उदा. 9058609674"}
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {lang === 'en' ? 'EMAIL ADDRESS (OPTIONAL)' : 'ईमेल पता (वैकल्पिक)'}
                  </label>
                  <input 
                    type="email" 
                    placeholder={lang === 'en' ? "e.g. ramesh@gmail.com" : "उदा. ramesh@gmail.com"}
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  />
                </div>

                {/* Document Upload Area (Meets file upload requirements) */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {lang === 'en' ? 'UPLOAD DOCUMENTS (PDF/JPG/PNG)' : 'दस्तावेज अपलोड करें'}
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center gap-1.5",
                      isDragging 
                        ? "border-orange-500 bg-orange-500/5 scale-[0.99]" 
                        : "border-gray-200 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/20 hover:border-orange-500/40"
                    )}
                  >
                    <Upload className="w-6 h-6 text-orange-500/80 mb-1" />
                    <span className="text-xs font-bold">
                      {lang === 'en' ? 'Drag & Drop files or Click to manual browse' : 'दस्तावेज़ खींचकर डालें या ब्राउज़ करने के लिए क्लिक करें'}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-mono">Accepts: .pdf, .jpg, .jpeg, .png</span>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden" 
                      multiple 
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {/* Upload progress & list of documents */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1.5 mt-3 bg-gray-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono block">Selected Scans:</span>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-2 rounded-lg">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                            <span className="truncate max-w-[200px] font-semibold">{file.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold text-emerald-500 shrink-0">
                              {uploadProgress[file.name] || 0}%
                            </span>
                            <button 
                              type="button"
                              onClick={() => removeFile(file.name)}
                              className="p-1 rounded-full text-rose-500 hover:bg-rose-550/10"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    {lang === 'en' ? 'ADDITIONAL NOTES / SPECIFIC DIRECTIONS' : 'अतिरिक्त संदेश'}
                  </label>
                  <textarea 
                    rows={2}
                    placeholder={lang === 'en' ? "e.g. Please check my Ration category, or double-check typing layout..." : "उदा. कृपया राशन श्रेणी जांच लें या टाइपिंग लेआउट अवश्य देखें..."}
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Submit action panel */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setSelectedService(null)}
                    className="px-4 py-2 text-xs font-bold rounded-xl hover:bg-gray-150/40 text-slate-500"
                  >
                    {lang === 'en' ? 'Cancel' : 'निरस्त'}
                  </button>
                  <button 
                    type="submit"
                    disabled={uploadingStatus}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Submit to WhatsApp Operator' : 'व्हाट्सएप ऑपरेटर को भेजें'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* LANDING FOOTER */}
      <footer className={cn(
        "py-16 text-white border-t transition-colors",
        darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-900 border-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1 - Brand Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-blue-500 flex items-center justify-center font-bold font-mono text-slate-950 text-xs">OM</div>
                <span className="font-extrabold tracking-tight text-white text-base">OM ONLINE WORKS</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {lang === 'en'
                  ? "Premium certified Jan Seva Kendra and full-tech cyber cafe situated in Navin Nagar Saharanpur. Secure, precise form submission guaranteed."
                  : "अंकित विहार नवीन नगर सहारनपुर का अग्रणी डिजिटल सेवा केंद्र। तीव्र गति एवं त्रुटि रहित सरकारी ऑनलाइन कार्यों की पूर्ण गारंटी।"}
              </p>
              
              <div className="flex text-amber-500 items-center gap-1 text-xs font-bold font-mono">
                <span>⭐ Open Daily Till 9:30 PM</span>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-orange-400 font-mono mb-4">
                {lang === 'en' ? 'Quick Links' : 'त्वरित सूची'}
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li><a href="#home" className="hover:text-white hover:underline transition-all">{lang === 'en' ? 'Back to Home' : 'मुख्य पृष्ठ'}</a></li>
                <li><a href="#about" className="hover:text-white hover:underline transition-all">{lang === 'en' ? 'About OM ONLINE' : 'हमारे बारे में'}</a></li>
                <li><a href="#services" className="hover:text-white hover:underline transition-all">{lang === 'en' ? 'All CSC Services' : 'सभी सर्विसेज'}</a></li>
                <li><a href="#tracker" className="hover:text-white hover:underline transition-all">{lang === 'en' ? 'Check Appointment Logs' : 'बुकिंग ट्रैकर'}</a></li>
                <li><a href="#faq" className="hover:text-white hover:underline transition-all">{lang === 'en' ? 'General Help FAQ' : 'पूछे जाने वाले प्रश्न'}</a></li>
              </ul>
            </div>

            {/* Column 3 - Fast Services short Index */}
            <div>
              <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-orange-400 font-mono mb-4">
                {lang === 'en' ? 'Fast Services' : 'त्वरित आवेदन सूची'}
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>• Income Certificate (आय प्रमाण पत्र)</li>
                <li>• Family Caste Certificate (जाति)</li>
                <li>• Domicile Dwell Certificate (निवास)</li>
                <li>• EPFO PF Withdrawals (भविष्य निधि)</li>
                <li>• Online Recruitment Filling (Sarkari Naukri)</li>
                <li>• Passport & Visa assist (पासपोर्ट)</li>
              </ul>
            </div>

            {/* Column 4 - Direct Contact details */}
            <div>
              <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-orange-400 font-mono mb-4">
                {lang === 'en' ? 'Urgent Inquiries' : 'त्वरित पूछ-ताछ'}
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Call: <a href="tel:+919058609674" className="hover:underline font-semibold">+91 9058609674</a></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 fill-slate-300 text-slate-900 shrink-0" />
                  <span>WhatsApp: <a href="https://wa.me/919456411569" className="hover:underline font-semibold font-mono">+91 9456411569</a></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Email: <a href="mailto:dsoni4715@gmail.com" className="hover:underline font-mono">dsoni4715@gmail.com</a></span>
                </p>
                <p className="text-[10px] text-zinc-500 font-mono pt-2">
                  Address: Ankit Vihar, Navin Nagar, Saharanpur, UP - 247001
                </p>
              </div>
            </div>

          </div>

          <hr className="my-8 border-slate-800" />

          {/* SubFooter copyrights */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-normal">
            <span>
              Copyright © 2026 OM ONLINE WORKS. All Rights Reserved.
            </span>
            <span className="font-mono">
              Designed for Saharanpur Local SEO Rank
            </span>
          </div>

        </div>
      </footer>


      {/* FLOATING ACTION PILLS MOBILE/DESKTOP */}
      
      {/* Floating Back to top button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-5 z-40 bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-3 rounded-full hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm border border-white/20"
          id="backToTopBtn"
          title="Back to Top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Floating Action WhatsApp and Call Side buttons bottom corners */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
        <a
          href="tel:+919058609674"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          title="Call OM ONLINE Operator Now"
        >
          <Phone className="w-5 h-5 fill-current" />
        </a>
      </div>

      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <a
          href="https://wa.me/919456411569"
          target="_blank"
          className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-4 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          title="Direct WhatsApp Operator"
        >
          <Send className="w-5 h-5 fill-white text-emerald-500" />
        </a>
      </div>

    </div>
  );
}

// Custom lock icon due to name conflicts with security items
function LockIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Simple Accordion Item Component
function FaqAccordionItem({ q, a, darkMode }: { q: string, a: string, darkMode: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border",
      darkMode ? "dark-card-glass border-white/5" : "card-glass border-white/40"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-sm md:text-base outline-none hover:bg-orange-500/5 transition-all"
      >
        <span className="text-[13px] md:text-base text-slate-900 dark:text-white">{q}</span>
        <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-300 text-gray-500", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-gray-100 dark:border-slate-800"
          >
            <div className="p-5 text-xs md:text-sm text-slate-600 dark:text-gray-300 leading-relaxed font-normal bg-orange-500/[0.01]">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
