import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Point = {
    x: number;
    y: number;
}

// id is client-generated and optional: shapes replayed from the database
// predate it, and only echoes need to be matched against what we already hold.
type Shape = {
    id?: string;
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    id?: string;
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    id?: string;
    type: "pencil";
    points: Point[];
}

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private pencilPoints: Point[] = [];
    private selectedTool: Tool = "circle";

    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsed = JSON.parse(message.message)

                // An erase is a tombstone, not a deletion: the shape stays in
                // the log and is filtered out on replay.
                if (parsed.erase) {
                    const before = this.existingShapes.length;
                    this.existingShapes = this.existingShapes.filter(s => s.id !== parsed.erase);
                    if (this.existingShapes.length !== before) {
                        this.clearCanvas();
                    }
                    return;
                }

                const shape: Shape = parsed.shape;

                // The server broadcasts to everyone in the room, sender
                // included. We already added our own shapes optimistically,
                // so drop anything we are holding to avoid storing it twice.
                if (shape.id && this.existingShapes.some(s => s.id === shape.id)) {
                    return;
                }

                this.existingShapes.push(shape)
                this.clearCanvas();
            }
        }
    }

    // Shapes are stroked outlines, so "touching" one means being near its
    // edge rather than inside its bounds.
    private static HIT_TOLERANCE = 8;

    private distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            return Math.hypot(px - x1, py - y1);
        }

        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    private isNearShape(shape: Shape, px: number, py: number) {
        const tolerance = Game.HIT_TOLERANCE;

        if (shape.type === "rect") {
            // width/height go negative when dragged up or left, so normalise
            // before treating these as edges.
            const left = Math.min(shape.x, shape.x + shape.width);
            const right = Math.max(shape.x, shape.x + shape.width);
            const top = Math.min(shape.y, shape.y + shape.height);
            const bottom = Math.max(shape.y, shape.y + shape.height);

            return this.distanceToSegment(px, py, left, top, right, top) <= tolerance
                || this.distanceToSegment(px, py, right, top, right, bottom) <= tolerance
                || this.distanceToSegment(px, py, right, bottom, left, bottom) <= tolerance
                || this.distanceToSegment(px, py, left, bottom, left, top) <= tolerance;
        }

        if (shape.type === "circle") {
            const distance = Math.hypot(px - shape.centerX, py - shape.centerY);
            return Math.abs(distance - Math.abs(shape.radius)) <= tolerance;
        }

        for (let i = 1; i < shape.points.length; i++) {
            const a = shape.points[i - 1];
            const b = shape.points[i];
            if (!a || !b) {
                continue;
            }
            if (this.distanceToSegment(px, py, a.x, a.y, b.x, b.y) <= tolerance) {
                return true;
            }
        }

        return false;
    }

    private eraseAt(px: number, py: number) {
        // Topmost first, so the eraser takes the shape you can actually see.
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];
            if (!shape || !this.isNearShape(shape, px, py)) {
                continue;
            }

            this.existingShapes.splice(i, 1);
            this.clearCanvas();

            // Removing it locally means a continued drag won't match it again,
            // so this fires once per shape.
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ erase: shape.id }),
                roomId: this.roomId
            }));
            return;
        }
    }

    drawShape(shape: Shape) {
        this.ctx.strokeStyle = "rgba(255, 255, 255)"

        if (shape.type === "rect") {
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "circle") {
            this.ctx.beginPath();
            this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (shape.type === "pencil") {
            this.drawPencil(shape.points);
        }
    }

    drawPencil(points: Point[]) {
        const first = points[0];
        if (!first) {
            return;
        }

        this.ctx.strokeStyle = "rgba(255, 255, 255)"
        this.ctx.beginPath();
        this.ctx.moveTo(first.x, first.y);
        for (const point of points.slice(1)) {
            this.ctx.lineTo(point.x, point.y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.map((shape) => {
            this.drawShape(shape);
        })
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true
        this.startX = e.clientX
        this.startY = e.clientY

        if (this.selectedTool === "pencil") {
            this.pencilPoints = [{ x: e.clientX, y: e.clientY }];
        }

        if (this.selectedTool === "eraser") {
            this.eraseAt(e.clientX, e.clientY);
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        if (!this.clicked) {
            return;
        }
        this.clicked = false

        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;

        if (selectedTool === "rect") {

            shape = {
                id: crypto.randomUUID(),
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            shape = {
                id: crypto.randomUUID(),
                type: "circle",
                radius: radius,
                centerX: this.startX + radius,
                centerY: this.startY + radius,
            }
        } else if (selectedTool === "pencil") {
            const points = this.pencilPoints;
            this.pencilPoints = [];

            // A click without a drag is not a stroke.
            if (points.length < 2) {
                return;
            }

            shape = {
                id: crypto.randomUUID(),
                type: "pencil",
                points
            }
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId: this.roomId
        }))
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) {
            return;
        }

        if (this.selectedTool === "pencil") {
            this.pencilPoints.push({ x: e.clientX, y: e.clientY });
            this.clearCanvas();
            this.drawPencil(this.pencilPoints);
            return;
        }

        // Drag to erase everything the cursor passes over.
        if (this.selectedTool === "eraser") {
            this.eraseAt(e.clientX, e.clientY);
            return;
        }

        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        this.clearCanvas();
        this.ctx.strokeStyle = "rgba(255, 255, 255)"

        if (this.selectedTool === "rect") {
            this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            const centerX = this.startX + radius;
            const centerY = this.startY + radius;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)

    }
}
