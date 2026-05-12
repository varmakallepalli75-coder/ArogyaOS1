using ArogyaOS.Core.Enums;
namespace ArogyaOS.Core.DTOs.Request;

public class CreateLabTestRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Department { get; set; }
    public int SampleType { get; set; }
    public string? Description { get; set; }
    public int? TurnAroundTimeHours { get; set; }
    public decimal Price { get; set; }
    public bool IsOutsourced { get; set; }
    public List<LabTestParameterRequest> Parameters { get; set; } = new();
}

public class LabTestParameterRequest
{
    public string ParameterName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? NormalRangeMale { get; set; }
    public string? NormalRangeFemale { get; set; }
    public string? NormalRangeChild { get; set; }
    public string? Method { get; set; }
    public int SortOrder { get; set; }
}

public class CreateLabOrderRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? AdmissionId { get; set; }
    public Guid? OPDVisitId { get; set; }
    public List<Guid> TestIds { get; set; } = new();
    public int Priority { get; set; } = 1;
    public string? ClinicalNotes { get; set; }
}

public class CollectSampleRequest
{
    public Guid OrderId { get; set; }
    public string? SampleBarcode { get; set; }
    public string? CollectedBy { get; set; }
}

public class EnterResultsRequest
{
    public Guid OrderId { get; set; }
    public List<LabResultEntry> Results { get; set; } = new();
    public string? TechnicianNotes { get; set; }
}

public class LabResultEntry
{
    public Guid LabOrderItemId { get; set; }
    public Guid LabTestParameterId { get; set; }
    public string? Value { get; set; }
    public bool IsAbnormal { get; set; }
    public bool IsHigh { get; set; }
    public bool IsLow { get; set; }
    public string? Notes { get; set; }
}

public class ReportLabOrderRequest
{
    public Guid OrderId { get; set; }
    public string? ReportedBy { get; set; }
    public string? TechnicianNotes { get; set; }
}
