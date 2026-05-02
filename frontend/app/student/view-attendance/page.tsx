"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Calendar,
  GraduationCap
} from "lucide-react";

export default function ViewAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<{name: string, email: string} | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    const email = localStorage.getItem("userEmail");

    if (!email || userType !== "student") {
      router.push("/signin");
      return;
    }

    fetchMyAttendance(email);
  }, [router]);

  const fetchMyAttendance = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000') + `/api/student/my-summary/${email}`);
      const data = await res.json();
      if (data.success) {
        setAttendanceSummary(data.attendance);
        setStudentInfo({ name: data.student_name, email: data.email });
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">My Attendance</h1>
              <p className="text-slate-500 text-sm">Subject-wise presence report</p>
            </div>
          </div>
          
          {studentInfo && (
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {studentInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-blue-900">{studentInfo.name}</p>
                <p className="text-[10px] text-blue-600">{studentInfo.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Fetching your attendance records...</p>
          </div>
        ) : !attendanceSummary || Object.keys(attendanceSummary).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Records Found</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              You haven't been marked in any sessions yet. Once your attendance is recorded, your subject report will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
               {(() => {
                 const subjects = Object.keys(attendanceSummary);
                 const totalPresent = subjects.reduce((acc, sub) => acc + attendanceSummary[sub].present, 0);
                 const totalSessions = subjects.reduce((acc, sub) => acc + attendanceSummary[sub].total, 0);
                 const overallRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
                 
                 return (
                   <>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Subjects</p>
                        <p className="text-2xl font-bold text-slate-800">{subjects.length}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Present</p>
                        <p className="text-2xl font-bold text-slate-800">{totalPresent} <span className="text-slate-400 text-sm">/ {totalSessions}</span></p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Overall Rate</p>
                        <p className="text-2xl font-bold text-slate-800">{overallRate}%</p>
                      </div>
                    </div>
                   </>
                 )
               })()}
            </div>

            {/* Detailed Subject List */}
            <h2 className="text-lg font-bold text-slate-800 mt-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Subject-wise Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(attendanceSummary).map(([subject, stats]: [string, any]) => {
                const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                return (
                  <div key={subject} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 text-lg">{subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {percentage}% Attendance
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Sessions Attended</span>
                        <span className="font-bold text-slate-800">{stats.present} <span className="text-slate-400 font-normal">of {stats.total}</span></span>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center gap-2">
                        {percentage < 75 ? (
                          <div className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold uppercase">
                            <XCircle className="w-3 h-3" />
                            Below Requirement (75%)
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            On Track
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
