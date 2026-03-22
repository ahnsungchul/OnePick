"use server";

import prisma from "@/lib/prisma";

/**
 * 특정 견적 요청과 관련된 채팅 메시지 목록을 가져옵니다.
 */
export async function getChatMessagesAction(estimateId: string, user1Id: number, user2Id: number) {
  try {
    const messages = await prisma.chat.findMany({
      where: {
        estimateId,
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ]
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    // 상대방이 보낸 메시지 중 읽지 않은 것은 읽음 처리
    const unreadMessagesIds = messages
      .filter((msg: any) => msg.receiverId === user1Id && !msg.isRead)
      .map((msg: any) => msg.id);

    if (unreadMessagesIds.length > 0) {
      await prisma.chat.updateMany({
        where: { id: { in: unreadMessagesIds } },
        data: { isRead: true }
      });
    }

    return { success: true, data: messages };
  } catch (error: any) {
    console.error("getChatMessagesAction error:", error);
    return { success: false, error: "메시지를 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 새로운 채팅 메시지를 보냅니다.
 */
export async function sendChatMessageAction({
  estimateId,
  senderId,
  receiverId,
  message
}: {
  estimateId: string;
  senderId: number;
  receiverId: number;
  message: string;
}) {
  try {
    const newChat = await prisma.chat.create({
      data: {
        estimateId,
        senderId,
        receiverId,
        message,
        isRead: false
      }
    });

    return { success: true, data: newChat };
  } catch (error: any) {
    console.error("sendChatMessageAction error:", error);
    return { success: false, error: "메시지를 전송하는 중 오류가 발생했습니다." };
  }
}
