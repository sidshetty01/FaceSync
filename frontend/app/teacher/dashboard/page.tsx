"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Edit3, 
  Camera, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function TeacherDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  
  // New state for student management
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentAttendance, setStudentAttendance] = useState<any | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // New state for session logs
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "sessions">("students");

  useEffect(() => {
    const checkStatus = () => {
      try {
        const loggedIn = localStorage.getItem("isLoggedIn");
        const userType = localStorage.getItem("userType");
        const name = localStorage.getItem("username");
        const empId = localStorage.getItem("employeeId");

        if (!loggedIn || loggedIn !== "true") {
          setIsLoggedIn(false);
          router.push("/signin");
        } else if (userType === "student") {
          // If a student tries to access the proctor dashboard, send them to the correct one
          router.push("/dashboard");
        } else {
          setIsLoggedIn(true);
          setTeacherName(name || "");
          setEmployeeId(empId || "");
          setLoading(false);
          fetchStudents();
          fetchSessions();
        }
      } catch {
        setIsLoggedIn(false);
        router.push("/signin");
      }
    };

    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000') + "/api/teacher/students");
        const data = await res.json();
        if (data.success) {
          setStudents(data.students);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000') + "/api/attendance/list_sessions");
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    const timeoutId = setTimeout(checkStatus, 100);
    return () => clearTimeout(timeoutId);
  }, [router]);

  const fetchStudentAttendance = async (email: string) => {
    setLoadingAttendance(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000') + `/api/teacher/student-attendance/${email}`);
      const data = await res.json();
      if (data.success) {
        setStudentAttendance(data.attendance);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000') + "/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore errors on logout
    }

    localStorage.clear();
    router.push("/");
  };

  const teacherMenuItems = [
    {
      title: "Student Registration",
      description: "Register new students with complete details and face recognition setup",
      icon: <Users className="w-7 h-7" />,
      path: "/student/registrationform",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      borderColor: "border-blue-200 hover:border-blue-300"
    },
    {
      title: "Start Teaching Session",
      description: "Begin a live attendance session with face recognition",
      icon: <Camera className="w-7 h-7" />,
      path: "/teacher/start-session",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      borderColor: "border-purple-200 hover:border-purple-300"
    },
    {
      title: "Auto Scan (Kiosk)",
      description: "Continuous automated scanning mode based on timetable",
      icon: <Camera className="w-7 h-7" />,
      path: "/teacher/auto-scan",
      color: "from-rose-500 to-red-600",
      bgColor: "bg-rose-50 hover:bg-rose-100",
      borderColor: "border-rose-200 hover:border-rose-300"
    }
  ];

  if (isLoggedIn === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-slate-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Proctor Dashboard</h1>
                  <p className="text-slate-600 text-sm font-medium">Welcome back, {teacherName}</p>
                  {employeeId && <p className="text-slate-500 text-xs">ID: {employeeId}</p>}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg">
          <div className="px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teacherMenuItems.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    router.push(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md ${item.bgColor} ${item.borderColor}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} shadow-sm`}>
                      <div className="text-white">
                        {item.icon}
                      </div>
                    </div>
                    <span className="text-slate-700 font-semibold text-sm">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Message */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Proctor Dashboard</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              Proctor Management Hub
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Manage student registrations, conduct sessions, and monitor attendance with advanced face recognition technology
            </p>
          </div>

          {/* Teacher Management Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {teacherMenuItems.map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setActiveCard(idx)}
                onMouseLeave={() => setActiveCard(null)}
                onClick={() => router.push(item.path)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer group overflow-hidden bg-white hover:shadow-xl ${
                  item.borderColor
                } ${
                  activeCard === idx ? 'scale-105 shadow-xl -translate-y-1' : 'hover:scale-105 hover:-translate-y-1'
                }`}
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color} w-fit mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <div className="text-white">
                      {item.icon}
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors">
                    {item.title}
                  </h4>
                  
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                  
                  <div className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-semibold text-sm transition-all duration-300 group-hover:gap-3 group-hover:shadow-lg group-hover:scale-105`}>
                    Get Started
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
              </div>
            ))}
          </div>

          {/* Management Hub */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-12">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setActiveTab("students")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "students" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  Students Record
                </button>
                <button 
                  onClick={() => setActiveTab("sessions")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "sessions" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  Class Logs
                </button>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={activeTab === "students" ? "Search students..." : "Search logs..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm shadow-sm"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === "students" ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department & Year</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-500 font-medium">Fetching students...</span>
                          </div>
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                          No students found.
                        </td>
                      </tr>
                    ) : students
                        .filter(s => 
                          s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((student, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-slate-600">{student.email}</td>
                        <td className="px-8 py-4 font-mono text-xs text-slate-500">{student.studentId}</td>
                        <td className="px-8 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                            {student.year} {student.department} {student.division}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setSelectedStudent(student);
                                fetchStudentAttendance(student.email);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Attendance"
                            >
                              <BarChart3 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => router.push(`/student/updatedetails?email=${student.email}`)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Data"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class Info</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingSessions ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-500 font-medium">Fetching class logs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : sessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                          No teaching sessions recorded yet.
                        </td>
                      </tr>
                    ) : sessions
                        .filter(s => 
                          s.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.date?.includes(searchTerm)
                        )
                        .map((session, idx) => {
                          const percentage = session.total_students > 0 ? Math.round((session.present_count / session.total_students) * 100) : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-8 py-4">
                                <div className="text-slate-700 font-semibold">{session.date}</div>
                                <div className="text-slate-400 text-xs">ID: {session.record_id?.substring(0, 8)}...</div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-100">
                                  {session.subject}
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="text-slate-600 text-sm font-medium">{session.year} • {session.division}</div>
                                <div className="text-slate-400 text-xs">{session.department}</div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full w-24">
                                    <div className={`h-2 rounded-full ${percentage > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }}></div>
                                  </div>
                                  <span className="font-bold text-slate-700 text-sm">{session.present_count}/{session.total_students}</span>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  percentage > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {percentage}% Present
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                  <p className="opacity-80 text-sm">Attendance Analysis • {selectedStudent.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentAttendance(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8">
                {loadingAttendance ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-medium">Analyzing records...</p>
                  </div>
                ) : studentAttendance && Object.keys(studentAttendance).length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(studentAttendance).map(([subject, stats]: [string, any]) => {
                        const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                        return (
                          <div key={subject} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-slate-700">{subject}</span>
                              <span className={`text-sm font-bold ${percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Present: {stats.present}</span>
                              <span>Total: {stats.total}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700">No Records Found</h4>
                    <p className="text-slate-500">This student hasn't attended any sessions yet.</p>
                  </div>
                )}
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentAttendance(null);
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    Close Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
