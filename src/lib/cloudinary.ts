import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    resourceType: 'image' | 'video' | 'raw';
}

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder to upload to (e.g., 'blog', 'events', 'plaquettes')
 * @param env - Environment object for Cloudflare Workers
 * @param options - Additional upload options
 */
export const uploadImage = async (
    file: string | Buffer,
    folder: string = 'cem-group',
    env?: any,
    options: any = {}
): Promise<UploadResult> => {
    try {
        // Configure with env if provided (Cloudflare Workers)
        const config = {
            cloud_name: env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
            api_key: env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
            api_secret: env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
        };
        cloudinary.config(config);

        const result = await cloudinary.uploader.upload(file as string, {
            folder,
            resource_type: 'image',
            type: 'upload',
            access_mode: 'public',
            transformation: [
                { quality: 'auto', fetch_format: 'auto' },
            ],
            ...options,
        });

        return {
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resourceType: 'image',
        };
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw error;
    }
};

/**
 * Upload a video to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder to upload to
 * @param options - Additional upload options
 */
export const uploadVideo = async (
    file: string | Buffer,
    folder: string = 'cem-group/videos',
    options: any = {}
): Promise<UploadResult> => {
    try {
        const result = await cloudinary.uploader.upload(file as string, {
            folder,
            resource_type: 'video',
            type: 'upload',
            access_mode: 'public',
            ...options,
        });

        return {
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resourceType: 'video',
        };
    } catch (error) {
        console.error('Error uploading video to Cloudinary:', error);
        throw error;
    }
};

/**
 * Upload a PDF or other raw file to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder to upload to
 * @param env - Environment object for Cloudflare Workers
 * @param options - Additional upload options
 */
export const uploadPDF = async (
    file: string | Buffer,
    folder: string = 'cem-group/plaquettes',
    env?: any,
    options: any = {}
): Promise<UploadResult> => {
    try {
        // Configure with env if provided
        const config = {
            cloud_name: env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
            api_key: env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
            api_secret: env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
        };
        cloudinary.config(config);

        const result = await cloudinary.uploader.upload(file as string, {
            folder,
            resource_type: 'raw',
            type: 'upload',
            access_mode: 'public',
            ...options,
        });

        return {
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            resourceType: 'raw',
        };
    } catch (error) {
        console.error('Error uploading PDF to Cloudinary:', error);
        throw error;
    }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - Type of resource (image, video, raw)
 */
export const deleteFile = async (
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw error;
    }
};

/**
 * Generate a thumbnail for a PDF
 * @param publicId - The public ID of the PDF
 */
export const generatePDFThumbnail = (publicId: string): string => {
    return cloudinary.url(publicId, {
        format: 'jpg',
        page: 1,
        width: 400,
        height: 566,
        crop: 'fill',
    });
};

/**
 * Get optimized image URL with transformations
 * @param publicId - The public ID of the image
 * @param width - Desired width
 * @param height - Desired height
 * @param crop - Crop mode
 */
export const getOptimizedImageUrl = (
    publicId: string,
    width?: number,
    height?: number,
    crop: string = 'fill'
): string => {
    return cloudinary.url(publicId, {
        width,
        height,
        crop,
        quality: 'auto',
        fetch_format: 'auto',
    });
};

/**
 * Generate a signed URL for a private file
 */
export const getSignedUrl = (
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
    type: 'upload' | 'authenticated' | 'private' = 'upload',
    version?: string,
    format?: string,
    env?: any
): string => {
    try {
        const config = {
            cloud_name: env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
            api_key: env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
            api_secret: env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
        };
        cloudinary.config(config);

        const options: any = {
            resource_type: resourceType,
            type: type,
            sign_url: true,
            secure: true,
        };

        if (version) options.version = version;
        if (format) options.format = format;

        return cloudinary.url(publicId, options);
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return '';
    }
};

/**
 * Generate a Cloudinary API download URL for any resource (works for authenticated AND upload types).
 * Uses the same signing mechanism as uploads (which we know works).
 * This is equivalent to the SDK's `private_download_url()`.
 */
export const generateApiDownloadUrl = async (
    originalUrl: string,
    env: { CLOUDINARY_CLOUD_NAME: string; CLOUDINARY_API_KEY: string; CLOUDINARY_API_SECRET: string }
): Promise<string | null> => {
    const extracted = extractPublicIdFromUrl(originalUrl);
    if (!extracted) return null;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    let publicId = extracted.publicId;

    // Build params to sign
    const params: Record<string, string> = {
        public_id: publicId,
        timestamp: timestamp,
        type: extracted.type || 'upload',
    };

    // For image/video resources, format is separate from publicId
    if (extracted.resourceType !== 'raw' && extracted.format) {
        params.format = extracted.format;
    }

    // Sign: sort alphabetically, join as key=value&, append secret, SHA-1 → hex
    const sortedString = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

    const stringToSign = sortedString + env.CLOUDINARY_API_SECRET;

    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    let subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        const nodeCrypto = await import('node:crypto');
        // @ts-ignore
        subtle = nodeCrypto.webcrypto.subtle;
    }
    const hashBuffer = await subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Build download URL
    const queryParams = new URLSearchParams({
        ...params,
        api_key: env.CLOUDINARY_API_KEY,
        signature: signature,
    });

    return `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${extracted.resourceType}/download?${queryParams.toString()}`;
};

/**
 * Extract details from a Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): {
    publicId: string,
    resourceType: 'image' | 'video' | 'raw',
    type: 'upload' | 'authenticated' | 'private',
    version?: string,
    format?: string
} | null => {
    try {
        if (!url || !url.includes('cloudinary.com')) return null;

        const parts = url.split('/');
        let typeIndex = -1;
        let type: 'upload' | 'authenticated' | 'private' = 'upload';

        if (parts.includes('upload')) { typeIndex = parts.indexOf('upload'); type = 'upload'; }
        else if (parts.includes('authenticated')) { typeIndex = parts.indexOf('authenticated'); type = 'authenticated'; }
        else if (parts.includes('private')) { typeIndex = parts.indexOf('private'); type = 'private'; }

        if (typeIndex === -1) return null;

        const resourceTypeStr = parts[typeIndex - 1];
        let resourceType: 'image' | 'video' | 'raw' = 'image';
        if (['image', 'video', 'raw'].includes(resourceTypeStr)) {
            resourceType = resourceTypeStr as any;
        }

        const remainingParts = parts.slice(typeIndex + 1);
        let version: string | undefined;
        let publicIdPath = remainingParts.join('/');

        if (remainingParts.length > 0 && remainingParts[0].match(/^v\d+$/)) {
            version = remainingParts[0].replace('v', '');
            publicIdPath = remainingParts.slice(1).join('/');
        }

        let format: string | undefined;
        if (resourceType !== 'raw') {
            const lastDotIndex = publicIdPath.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                format = publicIdPath.substring(lastDotIndex + 1);
                publicIdPath = publicIdPath.substring(0, lastDotIndex);
            }
        }

        return {
            publicId: decodeURIComponent(publicIdPath),
            resourceType,
            type,
            version,
            format
        };
    } catch (e) {
        console.error('Error extracting public ID:', e);
        return null;
    }
};

export default cloudinary;
