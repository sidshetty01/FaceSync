"use client";

import Link from "next/link";
import { UserCheck, LogIn, ShieldAlert, Sparkles, Cloud, Fingerprint } from "lucide-react";
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

      {/* Top Navigation */}
      <nav className="w-full p-6 flex justify-end z-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Link
            href="/signin?type=proctor"
            className="group flex items-center gap-2 px-6 py-2.5 bg-slate-900/50 hover:bg-slate-800/80 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-indigo-500/20"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span className="text-sm font-semibold tracking-wider text-slate-300 group-hover:text-white transition-colors uppercase">
              Proctor Access
            </span>
          </Link>
        </motion.div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-6xl mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 space-y-6 relative"
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
            <p>Powered by AWS Rekognition & Smart Timetables</p>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-stretch perspective-1000">
          
          {/* Card 1: Face Recognition Kiosk */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1"
          >
            <Link href="/student/demo-session" className="block h-full outline-none">
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group h-full relative p-8 bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md border border-white/5 hover:border-blue-500/30 rounded-3xl transition-all duration-300 shadow-xl overflow-hidden flex flex-col items-center text-center"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="w-20 h-20 bg-slate-950 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <Fingerprint className="w-10 h-10 text-blue-400 relative z-10" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-blue-300 transition-colors">
                  Kiosk Recognition
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Step up to the camera. The system will automatically detect your face and log your attendance against the current active subject.
                </p>
                
                <div className="mt-8 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  Launch Scanner
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Card 2: Student Login */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1"
          >
            <Link href="/signin?type=student" className="block h-full outline-none">
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group h-full relative p-8 bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md border border-white/5 hover:border-emerald-500/30 rounded-3xl transition-all duration-300 shadow-xl overflow-hidden flex flex-col items-center text-center"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="w-20 h-20 bg-slate-950 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <LogIn className="w-10 h-10 text-emerald-400 relative z-10" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-emerald-300 transition-colors">
                  Student Portal
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Log in to securely view your cloud attendance records, verify your history, and track your overall presence for the semester.
                </p>
                
                <div className="mt-8 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  Access Portal
                </div>
              </motion.div>
            </Link>
          </motion.div>

        </div>
      </div>
      
      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="p-6 text-center z-10 relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase">
          Department of AI & DS • VI Semester
        </p>
      </motion.div>
    </main>
  );
}
