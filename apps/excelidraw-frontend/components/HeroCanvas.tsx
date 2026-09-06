"use client";

import { useEffect, useRef } from "react";

type Sketch =
    | { kind: "rect"; x: number; y: number; w: number; h: number }
    | { kind: "circle"; cx: number; cy: number; r: number }
    | { kind: "path"; points: [number, number][] };

// Laid out in a 1000x640 space and scaled to the canvas. These are the same
// three primitives the app itself draws, in the same white-on-black it uses.
const SKETCH: Sketch[] = [
    { kind: "rect", x: 560, y: 92, w: 258, h: 156 },
    { kind: "path", points: [[566, 300], [614, 286], [666, 312], [718, 282], [772, 306], [828, 288]] },
    { kind: "circle", cx: 646, cy: 452, r: 82 },
    { kind: "rect", x: 782, y: 398, w: 138, h: 120 },
    { kind: "path", points: [[566, 560], [620, 532], [670, 564], [724, 530], [778, 562], [828, 536]] },
];

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

            const sx = rect.width / 1000;
            const sy = rect.height / 640;

            ctx.clearRect(0, 0, rect.width, rect.height);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.25;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            for (const s of SKETCH) {
                ctx.beginPath();
                if (s.kind === "rect") {
                    ctx.rect(s.x * sx, s.y * sy, s.w * sx, s.h * sy);
                } else if (s.kind === "circle") {
                    ctx.arc(s.cx * sx, s.cy * sy, s.r * Math.min(sx, sy), 0, Math.PI * 2);
                } else {
                    const first = s.points[0];
                    if (!first) {
                        continue;
                    }
                    ctx.moveTo(first[0] * sx, first[1] * sy);
                    for (const point of s.points.slice(1)) {
                        ctx.lineTo(point[0] * sx, point[1] * sy);
                    }
                }
                ctx.stroke();
            }
        };

        draw();
        window.addEventListener("resize", draw);
        return () => window.removeEventListener("resize", draw);
    }, []);

    // Hidden on narrow screens, where it would sit behind the headline.
    return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 hidden h-full w-full md:block" />;
}
