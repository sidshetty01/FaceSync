import Link from "next/link";
import { UserCheck, LogIn, ShieldAlert } from "lucide-react";

export default function HomePage() {
  return (
    <main className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-screen flex flex-col relative overflow-hidden text-white">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[100px]" />
        <div className="absolute top-[60%] right-[5%] w-[30%] h-[50%] rounded-full bg-indigo-500 blur-[120px]" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="w-full p-6 flex justify-end z-10">
        <Link
          href="/signin?type=proctor"
          className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span className="font-semibold tracking-wide text-red-50">Proctor Login</span>
        </Link>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mb-6 shadow-2xl shadow-blue-500/30">
            <UserCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-100 drop-shadow-sm">
            Cloud Attendance
          </h1>
          <p className="text-xl text-blue-200/80 font-medium max-w-2xl mx-auto">
            Powered by AWS S3 & Rekognition
          </p>
        </div>

        {/* Action Cards */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
          
          {/* Card 1: Face Recognition Kiosk */}
          <Link href="/student/demo-session" className="group flex-1">
            <div className="h-full relative p-8 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 flex flex-col items-center justify-center text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <UserCheck className="w-12 h-12 text-blue-300" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Students Face Recognition for Attendance
              </h2>
              <p className="text-blue-200/70 text-sm md:text-base">
                Step up to the Kiosk to automatically mark your attendance for the current timetable subject.
              </p>
            </div>
          </Link>

          {/* Card 2: Student Login */}
          <Link href="/signin?type=student" className="group flex-1">
            <div className="h-full relative p-8 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 flex flex-col items-center justify-center text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <LogIn className="w-12 h-12 text-emerald-300" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Student Login
              </h2>
              <p className="text-emerald-200/70 text-sm md:text-base">
                Log in to securely view your cloud attendance records and verify your history.
              </p>
            </div>
          </Link>

        </div>
      </div>
      
      {/* Footer */}
      <div className="p-6 text-center z-10">
        <p className="text-blue-200/40 text-sm font-medium tracking-wide">
          VI SEMESTER 'AI & DS' SECURE ATTENDANCE SYSTEM
        </p>
      </div>
    </main>
  );
}
