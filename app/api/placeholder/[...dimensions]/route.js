import { NextResponse } from "next/server";

export async function GET(request, ctx) {
    const { params } = await ctx;
    const { dimensions } = params;
    const [width = "150", height = "150"] = dimensions || [];
    
    // Create a simple SVG placeholder
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f1f5f9"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" dy=".3em">
                ${width}x${height}
            </text>
        </svg>
    `;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000',
        },
    });
}
