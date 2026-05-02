"use client";

import Link from "next/link";
import { UserCheck, LogIn, ShieldAlert, Sparkles, Cloud, Fingerprint, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-slate-200 selection:bg-blue-500/30">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep ambient glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-purple-600/10 blur-[100px] mix-blend-screen" />
        
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-6xl mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 space-y-6 relative"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 rounded-3xl mb-4 shadow-2xl shadow-blue-900/20 relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Cloud className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-100 to-slate-300">
              OmniSight
            </span>
            <br />
            <span className="text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mt-2 block">
              Attendance System
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-slate-400 font-medium max-w-2xl mx-auto text-lg">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <p>High-Precision AWS Facial Recognition & AI Management</p>
          </div>
        </motion.div>

        {/* Centralized Access Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Link href="/signin" className="block outline-none group">
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="relative p-10 bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md border border-white/10 hover:border-blue-500/40 rounded-[2.5rem] transition-all duration-300 shadow-2xl overflow-hidden flex flex-col items-center text-center"
            >
              {/* Dynamic Aura */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-24 h-24 bg-slate-950 border border-blue-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-500">
                <LogIn className="w-12 h-12 text-blue-400" />
              </div>
              
              <h2 className="text-3xl font-black mb-4 text-white tracking-tight">
                System Access
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-10">
                Secure gateway for students and proctors. Access your attendance records and management tools.
              </p>
              
              <div className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-300 shadow-lg shadow-blue-900/40 group-hover:shadow-blue-600/30">
                <span>Sign In to System</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
      
      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="p-8 text-center z-10 relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase">
          AI & Data Science • Internal Administration
        </p>
      </motion.div>
    </main>
  );
}
