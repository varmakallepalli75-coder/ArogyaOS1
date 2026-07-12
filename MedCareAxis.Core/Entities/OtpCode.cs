using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class OtpCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public OtpPurpose Purpose { get; set; }
    public string Identifier { get; set; } = string.Empty;   // normalized mobile (digits only) or lowercased email
    public string CodeHash { get; set; } = string.Empty;     // SHA-256(code + pepper) — never store plaintext
    public int Attempts { get; set; }
    public bool Consumed { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
