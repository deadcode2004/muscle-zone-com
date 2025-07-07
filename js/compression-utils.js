// Compression Utilities
class CompressionUtils {
  constructor() {
    this.compressionSupported = typeof CompressionStream !== 'undefined';
    this.decompressionSupported = typeof DecompressionStream !== 'undefined';
    this.brotliSupported = this.checkBrotliSupport();
  }

  checkBrotliSupport() {
    try {
      return typeof CompressionStream !== 'undefined' && 
             new CompressionStream('br') instanceof CompressionStream;
    } catch {
      return false;
    }
  }

  // Compress data using best available method
  async compress(data, format = 'auto') {
    if (!this.compressionSupported) {
      console.warn('CompressionStream is not supported');
      return data;
    }

    try {
      const blob = new Blob([data]);
      let compressionFormat = format;

      // If format is auto, choose best available
      if (format === 'auto') {
        compressionFormat = this.brotliSupported ? 'br' : 'gzip';
      }

      // Fallback to gzip if requested format is not supported
      if (compressionFormat === 'br' && !this.brotliSupported) {
        console.warn('Brotli compression not supported, falling back to gzip');
        compressionFormat = 'gzip';
      }

      const compressedStream = blob.stream().pipeThrough(new CompressionStream(compressionFormat));
      return {
        blob: await new Response(compressedStream).blob(),
        format: compressionFormat
      };
    } catch (error) {
      console.error('Compression failed:', error);
      return {
        blob: data,
        format: 'identity'
      };
    }
  }

  // Decompress data based on format
  async decompress(compressedData, format) {
    if (!this.decompressionSupported) {
      console.warn('DecompressionStream is not supported');
      return compressedData;
    }

    if (!format || format === 'identity') {
      return compressedData;
    }

    try {
      const compressedStream = compressedData.stream().pipeThrough(new DecompressionStream(format));
      return new Response(compressedStream).blob();
    } catch (error) {
      console.error(`Decompression failed for format ${format}:`, error);
      return compressedData;
    }
  }

  // Check if response should be compressed
  shouldCompress(response) {
    if (!response || !response.headers) {
      return false;
    }

    const contentType = response.headers.get('content-type') || '';
    const contentEncoding = response.headers.get('content-encoding');
    const contentLength = response.headers.get('content-length');

    // Don't compress if already compressed
    if (contentEncoding && contentEncoding !== 'identity') {
      return false;
    }

    // Don't compress if content is too small (less than 1KB)
    if (contentLength && parseInt(contentLength) < 1024) {
      return false;
    }

    // Compress text-based content types
    const compressibleTypes = [
      'text/',
      'application/javascript',
      'application/json',
      'application/xml',
      'application/x-www-form-urlencoded',
      'application/graphql',
      'application/ld+json',
      'application/schema+json',
      'application/manifest+json',
      'font/',
      'image/svg+xml'
    ];

    // Check for compressible types
    const isCompressibleType = compressibleTypes.some(type => contentType.includes(type));

    // Special handling for binary types that might benefit from compression
    const compressibleBinaryTypes = [
      'application/wasm',
      'application/octet-stream'
    ];

    return isCompressibleType || compressibleBinaryTypes.some(type => contentType.includes(type));
  }

  // Create compressed response with best available compression
  async createCompressedResponse(response) {
    if (!this.shouldCompress(response)) {
      return response;
    }

    try {
      const blob = await response.blob();
      const { blob: compressedBlob, format } = await this.compress(blob, 'auto');
      
      // Create new response with compressed data
      const headers = new Headers(response.headers);
      headers.set('content-encoding', format);
      headers.set('x-compression', format);
      
      // Add vary header for content negotiation
      headers.append('vary', 'accept-encoding');

      // Add compression quality indicator
      const stats = await this.getCompressionStats(response, new Response(compressedBlob));
      if (stats) {
        headers.set('x-compression-ratio', stats.reduction);
      }
      
      return new Response(compressedBlob, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Failed to create compressed response:', error);
      return response;
    }
  }

  // Get decompressed response
  async getDecompressedResponse(response) {
    const contentEncoding = response.headers.get('content-encoding');
    const isCompressed = contentEncoding && contentEncoding !== 'identity';

    if (!isCompressed) {
      return response;
    }

    try {
      const blob = await response.blob();
      const decompressedBlob = await this.decompress(blob, contentEncoding);
      
      // Create new response with decompressed data
      const headers = new Headers(response.headers);
      headers.delete('content-encoding');
      headers.delete('x-compression');
      headers.delete('x-compression-ratio');
      
      return new Response(decompressedBlob, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Failed to decompress response:', error);
      return response;
    }
  }

  // Get size reduction percentage
  async getCompressionStats(originalResponse, compressedResponse) {
    const originalSize = parseInt(originalResponse.headers.get('content-length')) || 0;
    const compressedSize = parseInt(compressedResponse.headers.get('content-length')) || 0;
    
    if (originalSize === 0 || compressedSize === 0) {
      return null;
    }

    const reduction = ((originalSize - compressedSize) / originalSize) * 100;
    return {
      originalSize,
      compressedSize,
      reduction: reduction.toFixed(2)
    };
  }
}

// Export compression utilities
const compressionUtils = new CompressionUtils();
