using MedCareAxis.Core.Entities;
using Xunit;

namespace MedCareAxis.Tests;

public class BillCalculationTests
{
    [Fact]
    public void DueAmount_IsTotalMinusPaid()
    {
        var bill = new Bill { TotalAmount = 5000m, PaidAmount = 2000m };

        Assert.Equal(3000m, bill.DueAmount);
    }

    [Fact]
    public void DueAmount_IsZero_WhenFullyPaid()
    {
        var bill = new Bill { TotalAmount = 1200m, PaidAmount = 1200m };

        Assert.Equal(0m, bill.DueAmount);
    }

    [Fact]
    public void DueAmount_IsNegative_WhenOverpaid()
    {
        var bill = new Bill { TotalAmount = 1000m, PaidAmount = 1500m };

        Assert.Equal(-500m, bill.DueAmount);
    }
}
