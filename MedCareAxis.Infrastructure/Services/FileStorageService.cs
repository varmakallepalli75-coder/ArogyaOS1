using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;

namespace MedCareAxis.Infrastructure.Services;

public interface IFileStorageService
{
    Task<string> UploadAsync(string key, byte[] content, string contentType);
    Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry);
    Task DeleteAsync(string key);
}

public class R2FileStorageService : IFileStorageService
{
    private readonly IAmazonS3 _client;
    private readonly string _bucketName;

    public R2FileStorageService(IConfiguration config)
    {
        var accountId = config["R2:AccountId"] ?? "";
        _bucketName = config["R2:BucketName"] ?? "";

        _client = new AmazonS3Client(
            config["R2:AccessKeyId"],
            config["R2:SecretAccessKey"],
            new AmazonS3Config
            {
                ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true
            });
    }

    public async Task<string> UploadAsync(string key, byte[] content, string contentType)
    {
        using var stream = new MemoryStream(content);
        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType
        });
        return key;
    }

    public Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry)
    {
        var url = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Expires = DateTime.UtcNow.Add(expiry)
        });
        return Task.FromResult(url);
    }

    public async Task DeleteAsync(string key)
    {
        await _client.DeleteObjectAsync(_bucketName, key);
    }
}
