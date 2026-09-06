"use client";

import { useEffect, useRef } from "react";

type Sketch =
    | { kind: "rect"; x: number; y: number; w: number; h: number; color?: string }
    | { kind: "circle"; cx: number; cy: number; r: number; color?: string }
    | { kind: "path"; points: [number, number][]; color?: string };

const INK = "#1C1B1A";
const MARKER = "#2F6BD8";

// Laid out in a 1000x640 space and scaled to the canvas.
const SKETCH: Sketch[] = [
    { kind: "rect", x: 566, y: 96, w: 252, h: 150, color: INK },
    { kind: "path", points: [[572, 300], [620, 286], [672, 312], [724, 282], [778, 306], [832, 288]], color: MARKER },
    { kind: "circle", cx: 650, cy: 452, r: 80, color: INK },
    { kind: "rect", x: 786, y: 400, w: 134, h: 116, color: MARKER },
];

// Stable pseudo-random so the wobble does not change on every resize.
function wobbler(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return (s / 4294967296 - 0.5) * 2;
    };
}

export function HeroCanvas() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) {
            return;
        }

        const draw = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, rect.width, rect.height);

            const sx = rect.width / 1000;
            const sy = rect.height / 640;
            const rand = wobbler(20260907);

            // Two passes with slightly different jitter, the way a marker
            // never lands twice in quite the same place.
            const stroke = (points: [number, number][], closed: boolean, color: string) => {
                for (let pass = 0; pass < 2; pass++) {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = pass === 0 ? 0.9 : 0.45;
                    ctx.lineWidth = 1.6;
                    ctx.lineJoin = "round";
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    points.forEach(([x, y], i) => {
                        const px = (x + rand() * 3.5) * sx;
                        const py = (y + rand() * 3.5) * sy;
                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    });
                    if (closed) {
                        ctx.closePath();
                    }
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            };

            for (const s of SKETCH) {
                const color = s.color ?? INK;
                if (s.kind === "rect") {
                    stroke([[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]], true, color);
                } else if (s.kind === "circle") {
                    // Few enough samples that the per-point jitter reads as a
                    // wobbly hand rather than a lumpy polygon.
                    const steps = 20;
                    const points: [number, number][] = [];
                    for (let i = 0; i <= steps; i++) {
                        const a = (i / steps) * Math.PI * 2;
                        points.push([s.cx + Math.cos(a) * s.r, s.cy + Math.sin(a) * s.r]);
                    }
                    stroke(points, false, color);
                } else {
                    stroke(s.points, false, color);
                }
            }
        };

        draw();
        window.addEventListener("resize", draw);
        return () => window.removeEventListener("resize", draw);
    }, []);

    // Hidden on narrow screens, where it would sit behind the headline.
    return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 hidden h-full w-full md:block" />;
}
