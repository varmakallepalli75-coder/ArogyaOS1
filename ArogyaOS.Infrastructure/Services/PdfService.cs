using ArogyaOS.Core.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArogyaOS.Infrastructure.Services;

public interface IPdfService
{
    byte[] GenerateBillPdf(Bill bill, Hospital hospital);
}

public class PdfService : IPdfService
{
    static PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateBillPdf(Bill bill, Hospital hospital)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Element(c => ComposeHeader(c, hospital, bill));
                page.Content().Element(c => ComposeContent(c, bill));
                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, Hospital hospital, Bill bill)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(hospital.Name).FontSize(18).Bold().FontColor("#1e293b");
                    c.Item().Text(hospital.Address).FontColor("#64748b");
                    c.Item().Text($"{hospital.City}, {hospital.State} — {hospital.PinCode}").FontColor("#64748b");
                    c.Item().Text($"Ph: {hospital.Phone}").FontColor("#64748b");
                    if (!string.IsNullOrEmpty(hospital.GSTNumber))
                        c.Item().Text($"GSTIN: {hospital.GSTNumber}").FontColor("#64748b");
                });

                row.ConstantItem(180).Border(1).BorderColor("#e2e8f0").Padding(12).Column(c =>
                {
                    c.Item().Text("TAX INVOICE").FontSize(14).Bold().AlignCenter().FontColor("#1e293b");
                    c.Item().Height(6);
                    c.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Bill No:").FontColor("#64748b");
                        r.RelativeItem().Text(bill.BillNumber).Bold().AlignRight();
                    });
                    c.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Date:").FontColor("#64748b");
                        r.RelativeItem().Text(bill.BillDate.ToString("dd/MM/yyyy")).AlignRight();
                    });
                    c.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Status:").FontColor("#64748b");
                        r.RelativeItem().Text(bill.Status.ToString()).Bold()
                            .FontColor(bill.DueAmount > 0 ? "#ef4444" : "#10b981").AlignRight();
                    });
                });
            });

            col.Item().PaddingVertical(12).Height(1).Background("#e2e8f0");

            col.Item().Background("#f8fafc").Padding(10).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("BILL TO").FontSize(8).Bold().FontColor("#94a3b8");
                    c.Item().Text(bill.Patient?.FullName ?? "").Bold().FontSize(12);
                    c.Item().Text($"UHID: {bill.Patient?.UHID}").FontColor("#64748b");
                    if (!string.IsNullOrEmpty(bill.Patient?.MobileNumber))
                        c.Item().Text($"Ph: {bill.Patient.MobileNumber}").FontColor("#64748b");
                });
                if (bill.IsAyushman)
                {
                    row.ConstantItem(160).Column(c =>
                    {
                        c.Item().Text("AYUSHMAN BHARAT").FontSize(8).Bold().FontColor("#7c3aed");
                        c.Item().Text(bill.AyushmanCardNumber ?? "").FontColor("#7c3aed");
                    });
                }
            });

            col.Item().PaddingTop(8).Height(1).Background("#e2e8f0");
        });
    }

    private static void ComposeContent(IContainer container, Bill bill)
    {
        container.Column(col =>
        {
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(30);
                    cols.RelativeColumn(4);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(2);
                });

                table.Header(header =>
                {
                    void H(string text, bool right = false)
                    {
                        var cell = header.Cell().Background("#1e293b").Padding(6);
                        if (right)
                            cell.AlignRight().Text(text).FontColor("#fff").Bold().FontSize(9);
                        else
                            cell.Text(text).FontColor("#fff").Bold().FontSize(9);
                    }

                    H("#"); H("Description"); H("Category"); H("Unit Price", true);
                    H("Qty", true); H("GST", true); H("Amount", true);
                });

                var idx = 1;
                foreach (var item in bill.Items)
                {
                    var bg = idx % 2 == 0 ? "#f8fafc" : "#fff";

                    IContainer Cell(IContainer c) =>
                        c.Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).AlignMiddle();

                    table.Cell().Element(Cell).Text(idx.ToString()).FontColor("#94a3b8");
                    table.Cell().Element(Cell).Text(item.Description);
                    table.Cell().Element(Cell).Text(item.Category.ToString()).FontColor("#64748b");
                    table.Cell().Element(Cell).AlignRight().Text($"₹{item.UnitPrice:N2}");
                    table.Cell().Element(Cell).AlignRight().Text(item.Quantity.ToString());
                    table.Cell().Element(Cell).AlignRight()
                        .Text(item.GSTPercent > 0 ? $"{item.GSTPercent}%" : "—").FontColor("#64748b");
                    table.Cell().Element(Cell).AlignRight().Text($"₹{item.TotalAmount:N2}").Bold();
                    idx++;
                }
            });

            col.Item().Height(20);

            // Totals block
            col.Item().AlignRight().Width(260).Column(totals =>
            {
                void Row(string label, string value, bool bold = false, string color = "#1e293b")
                {
                    totals.Item().Row(r =>
                    {
                        if (bold)
                        {
                            r.RelativeItem().PaddingRight(12).Text(label).FontColor("#64748b").Bold();
                            r.ConstantItem(100).AlignRight().Text(value).Bold().FontColor(color);
                        }
                        else
                        {
                            r.RelativeItem().PaddingRight(12).Text(label).FontColor("#64748b");
                            r.ConstantItem(100).AlignRight().Text(value).FontColor(color);
                        }
                    });
                    totals.Item().Height(4);
                }

                Row("Sub Total", $"₹{bill.SubTotal:N2}");
                if (bill.DiscountAmount > 0)
                    Row($"Discount ({bill.DiscountPercent}%)", $"- ₹{bill.DiscountAmount:N2}", color: "#10b981");
                if (bill.GSTAmount > 0)
                    Row("GST", $"₹{bill.GSTAmount:N2}");
                if (bill.IsAyushman && bill.AyushmanApprovedAmount > 0)
                    Row("Ayushman Bharat", $"- ₹{bill.AyushmanApprovedAmount:N2}", color: "#7c3aed");
                if (bill.InsuranceApprovedAmount > 0)
                    Row("Insurance", $"- ₹{bill.InsuranceApprovedAmount:N2}", color: "#3b82f6");

                totals.Item().Height(1).Background("#e2e8f0");
                totals.Item().Height(4);
                Row("TOTAL AMOUNT", $"₹{bill.TotalAmount:N2}", bold: true);
                Row("Paid", $"₹{bill.PaidAmount:N2}", color: "#10b981");
                totals.Item().Height(1).Background("#e2e8f0");
                totals.Item().Height(4);
                Row("BALANCE DUE", $"₹{bill.DueAmount:N2}", bold: true,
                    color: bill.DueAmount > 0 ? "#ef4444" : "#10b981");
            });

            if (!string.IsNullOrEmpty(bill.Notes))
            {
                col.Item().Height(16);
                col.Item().Background("#fefce8").Border(1).BorderColor("#fef08a").Padding(10).Column(c =>
                {
                    c.Item().Text("Notes").Bold().FontColor("#92400e");
                    c.Item().Text(bill.Notes).FontColor("#78350f");
                });
            }
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Height(1).Background("#e2e8f0");
            col.Item().PaddingTop(8).Row(row =>
            {
                row.RelativeItem().Text("This is a computer-generated invoice.").FontColor("#94a3b8").FontSize(8);
                row.RelativeItem().AlignRight().Text("Powered by ArogyaOS").FontColor("#94a3b8").FontSize(8);
            });
        });
    }
}
