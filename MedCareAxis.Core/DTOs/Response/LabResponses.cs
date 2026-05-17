namespace MedCareAxis.Core.DTOs.Response;

public class LabTestResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string SampleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? TurnAroundTimeHours { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public bool IsOutsourced { get; set; }
    public List<LabTestParameterResponse> Parameters { get; set; } = new();
}

public class LabTestParameterResponse
{
    public Guid Id { get; set; }
    public string ParameterName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? NormalRangeMale { get; set; }
    public string? NormalRangeFemale { get; set; }
    public string? NormalRangeChild { get; set; }
    public string? Method { get; set; }
    public int SortOrder { get; set; }
}

public class LabOrderListResponse
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public DateTime OrderedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public bool IsAbnormal { get; set; }
    public int TestCount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? SampleCollectedAt { get; set; }
    public DateTime? ReportedAt { get; set; }
}

public class LabOrderDetailResponse : LabOrderListResponse
{
    public string? ClinicalNotes { get; set; }
    public string? SampleBarcode { get; set; }
    public string? SampleCollectedBy { get; set; }
    public string? ReportedBy { get; set; }
    public string? TechnicianNotes { get; set; }
    public Guid? AdmissionId { get; set; }
    public Guid? OPDVisitId { get; set; }
    public List<LabOrderItemResponse> Items { get; set; } = new();
}

public class LabOrderItemResponse
{
    public Guid Id { get; set; }
    public Guid LabTestId { get; set; }
    public string TestCode { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public List<LabResultResponse> Results { get; set; } = new();
}

public class LabResultResponse
{
    public Guid Id { get; set; }
    public Guid LabTestParameterId { get; set; }
    public string ParameterName { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Unit { get; set; }
    public string? NormalRange { get; set; }
    public bool IsAbnormal { get; set; }
    public bool IsHigh { get; set; }
    public bool IsLow { get; set; }
    public string? Notes { get; set; }
}
