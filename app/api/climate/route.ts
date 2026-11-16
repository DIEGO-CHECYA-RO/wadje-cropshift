
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const latitude = Number(searchParams.get("latitude") ?? "-9.295");
        const longitude = Number(searchParams.get("longitude") ?? "-76.008");

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180
        ) {
            return NextResponse.json(
                { error: "Coordenadas inválidas. Revisa latitud y longitud." },
                { status: 400 }
            );
        }

        const params = new URLSearchParams({
            parameters: "T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN",
            community: "AG",
            longitude: String(longitude),
            latitude: String(latitude),
            start: "2020",
            end: "2025",
            format: "JSON",
        });

        const url =
            `https://power.larc.nasa.gov/api/temporal/monthly/point?${params}`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            const details = await response.text();
            console.error("NASA POWER:", response.status, details);

            return NextResponse.json(
                {
                    error: "NASA POWER no pudo completar la consulta.",
                    details,
                },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.properties?.parameter) {
            return NextResponse.json(
                { error: "NASA no devolvió los parámetros esperados." },
                { status: 502 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Climate API error:", error);

        return NextResponse.json(
            { error: "No se pudo conectar con NASA POWER." },
            { status: 500 }
        );
    }
}
