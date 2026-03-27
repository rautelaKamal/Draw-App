export function initDraw(
  canvas: HTMLCanvasElement,
  roomIdOrSocket?: string | WebSocket,
  socket?: WebSocket
): void {
  const resolvedSocket =
    typeof roomIdOrSocket === "string" ? socket : roomIdOrSocket;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Basic sanity render: clear to white.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Hook socket messages (placeholder).
  if (resolvedSocket) {
    resolvedSocket.onmessage = () => {
      // Handle incoming draw events here.
    };
  }
}

export function initDraw(
  canvas: HTMLCanvasElement,
  roomIdOrSocket?: string | WebSocket,
  socket?: WebSocket
): void {
  const resolvedSocket =
    typeof roomIdOrSocket === "string" ? socket : roomIdOrSocket;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Simple background fill to verify the canvas is wired.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (resolvedSocket) {
    resolvedSocket.addEventListener("message", () => {
      // Handle incoming draw events here.
    });
  }
}

type Shape = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}|{
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
}|{
  type: "pencil";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export async function initDraw(canvas:HTMLCanvasElement, roomId: string, socket: WebSocket){

  const ctx = canvas.getContext("2d");

  let existingShape : Shape[] =await getExistingShapes(roomId);               
  if(!ctx){
      return
      }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if(message.type == "chat") {
      const parsedShape = JSON.parse(message.message)
      existingShape.push(parsedShape.shape)
      clearCanvas(existingShape, canvas, ctx);
    }
  }
   
  clearCanvas(existingShape, canvas, ctx);    
  let clicked = false;
  let startX = 0;
  let startY = 0;
  
  
  canvas.addEventListener("mousedown",(e)=>{
      clicked = true;
      startX = e.clientX
      startY = e.clientY
  })

  canvas.addEventListener("mouseup",(e)=>{
      clicked = false;
      const width = e.clientX - startX;
      const height = e.clientY - startY;
       shape = {
        type:"rect",
        x: startX,
        y: startY,
        height,
        width
      }
      // @ts-ignore
      const selectedTool = window.SelectedTool;
      let shape: Shape | null;
      if(selectedTool == "rect"){
       const shape: Shape = {
          type:"rect",
          x: startX,
          y: startY,
          height,
          width
        }
      }   
      if(selectedTool == "circle"){
        const radius = Math.max(width, height)/2
          shape = {
          type:"circle",
          centerX: startX + width / 2,
          centerY: startY + height / 2,
          radius: Math.max(width, height)
        }
       
      }

      if(selectedTool == "pencil"){
        shape = {
          type:"pencil",
          startX: startX,
          startY: startY,
          endX: e.clientX,
          endY: e.clientY
        }

        if(!shape) {
          return;
        }
      existingShape.push(shape);

      socket.send(JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape 
        }),
          roomId
      }))
  })
  canvas.addEventListener("mousemove",(e)=>{
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      clearCanvas(existingShape,canvas,ctx);
      ctx.strokeStyle = "rgba(255,255,255)"
      const selectedTool = window.SelectedTool;
      if(selectedTool == "rect"){
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
      if(selectedTool == "circle"){
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        const radius = Math.max(width, height) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
      }      
      
  })
}

function clearCanvas(existingShapes: Shape[], canvas:HTMLCanvasElement,CanvasRenderingContext2D){
 
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "rgba(0,0,0)"
  ctx.fillRect(0,0, canvas.width, canvas.height);

  existingShapes.map((shape)=>{
    if(shape.type == "rect"){
      ctx.strokeStyle = "rgba(255, 255, 255)"
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  })
  

 async function getExistingShapes(roodId:string){
  const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
  const message = res.data.messages;
  
  const shapes = messages.map((x: {message: string}) => {
    const messageData = JSON.parse(x.message)
    return messageData.shape;
  })
 return shapes;

}


