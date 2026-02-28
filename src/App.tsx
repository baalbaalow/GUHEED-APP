/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  Send, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Languages,
  Download,
  Sparkles,
  ChevronRight,
  ShoppingCart,
  Phone,
  Tag,
  Box,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

type Language = 'en' | 'so';

interface ProductDetails {
  name: string;
  specs: string;
  condition: string;
  oldPrice: string;
  newPrice: string;
  contact: string;
}

type AppState = 'idle' | 'analyzing' | 'gathering' | 'generating' | 'ready' | 'editing';

// --- Constants ---

const TRANSLATIONS = {
  en: {
    title: "GUHEED",
    subtitle: "E-commerce Flyer Architect",
    greeting: "Hello! I'm your Flyer Architect. Please upload a photo of your product to get started.",
    uploadPrompt: "Click or drag a product photo here",
    cameraPrompt: "Take a photo",
    analyzing: "Analyzing your product...",
    gatheringTitle: "Product Details",
    gatheringSubtitle: "Please confirm or fill in the details below:",
    labels: {
      name: "Product Name",
      specs: "Key Specifications",
      condition: "Condition",
      oldPrice: "Old Price",
      newPrice: "New Sale Price",
      contact: "Contact Info / Store Name"
    },
    placeholders: {
      name: "e.g., iPhone 12 Pro Max",
      specs: "e.g., 256GB Storage, 100% Battery",
      condition: "e.g., Boxed, Used, Used like new,",
      oldPrice: "e.g., $800",
      newPrice: "e.g., $650",
      contact: "e.g. GUHEED, +252-61XXXXX.."
    },
    generateBtn: "Generate Flyer",
    generating: "Crafting your professional flyer...",
    readyTitle: "Your Flyer is Ready!",
    editPrompt: "Want to change something? Try: 'Add a red discount badge' or 'Make it look more premium'",
    editBtn: "Apply Edit",
    editing: "Updating flyer...",
    reset: "Start New Flyer",
    download: "Download Flyer"
  },
  so: {
    title: "GUHEEDe",
    subtitle: "Naqshadeeyaha Flyer-ka Ganacsigaga",
    greeting: "Haye! Waxaan ahay naqshadeeyahaaga flyer-ka. Fadlan soo geli sawirka alaabtaada si aan u bilaowno.",
    uploadPrompt: "Guji ama halkan ku soo tuur sawirka alaabta",
    cameraPrompt: "Sawir qaad",
    analyzing: "Baadhitaanka alaabtaada...",
    gatheringTitle: "Faahfaahinta Alaabta",
    gatheringSubtitle: "Fadlan xaqiiji ama buuxi faahfaahinta hoose:",
    labels: {
      name: "Magaca Alaabta",
      specs: "Sifooyinka Muhiimka ah",
      condition: "Xaaladda",
      oldPrice: "Qiimihii Hore",
      newPrice: "Qiimihii Danbe",
      contact: "Nambarka / Magaca Bakhaarka"
    },
    placeholders: {
      name: "tusaale, iPhone 12 Pro Max",
      specs: "tusaale, 256GB Storage, 100% Battery",
      condition: "tusaale, Boxed, Used",
      oldPrice: "tusaale, $800",
      newPrice: "tusaale, $650",
      contact: "tusaale, Guheed, +252-61XXXXXX..."
    },
    generateBtn: "Samee Flyer-ka",
    generating: "Diyaarinta flyer-kaaga xirfadaysan...",
    readyTitle: "Flyer-kaagii waa diyaar!",
    editPrompt: "Ma rabtaa inaad wax ka beddesho? Isku day: 'Ku dar calaamad qiimo dhimis ah' ama 'Ka dhig mid qaali u eg'",
    editBtn: "Codso Beddelka",
    editing: "Cusboonaysiinta flyer-ka...",
    reset: " Fur Flyer Cusub",
    download: "Soo deji Flyer-ka"
  }
};

// --- App Component ---

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [state, setState] = useState<AppState>('idle');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedFlyer, setGeneratedFlyer] = useState<string | null>(null);
  const [details, setDetails] = useState<ProductDetails>({
    name: '',
    specs: '',
    condition: '',
    oldPrice: '',
    newPrice: '',
    contact: ''
  });
  const [editPrompt, setEditPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  // --- Gemini Logic ---

  const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const analyzeImage = async (base64Data: string) => {
    setState('analyzing');
    setError(null);
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data.split(',')[1] } },
            { text: "Analyze this product image and extract the following details in JSON format: name, specs (brief), condition (guess based on appearance), suggestedOldPrice, suggestedNewPrice. Return ONLY the JSON." }
          ]
        },
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setDetails(prev => ({
        ...prev,
        name: result.name || '',
        specs: result.specs || '',
        condition: result.condition || '',
        oldPrice: result.suggestedOldPrice || '',
        newPrice: result.suggestedNewPrice || ''
      }));
      setState('gathering');
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze image. Please fill in details manually.");
      setState('gathering');
    }
  };

  const generateFlyer = async () => {
    setState('generating');
    setError(null);
    try {
      const ai = getAI();
      const prompt = `Create a high-converting professional e-commerce flyer for this product. 
      Details to include:
      - Product Name: ${details.name}
      - Specifications: ${details.specs}
      - Condition: ${details.condition}
      - Old Price: ${details.oldPrice} (Crossed out)
      - New Sale Price: ${details.newPrice} (Bold and highlighted)
      - Store/Contact: ${details.contact}
      
      Design Rules:
      - Centered product image.
      - High contrast layout (Red and White boxes for pricing).
      - Professional retail aesthetic.
      - Clear call to action footer.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: originalImage!.split(',')[1] } },
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedFlyer(`data:image/png;base64,${part.inlineData.data}`);
          setState('ready');
          return;
        }
      }
      throw new Error("No image generated");
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate flyer. Please try again.");
      setState('gathering');
    }
  };

  const applyEdit = async () => {
    if (!editPrompt.trim()) return;
    setState('editing');
    setError(null);
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/png", data: (generatedFlyer || originalImage)!.split(',')[1] } },
            { text: editPrompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedFlyer(`data:image/png;base64,${part.inlineData.data}`);
          setState('ready');
          setEditPrompt('');
          return;
        }
      }
      throw new Error("No image generated");
    } catch (err) {
      console.error("Edit error:", err);
      setError("Failed to update flyer. Please try another prompt.");
      setState('ready');
    }
  };

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetApp = () => {
    setState('idle');
    setOriginalImage(null);
    setGeneratedFlyer(null);
    setDetails({
      name: '',
      specs: '',
      condition: '',
      oldPrice: '',
      newPrice: '',
      contact: ''
    });
    setError(null);
  };

  // --- UI Components ---

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-black/5 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">{t.title}</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#9E9E9E] font-semibold mt-1">{t.subtitle}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setLang(lang === 'en' ? 'so' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green/10 hover:bg-black/5 transition-colors text-sm font-medium"
          >
            <Languages className="w-4 h-4" />
            {lang === 'en' ? 'AF-Somali' : 'English'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
        <AnimatePresence mode="wait">
          {/* Idle State: Upload */}
          {state === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="max-w-md">
                <h2 className="text-3xl font-light mb-4">{t.greeting}</h2>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative mt-8 p-12 border-2 border-dashed border-black/10 rounded-3xl bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-medium">{t.uploadPrompt}</p>
                    <p className="text-sm text-[#9E9E9E]">PNG, JPG up to 10MB</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-4 text-[#9E9E9E]">
                  <div className="h-px w-12 bg-black/10" />
                  <span className="text-xs uppercase tracking-widest font-bold">OR</span>
                  <div className="h-px w-12 bg-black/10" />
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-8 flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-semibold hover:bg-black/80 transition-all active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  {t.cameraPrompt}
                </button>
              </div>
            </motion.div>
          )}

          {/* Analyzing State */}
          {state === 'analyzing' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <p className="mt-6 text-xl font-medium animate-pulse">{t.analyzing}</p>
            </motion.div>
          )}

          {/* Gathering State: Form */}
          {state === 'gathering' && (
            <motion.div 
              key="gathering"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{t.gatheringTitle}</h2>
                  <p className="text-[#9E9E9E] mt-2">{t.gatheringSubtitle}</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest font-bold text-[#9E9E9E] ml-1">
                        {t.labels[key as keyof typeof t.labels]}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                          placeholder={t.placeholders[key as keyof typeof t.placeholders]}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                        {key === 'name' && <ShoppingCart className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />}
                        {key === 'contact' && <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />}
                        {(key === 'oldPrice' || key === 'newPrice') && <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />}
                        {key === 'condition' && <Box className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />}
                        {key === 'specs' && <Info className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />}
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button 
                  onClick={generateFlyer}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5" />
                  {t.generateBtn}
                </button>
              </div>

              <div className="sticky top-24">
                <div className="aspect-[3/4] rounded-3xl bg-white border border-black/5 overflow-hidden shadow-2xl relative group">
                  <img 
                    src={originalImage!} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setState('idle')}
                      className="px-4 py-2 bg-white rounded-full text-sm font-bold flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Generating State */}
          {state === 'generating' && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative w-32 h-32">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-dashed border-emerald-600 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-emerald-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-8 text-2xl font-light tracking-tight">{t.generating}</p>
            </motion.div>
          )}

          {/* Ready State: Preview & Edit */}
          {(state === 'ready' || state === 'editing') && (
            <motion.div 
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">{t.readyTitle}</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">Promotional Flyer</h2>
                </div>

                <div className="p-6 bg-white border border-black/5 rounded-3xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-[#9E9E9E]">
                      {t.editPrompt}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="e.g., Add a Christmas theme..."
                        className="flex-1 px-4 py-3 bg-[#F5F5F5] border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        disabled={state === 'editing'}
                      />
                      <button 
                        onClick={applyEdit}
                        disabled={state === 'editing' || !editPrompt.trim()}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {state === 'editing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {t.editBtn}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Add retro filter', 'Make it blue', 'Add "Limited Offer"', 'Remove background'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setEditPrompt(suggestion)}
                        className="px-3 py-1.5 bg-[#F5F5F5] hover:bg-emerald-50 text-[#9E9E9E] hover:text-emerald-600 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-emerald-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedFlyer!;
                      link.download = `flyer-${details.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                      link.click();
                    }}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-5 h-5" />
                    {t.download}
                  </button>
                  <button 
                    onClick={resetApp}
                    className="px-8 py-4 border border-black/10 rounded-2xl font-bold hover:bg-black/5 transition-all"
                  >
                    {t.reset}
                  </button>
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-[3/4] rounded-3xl bg-white border border-black/5 overflow-hidden shadow-2xl">
                  {state === 'editing' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                      <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin" />
                      <p className="mt-4 font-medium">{t.editing}</p>
                    </div>
                  ) : (
                    <img 
                      src={generatedFlyer!} 
                      alt="Generated Flyer" 
                      className="w-full h-full object-contain bg-[#F5F5F5]"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl rotate-12"
                >
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold tracking-tighter opacity-80">SALE</p>
                    <p className="text-xl font-black leading-none">{details.newPrice.split(' ')[0]}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-black/5 text-center text-[#9E9E9E] text-xs uppercase tracking-[0.2em] font-bold">
         copyright by Guheed &copy; 2024
      </footer>
    </div>
  );
}
