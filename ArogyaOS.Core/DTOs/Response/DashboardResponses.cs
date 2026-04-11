namespace ArogyaOS.Core.DTOs.Response;

public class DashboardStatsResponse
{
    public int TotalPatients { get; set; }
    public int TodayAppointments { get; set; }
    public int TodayCompleted { get; set; }
    public int TodayPending { get; set; }
    public int TotalDoctors { get; set; }
    public int AvailableDoctors { get; set; }
    public int TotalDepartments { get; set; }
    public decimal TodayRevenue { get; set; }
    public int NewPatientsThisMonth { get; set; }
    public int TotalAppointmentsThisMonth { get; set; }
    public List<DepartmentStatResponse> DepartmentStats { get; set; } = new();
    public List<RecentAppointmentResponse> RecentAppointments { get; set; } = new();
    public List<MonthlyStatResponse> MonthlyStats { get; set; } = new();
}

public class DepartmentStatResponse
{
    public string DepartmentName { get; set; } = string.Empty;
    public int AppointmentCount { get; set; }
    public int DoctorCount { get; set; }
}

public class RecentAppointmentResponse
{
    public string PatientName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime AppointmentDateTime { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
}

public class MonthlyStatResponse
{
    public string Month { get; set; } = string.Empty;
    public int Appointments { get; set; }
    public int NewPatients { get; set; }
}
