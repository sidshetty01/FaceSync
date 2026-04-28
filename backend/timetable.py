from datetime import datetime

# Timetable for VI SEMESTER 'AI & DS'
# Mapped to 24-hour format
TIMETABLE = {
    "Monday": [
        {"start": "08:00", "end": "09:00", "subject": "Open Elective (OE)"},
        {"start": "09:00", "end": "10:00", "subject": "Real Time Big Data Analytics (RTBDA)"},
        {"start": "10:30", "end": "11:30", "subject": "Computer Networks (CN)"},
        {"start": "14:00", "end": "16:00", "subject": "Soft Skills (D1&D2)"}
    ],
    "Tuesday": [
        {"start": "10:30", "end": "11:30", "subject": "Computer Networks (CN)"},
        {"start": "11:30", "end": "12:30", "subject": "RTBDA (Study Hour)"},
        {"start": "14:00", "end": "15:00", "subject": "CN (Study Hour)"},
        {"start": "15:00", "end": "16:00", "subject": "CC/DDSM (Study Hour)"},
        {"start": "16:00", "end": "17:00", "subject": "CC (Study Hour)"}
    ],
    "Wednesday": [
        {"start": "08:00", "end": "09:00", "subject": "Open Elective (OE)"},
        {"start": "09:00", "end": "10:00", "subject": "DDSM / CC"},
        {"start": "10:30", "end": "11:30", "subject": "Real Time Big Data Analytics (RTBDA)"},
        {"start": "11:30", "end": "12:30", "subject": "Computer Networks (CN)"},
        {"start": "14:00", "end": "17:00", "subject": "STRIVER"}
    ],
    "Thursday": [
        {"start": "08:00", "end": "10:00", "subject": "CN Lab (D1) / IOT Lab (D2)"},
        {"start": "14:00", "end": "16:00", "subject": "IOT Lab (D1) / RTBDA Lab (D2)"},
        {"start": "17:15", "end": "18:45", "subject": "NCMC"}
    ],
    "Friday": [
        {"start": "08:00", "end": "09:00", "subject": "Open Elective (OE)"},
        {"start": "09:00", "end": "10:00", "subject": "DDSM / CC"},
        {"start": "10:30", "end": "12:30", "subject": "CN Lab (D2) / RTBDA Lab (D1)"},
        {"start": "17:15", "end": "18:45", "subject": "NCMC"}
    ],
    "Saturday": [
        {"start": "09:00", "end": "10:00", "subject": "Distributed Data Storage Management (DDSM)"},
        {"start": "10:30", "end": "11:30", "subject": "Real Time Big Data Analytics (RTBDA)"},
        {"start": "11:30", "end": "12:30", "subject": "Indian Knowledge System (IKS)"}
    ],
    "Sunday": []
}

def get_current_subject(current_dt=None):
    """
    Returns the current subject based on the provided datetime or current server time.
    Returns None if no class is scheduled right now.
    """
    if current_dt is None:
        current_dt = datetime.now()
        
    day_name = current_dt.strftime("%A") # e.g., "Monday"
    current_time_str = current_dt.strftime("%H:%M")
    
    schedule_for_day = TIMETABLE.get(day_name, [])
    
    for session in schedule_for_day:
        if session["start"] <= current_time_str <= session["end"]:
            return session["subject"]
            
    return None

if __name__ == "__main__":
    # Test
    test_time = datetime.strptime("2026-04-28 10:45", "%Y-%m-%d %H:%M") # Tuesday 10:45 AM
    print(f"Subject at {test_time}: {get_current_subject(test_time)}") # Should be CN
