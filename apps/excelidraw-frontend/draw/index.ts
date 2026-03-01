type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
}{
    type: "circle";
    ceterX: number;
    centerY: number;
    radius: number;
}
export function initDraw(canvas:HTMLCanvasElement){

    const ctx = canvas.getContext("2d");

    let existingShape : Shape[] = [];               
    if(!ctx){
        return
        }
     
    ctx.fillStyle = "rgba(0,0,0)"
    ctx.fillRect(0,0, canvas.width, canvas.height);    

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
        existingShapes.push({
            type:"rect",
            x: startX,
            y: startY,
            height,
            width
        })

    })
    canvas.addEventListener("mousemove",(e)=>{
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        clearCanvas(existingShape,canvas,ctx);
        ctx.strokeStyle = "rgba(255,255,255)" 
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        
        
    })
}

function clearCanvas(existingShapes: Shape[], canvas:HTMLCanvasElement,CanvasRenderingContext2D){
   
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(0,0,0)"
    ctx.fillRect(0,0, canvas.width, canvas.height);
    

    existingShapes.map((shape)=>{
        if(shape.type== "rect"){
             ctx.strokeStyle = "rgba(255,255,255)" 
             ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
    })
}
