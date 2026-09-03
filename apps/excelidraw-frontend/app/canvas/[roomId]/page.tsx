import { RoomCanvas } from "@/components/RoomCanvas";

// Next 15 hands route params to the page as a promise.
export default async function CanvasPage({ params }: {
    params: Promise<{
        roomId: string
    }>
}) {
    const roomId = (await params).roomId;

    return <RoomCanvas roomId={roomId} />
   
}