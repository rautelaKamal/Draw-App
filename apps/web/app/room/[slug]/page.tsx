
import axios from "axios";
import { HTTP_BACKEND } from "../../../config";
import { ChatRoomClient } from "../../../components/ChatRoomClient";

async function getRoomId(slug: string) {
    const response = await axios.get(`${HTTP_BACKEND}/room/${slug}`);
    return response.data.room.id;
}

async function getChats(roomId: string) {
    const response = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    return response.data.messages;
}

export default async function ChatRoom({
    params
}: {
    params: Promise<{
        slug: string
    }>
}) {
    const slug = (await params).slug;
    const messages = await getChats(slug);
    return <ChatRoomClient id={slug} messages={messages} />
}