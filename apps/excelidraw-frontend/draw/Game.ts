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
                const parsedShape = JSON.parse(message.message)
                const shape: Shape = parsedShape.shape;

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
